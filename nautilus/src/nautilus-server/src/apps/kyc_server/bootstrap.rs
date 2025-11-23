// Copyright (c), Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

use super::types::*;
use crate::AppState;
use crate::EnclaveError;
use axum::extract::State;
use axum::routing::{get, post};
use axum::Json;
use axum::Router;
use fastcrypto::ed25519::Ed25519KeyPair;
use fastcrypto::encoding::{Base64, Encoding, Hex};
use fastcrypto::traits::{KeyPair, Signer};
use rand::thread_rng;
use seal_sdk::types::{FetchKeyRequest, KeyId};
use seal_sdk::{
    genkey, seal_decrypt_all_objects, signed_message, signed_request, Certificate, ElGamalSecretKey,
};
use std::sync::Arc;
use std::time::{SystemTime, UNIX_EPOCH};
use sui_sdk_types::{
    Argument, Command, Identifier, Input, MoveCall, ObjectId as ObjectID, PersonalMessage,
    ProgrammableTransaction,
};
use tokio::net::TcpListener;
use tracing::info;

lazy_static::lazy_static! {
    pub static ref SEAL_CONFIG: SealConfig = {
        let config_str = include_str!("seal_config.yaml");
        serde_yaml::from_str(config_str)
            .expect("Failed to parse seal_config.yaml")
    };
    pub static ref ENCRYPTION_KEYS: (ElGamalSecretKey, seal_sdk::types::ElGamalPublicKey, seal_sdk::types::ElgamalVerificationKey) = {
        genkey(&mut thread_rng())
    };
}

async fn create_ptb(
    package_id: ObjectID,
    enclave_object_id: ObjectID,
    initial_shared_version: u64,
    ids: Vec<KeyId>,
) -> Result<ProgrammableTransaction, Box<dyn std::error::Error>> {
    let mut inputs = vec![];
    let mut commands = vec![];

    for id in ids.iter() {
        inputs.push(Input::Pure {
            value: bcs::to_bytes(id)?,
        });
    }

    let enclave_input_idx = inputs.len();
    inputs.push(Input::Shared {
        object_id: enclave_object_id,
        initial_shared_version,
        mutable: false,
    });

    for (idx, _id) in ids.iter().enumerate() {
        let move_call = MoveCall {
            package: package_id,
            module: Identifier::new("seal_policy")?,
            function: Identifier::new("seal_approve")?,
            type_arguments: vec![],
            arguments: vec![
                Argument::Input(idx as u16),
                Argument::Input(enclave_input_idx as u16),
            ],
        };
        commands.push(Command::MoveCall(move_call));
    }
    Ok(ProgrammableTransaction { inputs, commands })
}

pub async fn init_parameter_load(
    State(state): State<Arc<AppState>>,
    Json(request): Json<InitParameterLoadRequest>,
) -> Result<Json<InitParameterLoadResponse>, EnclaveError> {
    if state.kyc_runtime.read().await.is_some() {
        return Err(EnclaveError::GenericError(
            "KYC configuration is already initialized".to_string(),
        ));
    }

    let session = Ed25519KeyPair::generate(&mut thread_rng());
    let session_vk = session.public();
    let creation_time = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|e| EnclaveError::GenericError(format!("Time error: {}", e)))?
        .as_millis() as u64;
    let ttl_min = 10;
    let message = signed_message(
        SEAL_CONFIG.package_id.to_string(),
        session_vk,
        creation_time,
        ttl_min,
    );

    let sui_private_key = {
        let priv_key_bytes = state.eph_kp.as_ref();
        let key_bytes: [u8; 32] = priv_key_bytes
            .try_into()
            .expect("Invalid private key length");
        sui_crypto::ed25519::Ed25519PrivateKey::new(key_bytes)
    };

    let signature = {
        use sui_crypto::SuiSigner;
        sui_private_key
            .sign_personal_message(&PersonalMessage(message.as_bytes().into()))
            .map_err(|e| EnclaveError::GenericError(format!("Failed to sign message: {}", e)))?
    };

    let certificate = Certificate {
        user: sui_private_key.public_key().to_address(),
        session_vk: session_vk.clone(),
        creation_time,
        ttl_min,
        signature,
        mvr_name: None,
    };

    let ptb = create_ptb(
        SEAL_CONFIG.package_id,
        request.enclave_object_id,
        request.initial_shared_version,
        request.ids,
    )
    .await
    .map_err(|e| EnclaveError::GenericError(format!("Failed to create PTB: {}", e)))?;

    let (_enc_secret, enc_key, enc_verification_key) = &*ENCRYPTION_KEYS;
    let request_message = signed_request(&ptb, enc_key, enc_verification_key);
    let request_signature = session.sign(&request_message);
    let request = FetchKeyRequest {
        ptb: Base64::encode(bcs::to_bytes(&ptb).expect("should not fail")),
        enc_key: enc_key.clone(),
        enc_verification_key: enc_verification_key.clone(),
        request_signature,
        certificate,
    };

    Ok(Json(InitParameterLoadResponse {
        encoded_request: Hex::encode(bcs::to_bytes(&request).expect("should not fail")),
    }))
}

pub async fn complete_parameter_load(
    State(state): State<Arc<AppState>>,
    Json(request): Json<CompleteParameterLoadRequest>,
) -> Result<Json<CompleteParameterLoadResponse>, EnclaveError> {
    if state.kyc_runtime.read().await.is_some() {
        return Err(EnclaveError::GenericError(
            "KYC configuration already set".to_string(),
        ));
    }

    let (enc_secret, _enc_key, _enc_verification_key) = &*ENCRYPTION_KEYS;
    let decrypted_results = seal_decrypt_all_objects(
        enc_secret,
        &request.seal_responses,
        &request.encrypted_objects,
        &SEAL_CONFIG.server_pk_map,
    )
    .map_err(|e| EnclaveError::GenericError(format!("Failed to decrypt objects: {}", e)))?;

    let first_secret = decrypted_results.first().ok_or_else(|| {
        EnclaveError::GenericError("Seal response did not contain secrets".to_string())
    })?;
    let raw = String::from_utf8(first_secret.clone()).map_err(|e| {
        EnclaveError::GenericError(format!("Invalid UTF-8 in decrypted secret: {}", e))
    })?;

    let parsed: FileKycConfig = serde_yaml::from_str(&raw)
        .or_else(|_| serde_json::from_str(&raw))
        .map_err(|e| EnclaveError::GenericError(format!("Invalid KYC config format: {}", e)))?;
    let runtime =
        KycRuntime::try_from(parsed).map_err(|e| EnclaveError::GenericError(e.to_string()))?;

    {
        let mut guard = state.kyc_runtime.write().await;
        *guard = Some(runtime);
    }

    Ok(Json(CompleteParameterLoadResponse {
        provider_count: decrypted_results.len(),
    }))
}

pub async fn spawn_host_init_server(state: Arc<AppState>) -> Result<(), EnclaveError> {
    let host_app = Router::new()
        .route("/ping", get(|| async { Json("pong") }))
        .route("/seal/init_parameter_load", post(init_parameter_load))
        .route(
            "/seal/complete_parameter_load",
            post(complete_parameter_load),
        )
        .with_state(state);

    let host_listener = TcpListener::bind("0.0.0.0:3001").await.map_err(|e| {
        EnclaveError::GenericError(format!("Failed to bind host init server: {}", e))
    })?;

    info!(
        "Host-only init server listening on {}",
        host_listener.local_addr().unwrap()
    );

    tokio::spawn(async move {
        axum::serve(host_listener, host_app.into_make_service())
            .await
            .expect("Host init server failed");
    });

    Ok(())
}
