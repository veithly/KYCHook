#[allow(duplicate_alias)]
module kychook::provider_registry {
    use 0x1::string;
    use 0x1::string::String;
    use 0x1::vector;
    use sui::object;
    use sui::table;
    use sui::table::Table;
    use sui::transfer;
    use sui::tx_context;
    use sui::tx_context::TxContext;

    const ED25519_PUBKEY_LEN: u64 = 32;
    const E_NOT_ADMIN: u64 = 201;
    const E_PROVIDER_EXISTS: u64 = 202;
    const E_PROVIDER_NOT_FOUND: u64 = 203;
    const E_PROVIDER_INACTIVE: u64 = 204;
    const E_BAD_PUBKEY_LEN: u64 = 205;
    const E_MEASUREMENT_REQUIRED: u64 = 206;

    public struct Provider has copy, drop, store {
        id: String,
        enclave_pubkey: vector<u8>,
        metadata_url: String,
        tee_measurement: vector<u8>,
        is_active: bool,
    }

    public struct ProviderRegistry has key {
        id: object::UID,
        admin: address,
        providers: Table<String, Provider>,
    }

    fun init(ctx: &mut TxContext) {
        let registry = ProviderRegistry {
            id: object::new(ctx),
            admin: tx_context::sender(ctx),
            providers: table::new(ctx),
        };
        transfer::share_object(registry);
    }

    public entry fun register_provider(
        registry: &mut ProviderRegistry,
        id_bytes: vector<u8>,
        enclave_pubkey: vector<u8>,
        tee_measurement: vector<u8>,
        metadata_url_bytes: vector<u8>,
        ctx: &TxContext,
    ) {
        assert_admin(registry, ctx);
        assert!(vector::length(&enclave_pubkey) == ED25519_PUBKEY_LEN, E_BAD_PUBKEY_LEN);
        assert!(vector::length(&tee_measurement) > 0, E_MEASUREMENT_REQUIRED);
        let id = string::utf8(id_bytes);
        let metadata_url = string::utf8(metadata_url_bytes);
        let lookup_id = copy id;
        assert!(!table::contains(&registry.providers, lookup_id), E_PROVIDER_EXISTS);

        let key = copy id;
        let provider = Provider {
            id,
            enclave_pubkey,
            metadata_url,
            tee_measurement,
            is_active: true,
        };
        table::add(&mut registry.providers, key, provider);
    }

    public entry fun set_provider_active(
        registry: &mut ProviderRegistry,
        id_bytes: vector<u8>,
        is_active: bool,
        ctx: &TxContext,
    ) {
        assert_admin(registry, ctx);
        let id = string::utf8(id_bytes);
        let lookup_id = copy id;
        assert!(table::contains(&registry.providers, lookup_id), E_PROVIDER_NOT_FOUND);
        let provider = table::borrow_mut(&mut registry.providers, copy id);
        provider.is_active = is_active;
    }

    public fun expect_active_provider(
        registry: &ProviderRegistry,
        id: String,
    ): &Provider {
        let lookup_id = copy id;
        assert!(table::contains(&registry.providers, lookup_id), E_PROVIDER_NOT_FOUND);
        let provider = table::borrow(&registry.providers, id);
        assert!(provider.is_active, E_PROVIDER_INACTIVE);
        provider
    }

    public fun provider_id(provider: &Provider): &String {
        &provider.id
    }

    public fun provider_enclave_key(provider: &Provider): &vector<u8> {
        &provider.enclave_pubkey
    }

    public fun provider_measurement(provider: &Provider): &vector<u8> {
        &provider.tee_measurement
    }

    fun assert_admin(registry: &ProviderRegistry, ctx: &TxContext) {
        assert!(tx_context::sender(ctx) == registry.admin, E_NOT_ADMIN);
    }
}
