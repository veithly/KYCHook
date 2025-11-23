#[allow(duplicate_alias, unused_trailing_semi)]
module kychook::kyc_registry {
    use kychook::kyc_badge;
    use kychook::provider_registry;
    use 0x1::option;
    use 0x1::option::Option;
    use 0x1::string::{String};
    use 0x1::string;
    use 0x1::vector;
    use sui::bcs::{BCS};
    use sui::bcs as sui_bcs;
    use sui::clock;
    use sui::ed25519;
    use sui::object;
    use sui::table;
    use sui::table::Table;
    use sui::transfer;
    use sui::tx_context;
    use sui::tx_context::TxContext;

    const STATUS_VERSION: u64 = 1;
    const MAX_RECEIPT_AGE_MS: u64 = 86_400_000; // 24h
    const MAX_FUTURE_DRIFT_MS: u64 = 300_000; // 5min
    const INTENT_KYC: u32 = 0;

    const E_TIMESTAMP_TOO_OLD: u64 = 101;
    const E_TIMESTAMP_IN_FUTURE: u64 = 102;
    const E_INVALID_INTENT: u64 = 104;
    const E_INVALID_SIGNATURE: u64 = 105;
    const E_MEASUREMENT_MISMATCH: u64 = 106;
    const E_UNAUTHORIZED_CALLER: u64 = 107;
    const E_RECEIPT_LEFTOVERS: u64 = 109;

    public struct KycStatus has copy, drop, store {
        kyc_level: u8,
        is_pep: bool,
        is_sanctioned: bool,
        issued_at: u64,
        expires_at: Option<u64>,
        badge_id: Option<vector<u8>>,
        blob_id: String,
        doc_hash: vector<u8>,
        walrus_cid: String,
        provider_id: String,
        nationality: String,
        card_art_cid: String,
        image_url: String,
        tee_measurement: vector<u8>,
        version: u64,
    }

    public struct KycRegistry has key {
        id: object::UID,
        user_status: Table<address, KycStatus>,
    }

    public struct KycPayload has drop, store {
        user_wallet: address,
        provider_id: String,
        kyc_level: u8,
        is_pep: bool,
        is_sanctioned: bool,
        blob_id: String,
        doc_hash: vector<u8>,
        walrus_cid: String,
        nationality: String,
        card_art_cid: String,
        image_url: String,
        tee_measurement: vector<u8>,
    }

    public struct NautilusResponse has drop, store {
        intent: u32,
        timestamp_ms: u64,
        data: KycPayload,
    }

    public struct KycReceipt has drop, store {
        response: NautilusResponse,
        signature: vector<u8>,
    }

    fun init(ctx: &mut TxContext) {
        let registry = KycRegistry {
            id: object::new(ctx),
            user_status: table::new(ctx),
        };
        transfer::share_object(registry);
    }

    public entry fun issue_kyc(
        registry: &mut KycRegistry,
        providers: &provider_registry::ProviderRegistry,
        clock_ref: &clock::Clock,
        receipt_bytes: vector<u8>,
        ctx: &mut TxContext,
    ) {
        let caller = tx_context::sender(ctx);
        let receipt = decode_receipt(receipt_bytes);
        let KycReceipt { response, signature } = receipt;
        assert!(response.intent == INTENT_KYC, E_INVALID_INTENT);
        validate_timestamp(clock_ref, response.timestamp_ms);

        let provider_lookup_id = copy response.data.provider_id;
        let provider = provider_registry::expect_active_provider(providers, provider_lookup_id);
        assert!(
            bytes_equal(provider_registry::provider_measurement(provider), &response.data.tee_measurement),
            E_MEASUREMENT_MISMATCH
        );
        assert!(response.data.user_wallet == caller, E_UNAUTHORIZED_CALLER);

        verify_signature(provider, &response, &signature);

        let NautilusResponse {
            intent: _,
            timestamp_ms: issued_at,
            data,
        } = response;
        let KycPayload {
            user_wallet: _,
            provider_id,
            kyc_level,
            is_pep,
            is_sanctioned,
            blob_id,
            doc_hash,
            walrus_cid,
            nationality,
            card_art_cid,
            image_url,
            tee_measurement,
        } = data;

        let provider_for_badge = provider_id;
        let nationality_for_badge = nationality;
        let card_art_for_badge = card_art_cid;
        let image_url_for_badge = image_url;
        let walrus_for_badge = walrus_cid;
        let doc_hash_for_badge = doc_hash;

        let badge_bytes = kyc_badge::mint_to(
            caller,
            kyc_level,
            provider_for_badge,
            nationality_for_badge,
            card_art_for_badge,
            image_url_for_badge,
            walrus_for_badge,
            doc_hash_for_badge,
            issued_at,
            ctx,
        );
        let provider_id = clone_string(&provider_for_badge);
        let nationality = clone_string(&nationality_for_badge);
        let card_art_cid = clone_string(&card_art_for_badge);
        let image_url = clone_string(&image_url_for_badge);
        let walrus_cid = clone_string(&walrus_for_badge);
        let doc_hash = clone_bytes(&doc_hash_for_badge);

        let status = KycStatus {
            kyc_level,
            is_pep,
            is_sanctioned,
            issued_at,
            expires_at: option::none(),
            badge_id: option::some(badge_bytes),
            blob_id,
            doc_hash,
            walrus_cid,
            provider_id,
            nationality,
            card_art_cid,
            image_url,
            tee_measurement,
            version: STATUS_VERSION,
        };
        upsert_status(&mut registry.user_status, caller, status);
    }

    public entry fun revoke_kyc(registry: &mut KycRegistry, ctx: &TxContext) {
        let caller = tx_context::sender(ctx);
        if (table::contains(&registry.user_status, caller)) {
            let _ = table::remove(&mut registry.user_status, caller);
        }
    }

    public fun get_kyc_status(
        registry: &KycRegistry,
        user: address,
    ): Option<KycStatus> {
        if (!table::contains(&registry.user_status, user)) {
            return option::none();
        };
        let status = table::borrow(&registry.user_status, user);
        option::some(*status)
    }

    public fun has_level(registry: &KycRegistry, user: address, min_level: u8): bool {
        let maybe = get_kyc_status(registry, user);
        if (!option::is_some(&maybe)) {
            return false;
        };
        let status_ref = option::borrow(&maybe);
        status_ref.kyc_level >= min_level
    }

    public fun has_valid_kyc(registry: &KycRegistry, user: address): bool {
        has_level(registry, user, 1)
    }

    fun upsert_status(
        table_ref: &mut Table<address, KycStatus>,
        user: address,
        status: KycStatus,
    ) {
        if (table::contains(table_ref, user)) {
            let _ = table::remove(table_ref, user);
        };
        table::add(table_ref, user, status);
    }

    fun validate_timestamp(clock_ref: &clock::Clock, timestamp_ms: u64) {
        let now = clock::timestamp_ms(clock_ref);
        assert!(timestamp_ms <= now + MAX_FUTURE_DRIFT_MS, E_TIMESTAMP_IN_FUTURE);
        assert!(now <= timestamp_ms + MAX_RECEIPT_AGE_MS, E_TIMESTAMP_TOO_OLD);
    }

    fun verify_signature(
        provider: &provider_registry::Provider,
        response: &NautilusResponse,
        signature: &vector<u8>,
    ) {
        let payload_bytes = sui_bcs::to_bytes(response);
        let ok = ed25519::ed25519_verify(signature, provider_registry::provider_enclave_key(provider), &payload_bytes);
        assert!(ok, E_INVALID_SIGNATURE);
    }

    fun decode_receipt(bytes: vector<u8>): KycReceipt {
        let mut reader = sui_bcs::new(bytes);
        let response = decode_response(&mut reader);
        let signature = reader.peel_vec_u8();
        let leftovers = sui_bcs::into_remainder_bytes(reader);
        assert!(vector::is_empty(&leftovers), E_RECEIPT_LEFTOVERS);
        KycReceipt { response, signature }
    }

    fun decode_response(reader: &mut BCS): NautilusResponse {
        let intent = reader.peel_u32();
        let timestamp_ms = reader.peel_u64();
        let data = decode_payload(reader);
        NautilusResponse { intent, timestamp_ms, data }
    }

    fun decode_payload(reader: &mut BCS): KycPayload {
        let user_wallet = reader.peel_address();
        let provider_id = decode_string(reader);
        let kyc_level = reader.peel_u8();
        let is_pep = reader.peel_bool();
        let is_sanctioned = reader.peel_bool();
        let blob_id = decode_string(reader);
        let doc_hash = reader.peel_vec_u8();
        let walrus_cid = decode_string(reader);
        let nationality = decode_string(reader);
        let card_art_cid = decode_string(reader);
        let image_url = decode_string(reader);
        let tee_measurement = reader.peel_vec_u8();

        KycPayload {
            user_wallet,
            provider_id,
            kyc_level,
            is_pep,
            is_sanctioned,
            blob_id,
            doc_hash,
            walrus_cid,
            nationality,
            card_art_cid,
            image_url,
            tee_measurement,
        }
    }

    fun decode_string(reader: &mut BCS): String {
        let bytes = reader.peel_vec_u8();
        string::utf8(bytes)
    }

    fun bytes_equal(a: &vector<u8>, b: &vector<u8>): bool {
        if (vector::length(a) != vector::length(b)) {
            return false;
        };
        let len = vector::length(a);
        let mut i = 0;
        while (i < len) {
            if (*vector::borrow(a, i) != *vector::borrow(b, i)) {
                return false;
            };
            i = i + 1;
        };
        true
    }

    fun clone_string(value: &String): String {
        let bytes_ref = string::as_bytes(value);
        string::utf8(clone_bytes(bytes_ref))
    }

    fun clone_bytes(value: &vector<u8>): vector<u8> {
        let len = vector::length(value);
        let mut out = vector::empty<u8>();
        let mut i = 0;
        while (i < len) {
            vector::push_back(&mut out, *vector::borrow(value, i));
            i = i + 1;
        };
        out
    }
}
