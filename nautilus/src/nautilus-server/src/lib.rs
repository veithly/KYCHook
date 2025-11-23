// Copyright (c), Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use axum::Json;
use fastcrypto::ed25519::Ed25519KeyPair;
use reqwest::Client;
use serde_json::json;
use std::fmt;
use tokio::sync::RwLock;

mod apps {
    pub mod kyc_server;
}

pub mod app {
    pub use crate::apps::kyc_server::*;
}

pub mod common;

/// App state shared across handlers.
pub struct AppState {
    /// Ephemeral keypair on boot
    pub eph_kp: Ed25519KeyPair,
    /// Reusable HTTP client for Walrus + Nautilus requests
    pub walrus_client: Client,
    /// In-memory runtime config loaded via Seal or filesystem
    pub kyc_runtime: RwLock<Option<app::KycRuntime>>,
}

/// Implement IntoResponse for EnclaveError.
impl IntoResponse for EnclaveError {
    fn into_response(self) -> Response {
        let (status, error_message) = match self {
            EnclaveError::GenericError(e) => (StatusCode::BAD_REQUEST, e),
        };
        let body = Json(json!({
            "error": error_message,
        }));
        (status, body).into_response()
    }
}

/// Enclave errors enum.
#[derive(Debug)]
pub enum EnclaveError {
    GenericError(String),
}

impl fmt::Display for EnclaveError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            EnclaveError::GenericError(e) => write!(f, "{}", e),
        }
    }
}

impl std::error::Error for EnclaveError {}
