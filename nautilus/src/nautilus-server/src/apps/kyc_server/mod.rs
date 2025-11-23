mod bootstrap;
mod types;

pub use bootstrap::{complete_parameter_load, init_parameter_load, spawn_host_init_server};
pub use types::*;

use crate::common::IntentMessage;
use crate::common::{to_signed_response, IntentScope, ProcessDataRequest, ProcessedDataResponse};
use crate::AppState;
use crate::EnclaveError;
use axum::extract::State;
use axum::Json;
use fastcrypto::ed25519::Ed25519Signature;
use fastcrypto::encoding::{Encoding, Hex};
use fastcrypto::traits::{ToFromBytes, VerifyingKey};
use reqwest::Client;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::sync::Arc;
use std::time::{Duration, SystemTime, UNIX_EPOCH};

#[allow(non_snake_case)]
#[derive(Debug, Serialize, Deserialize)]
pub struct KycRequestPayload {
    pub userWallet: String,
    pub providerId: String,
    pub kycLevel: u8,
    pub isPep: bool,
    pub isSanctioned: bool,
    pub blobId: String,
    pub docHash: String,
    pub walrusBlobObject: Option<String>,
    pub nationality: String,
    pub cardArtCid: String,
    pub providerSignature: Option<String>,
}

#[allow(non_snake_case)]
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct KycResponsePayload {
    pub userWallet: String,
    pub providerId: String,
    pub kycLevel: u8,
    pub isPep: bool,
    pub isSanctioned: bool,
    pub blobId: String,
    pub docHash: String,
    pub walrusCid: String,
    pub teeMeasurement: String,
    pub nationality: String,
    pub cardArtCid: String,
}

fn normalize_hex(value: &str) -> String {
    if value.starts_with("0x") || value.starts_with("0X") {
        value.to_string()
    } else {
        format!("0x{}", value)
    }
}

fn canonical_message(payload: &KycRequestPayload) -> Vec<u8> {
    format!(
        "{}::{}::{}::{}::{}",
        payload.providerId, payload.userWallet, payload.blobId, payload.docHash, payload.kycLevel
    )
    .into_bytes()
}

fn verify_provider_signature(
    provider: &ProviderRuntime,
    payload: &KycRequestPayload,
) -> Result<(), EnclaveError> {
    if provider.allow_unsigned {
        return Ok(());
    }
    let signature_hex = payload
        .providerSignature
        .as_ref()
        .ok_or_else(|| EnclaveError::GenericError("Missing providerSignature".to_string()))?;
    let sig_bytes = Hex::decode(signature_hex.trim_start_matches("0x")).map_err(|e| {
        EnclaveError::GenericError(format!("Invalid provider signature encoding: {}", e))
    })?;
    let sig = Ed25519Signature::from_bytes(&sig_bytes)
        .map_err(|e| EnclaveError::GenericError(format!("Invalid signature: {}", e)))?;
    provider
        .public_key
        .verify(&canonical_message(payload), &sig)
        .map_err(|_| EnclaveError::GenericError("Provider signature mismatch".to_string()))
}

async fn fetch_walrus_blob(
    client: &Client,
    runtime: &KycRuntime,
    blob_id: &str,
) -> Result<Vec<u8>, EnclaveError> {
    let base = runtime.walrus_aggregator_url.trim_end_matches('/');
    let url = format!("{}/v1/blobs/{}", base, blob_id);
    let timeout = Duration::from_millis(runtime.walrus_timeout_ms.max(1));
    let response = client.get(url).timeout(timeout).send().await.map_err(|e| {
        EnclaveError::GenericError(format!("Walrus aggregator request failed: {}", e))
    })?;
    if !response.status().is_success() {
        return Err(EnclaveError::GenericError(format!(
            "Walrus aggregator returned status {}",
            response.status()
        )));
    }
    response
        .bytes()
        .await
        .map(|b| b.to_vec())
        .map_err(|e| EnclaveError::GenericError(format!("Failed to read Walrus blob: {}", e)))
}

fn validate_doc_hash(expected: &str, actual_blob: &[u8]) -> Result<(), EnclaveError> {
    let digest = Sha256::digest(actual_blob);
    let computed = format!("0x{}", Hex::encode(digest));
    let normalized_expected = normalize_hex(expected).to_lowercase();
    if computed.to_lowercase() == normalized_expected {
        Ok(())
    } else {
        Err(EnclaveError::GenericError(format!(
            "doc_hash mismatch. expected {}, computed {}",
            expected, computed
        )))
    }
}

fn walrus_cid(payload: &KycRequestPayload) -> String {
    payload
        .walrusBlobObject
        .clone()
        .unwrap_or_else(|| payload.blobId.clone())
}

fn intent_timestamp() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_else(|_| Duration::from_secs(0))
        .as_millis() as u64
}

async fn ensure_runtime(state: &AppState) -> Result<KycRuntime, EnclaveError> {
    if let Some(runtime) = state.kyc_runtime.read().await.clone() {
        return Ok(runtime);
    }

    let path = std::env::var("KYC_CONFIG_PATH").map_err(|_| {
        EnclaveError::GenericError(
            "KYC config not loaded. Run Seal bootstrap or set KYC_CONFIG_PATH.".to_string(),
        )
    })?;
    let raw = std::fs::read_to_string(&path).map_err(|e| {
        EnclaveError::GenericError(format!("Failed to read KYC config file: {}", e))
    })?;
    let parsed: FileKycConfig = serde_yaml::from_str(&raw)
        .or_else(|_| serde_json::from_str(&raw))
        .map_err(|e| EnclaveError::GenericError(format!("Invalid KYC config format: {}", e)))?;
    let runtime =
        KycRuntime::try_from(parsed).map_err(|e| EnclaveError::GenericError(e.to_string()))?;
    {
        let mut guard = state.kyc_runtime.write().await;
        *guard = Some(runtime.clone());
    }
    Ok(runtime)
}

pub async fn process_data(
    State(state): State<Arc<AppState>>,
    Json(request): Json<ProcessDataRequest<KycRequestPayload>>,
) -> Result<Json<ProcessedDataResponse<IntentMessage<KycResponsePayload>>>, EnclaveError> {
    let runtime = ensure_runtime(&state).await?;
    let provider = runtime
        .find_provider(&request.payload.providerId)
        .ok_or_else(|| {
            EnclaveError::GenericError(format!("Unknown provider {}", request.payload.providerId))
        })?;

    verify_provider_signature(provider, &request.payload)?;

    let blob_bytes =
        fetch_walrus_blob(&state.walrus_client, &runtime, &request.payload.blobId).await?;
    validate_doc_hash(&request.payload.docHash, &blob_bytes)?;

    let walrus_cid = walrus_cid(&request.payload);
    let response = KycResponsePayload {
        userWallet: request.payload.userWallet.clone(),
        providerId: provider.provider_id.clone(),
        kycLevel: request.payload.kycLevel,
        isPep: request.payload.isPep,
        isSanctioned: request.payload.isSanctioned,
        blobId: request.payload.blobId.clone(),
        docHash: normalize_hex(&request.payload.docHash),
        walrusCid: walrus_cid,
        teeMeasurement: runtime.enclave_measurement.clone(),
        nationality: request.payload.nationality.clone(),
        cardArtCid: request.payload.cardArtCid.clone(),
    };

    Ok(Json(to_signed_response(
        &state.eph_kp,
        response,
        intent_timestamp(),
        IntentScope::ProcessData,
    )))
}
