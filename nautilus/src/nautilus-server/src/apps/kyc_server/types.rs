// Copyright (c), Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

use fastcrypto::ed25519::Ed25519PublicKey;
use fastcrypto::encoding::{Encoding, Hex};
use fastcrypto::serde_helpers::ToFromByteArray;
use fastcrypto::traits::ToFromBytes;
use seal_sdk::types::{FetchKeyResponse, KeyId};
use seal_sdk::{EncryptedObject, IBEPublicKey};
use serde::{Deserialize, Deserializer, Serialize};
use std::collections::HashMap;
use std::str::FromStr;
use sui_sdk_types::ObjectId as ObjectID;

/// Generic hex -> Vec<KeyId> deserializer.
fn deserialize_hex_vec<'de, D>(deserializer: D) -> Result<Vec<KeyId>, D::Error>
where
    D: Deserializer<'de>,
{
    let hex_strings: Vec<String> = Vec::deserialize(deserializer)?;
    hex_strings
        .into_iter()
        .map(|s| Hex::decode(&s).map_err(serde::de::Error::custom))
        .collect()
}

fn deserialize_object_id<'de, D>(deserializer: D) -> Result<ObjectID, D::Error>
where
    D: Deserializer<'de>,
{
    let s: String = String::deserialize(deserializer)?;
    ObjectID::from_str(&s).map_err(serde::de::Error::custom)
}

fn deserialize_object_ids<'de, D>(deserializer: D) -> Result<Vec<ObjectID>, D::Error>
where
    D: Deserializer<'de>,
{
    let strings: Vec<String> = Vec::deserialize(deserializer)?;
    strings
        .into_iter()
        .map(|s| ObjectID::from_str(&s).map_err(serde::de::Error::custom))
        .collect()
}

fn deserialize_ibe_public_keys<'de, D>(deserializer: D) -> Result<Vec<IBEPublicKey>, D::Error>
where
    D: Deserializer<'de>,
{
    let pk_hexs: Vec<String> = Vec::deserialize(deserializer)?;
    pk_hexs
        .into_iter()
        .map(|pk_hex| {
            let pk_bytes = Hex::decode(&pk_hex).map_err(serde::de::Error::custom)?;
            let pk = IBEPublicKey::from_byte_array(
                &pk_bytes
                    .try_into()
                    .map_err(|_| serde::de::Error::custom("Invalid public key length"))?,
            )
            .map_err(serde::de::Error::custom)?;
            Ok(pk)
        })
        .collect()
}

fn deserialize_seal_responses<'de, D>(
    deserializer: D,
) -> Result<Vec<(ObjectID, FetchKeyResponse)>, D::Error>
where
    D: Deserializer<'de>,
{
    let hex_string: String = String::deserialize(deserializer)?;
    let bytes = Hex::decode(&hex_string).map_err(serde::de::Error::custom)?;
    let responses: Vec<(ObjectID, FetchKeyResponse)> =
        bcs::from_bytes(&bytes).map_err(serde::de::Error::custom)?;
    Ok(responses)
}

fn deserialize_encrypted_objects<'de, D>(deserializer: D) -> Result<Vec<EncryptedObject>, D::Error>
where
    D: Deserializer<'de>,
{
    let hex_string: String = String::deserialize(deserializer)?;
    let bytes = Hex::decode(&hex_string).map_err(serde::de::Error::custom)?;
    let responses: Vec<EncryptedObject> =
        bcs::from_bytes(&bytes).map_err(serde::de::Error::custom)?;
    Ok(responses)
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(try_from = "SealConfigRaw")]
pub struct SealConfig {
    pub key_servers: Vec<ObjectID>,
    pub public_keys: Vec<IBEPublicKey>,
    pub package_id: ObjectID,
    pub server_pk_map: HashMap<ObjectID, IBEPublicKey>,
}

#[derive(Debug, Deserialize)]
struct SealConfigRaw {
    #[serde(deserialize_with = "deserialize_object_ids")]
    key_servers: Vec<ObjectID>,
    #[serde(deserialize_with = "deserialize_ibe_public_keys")]
    public_keys: Vec<IBEPublicKey>,
    #[serde(deserialize_with = "deserialize_object_id")]
    package_id: ObjectID,
}

impl TryFrom<SealConfigRaw> for SealConfig {
    type Error = String;

    fn try_from(raw: SealConfigRaw) -> Result<Self, Self::Error> {
        if raw.key_servers.len() != raw.public_keys.len() {
            return Err(format!(
                "key_servers and public_keys length mismatch: {} vs {}",
                raw.key_servers.len(),
                raw.public_keys.len()
            ));
        }

        let server_pk_map: HashMap<ObjectID, IBEPublicKey> = raw
            .key_servers
            .iter()
            .zip(raw.public_keys.iter())
            .map(|(id, pk)| (*id, *pk))
            .collect();

        Ok(SealConfig {
            key_servers: raw.key_servers,
            public_keys: raw.public_keys,
            package_id: raw.package_id,
            server_pk_map,
        })
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct InitParameterLoadRequest {
    pub enclave_object_id: ObjectID,
    pub initial_shared_version: u64,
    #[serde(deserialize_with = "deserialize_hex_vec")]
    pub ids: Vec<KeyId>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct InitParameterLoadResponse {
    pub encoded_request: String,
}

#[derive(Serialize, Deserialize)]
pub struct CompleteParameterLoadRequest {
    #[serde(deserialize_with = "deserialize_encrypted_objects")]
    pub encrypted_objects: Vec<EncryptedObject>,
    #[serde(deserialize_with = "deserialize_seal_responses")]
    pub seal_responses: Vec<(ObjectID, FetchKeyResponse)>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CompleteParameterLoadResponse {
    pub provider_count: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KycProviderConfig {
    pub provider_id: String,
    pub public_key: String,
    #[serde(default)]
    pub allow_unsigned: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileKycConfig {
    pub walrus_aggregator_url: String,
    pub walrus_timeout_ms: Option<u64>,
    pub enclave_measurement: String,
    pub providers: Vec<KycProviderConfig>,
}

#[derive(Clone)]
pub struct ProviderRuntime {
    pub provider_id: String,
    pub allow_unsigned: bool,
    pub raw_public_key: String,
    pub public_key: Ed25519PublicKey,
}

#[derive(Clone)]
pub struct KycRuntime {
    pub walrus_aggregator_url: String,
    pub walrus_timeout_ms: u64,
    pub enclave_measurement: String,
    pub providers: Vec<ProviderRuntime>,
}

impl KycRuntime {
    pub fn find_provider(&self, provider_id: &str) -> Option<&ProviderRuntime> {
        self.providers
            .iter()
            .find(|entry| entry.provider_id == provider_id)
    }
}

impl TryFrom<FileKycConfig> for KycRuntime {
    type Error = EnclaveConfigError;

    fn try_from(cfg: FileKycConfig) -> Result<Self, Self::Error> {
        if cfg.providers.is_empty() {
            return Err(EnclaveConfigError::NoProviders);
        }
        let mut providers = Vec::with_capacity(cfg.providers.len());
        for provider in cfg.providers.iter() {
            let key_bytes =
                Hex::decode(provider.public_key.trim_start_matches("0x")).map_err(|e| {
                    EnclaveConfigError::InvalidProviderKey {
                        provider: provider.provider_id.clone(),
                        error: e.to_string(),
                    }
                })?;
            let public_key = Ed25519PublicKey::from_bytes(&key_bytes).map_err(|e| {
                EnclaveConfigError::InvalidProviderKey {
                    provider: provider.provider_id.clone(),
                    error: e.to_string(),
                }
            })?;
            providers.push(ProviderRuntime {
                provider_id: provider.provider_id.clone(),
                allow_unsigned: provider.allow_unsigned,
                raw_public_key: provider.public_key.clone(),
                public_key,
            });
        }

        Ok(KycRuntime {
            walrus_aggregator_url: cfg.walrus_aggregator_url,
            walrus_timeout_ms: cfg.walrus_timeout_ms.unwrap_or(8_000),
            enclave_measurement: cfg.enclave_measurement,
            providers,
        })
    }
}

#[derive(thiserror::Error, Debug)]
pub enum EnclaveConfigError {
    #[error("no providers configured")]
    NoProviders,
    #[error("invalid provider key for {provider}: {error}")]
    InvalidProviderKey { provider: String, error: String },
    #[error("invalid JSON/YAML config: {0}")]
    InvalidFormat(String),
}
