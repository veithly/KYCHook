# KYCHook - Decentralized Identity Verification

![KYCHook Logo](public/logo.svg)

**Provably authentic KYC attestations for the Sui ecosystem.**

KYCHook is a privacy-preserving identity verification protocol that leverages Sui, Walrus, and Trusted Execution Environments (TEEs) to verify user documents without exposing sensitive data on-chain.

## Features

-   **Privacy-First**: Sensitive documents are encrypted and stored on Walrus.
-   **TEE Verification**: Identity verification happens inside a secure enclave (Nautilus).
-   **Sui Integration**: Results are attested on-chain as soulbound badges.
-   **Modern UI**: A sleek, responsive dashboard for managing your identity.

## Tech Stack

-   **Frontend**: React, TypeScript, Vite, Radix UI, Three.js
-   **Blockchain**: Sui (Move)
-   **Storage**: Walrus (Decentralized Storage)
-   **Security**: Nautilus (TEE Enclaves)

## Quick Start

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Run Development Server**:
    ```bash
    npm run dev:full
    ```
    This starts both the React frontend and the Nautilus mock server.

## Documentation

For detailed setup and integration guides, see:

-   **`COMPLETE_INTEGRATION_GUIDE.md`** - Complete end-to-end guide
-   **`NAUTILUS_SETUP.md`** - Nautilus mock server setup
-   **`NAUTILUS_REAL_DEPLOYMENT.md`** - Real Nautilus deployment on AWS
-   **`WALRUS_INTEGRATION_FIX.md`** - Walrus API field mapping fix details

## Environment Configuration

Create a `.env` file in the `KYCHook/` directory. See the documentation for the latest contract addresses and configuration.

## License

MIT
