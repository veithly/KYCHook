#[allow(duplicate_alias)]
module kychook::kyc_badge {
    use 0x1::string;
    use 0x1::string::{String};
    use 0x1::vector;
    use sui::object;
    use sui::display;
    use sui::package;
    use sui::tx_context;
    use sui::tx_context::TxContext;
    use sui::transfer;

    const E_BADGE_TRANSFER_DISABLED: u64 = 1;

    /// Soulbound badge object that represents an issued KYC credential.
    /// The lack of `store` ability prevents arbitrary transfers through
    /// `transfer::transfer`.
    public struct Badge has key {
        id: object::UID,
        owner: address,
        kyc_level: u8,
        provider_id: String,
        nationality: String,
        card_art_cid: String,
        /// Direct image URL so wallets that ignore Display can still render.
        image_url: String,
        walrus_cid: String,
        doc_hash: vector<u8>,
        issued_at: u64,
    }

    public(package) fun mint_to(
        owner: address,
        level: u8,
        provider_id: String,
        nationality: String,
        card_art_cid: String,
        /// Direct image URL so wallets that ignore Display can still render.
        image_url: String,
        walrus_cid: String,
        doc_hash: vector<u8>,
        issued_at: u64,
        ctx: &mut TxContext,
    ): vector<u8> {
        let badge = Badge {
            id: object::new(ctx),
            owner,
            kyc_level: level,
            provider_id,
            nationality,
            card_art_cid,
            image_url,
            walrus_cid,
            doc_hash,
            issued_at,
        };
        let badge_id = object::id(&badge);
        let badge_bytes = object::id_to_bytes(&badge_id);
        transfer::transfer(badge, owner);
        badge_bytes
    }

    public(package) fun burn(badge: Badge) {
        let Badge {
            id,
            owner: _,
            kyc_level: _,
            provider_id: _,
            nationality: _,
            card_art_cid: _,
            image_url: _,
            walrus_cid: _,
            doc_hash: _,
            issued_at: _,
        } = badge;
        object::delete(id);
    }

    /// Helper to ensure client calls attempting to transfer the badge fail loudly.
    public entry fun reject_transfer(_badge: Badge, _recipient: address) {
        abort E_BADGE_TRANSFER_DISABLED
    }

    /// Build Display fields for Badge using the provided publisher.
    /// Internal helper used by both module initializer and entry call.
    public(package) fun build_display(
        publisher: &package::Publisher,
        ctx: &mut TxContext,
    ): display::Display<Badge> {
        let mut fields = vector::empty<String>();
        let mut values = vector::empty<String>();

        // Use the direct image_url stored on the badge so explorers that honor Display render the correct asset.
        let image_template = string::utf8(b"{image_url}");

        // Required image field understood by most explorers.
        vector::push_back(&mut fields, string::utf8(b"image_url"));
        vector::push_back(&mut values, image_template);

        // Common alternative keys some explorers/readers look for.
        vector::push_back(&mut fields, string::utf8(b"image"));
        vector::push_back(&mut values, image_template);

        vector::push_back(&mut fields, string::utf8(b"avatar_url"));
        vector::push_back(&mut values, image_template);

        vector::push_back(&mut fields, string::utf8(b"img_url"));
        vector::push_back(&mut values, image_template);

        vector::push_back(&mut fields, string::utf8(b"name"));
        vector::push_back(&mut values, string::utf8(b"KycHook Badge"));

        vector::push_back(&mut fields, string::utf8(b"description"));
        vector::push_back(&mut values, string::utf8(b"Soulbound KYC credential minted by KycHook"));

        vector::push_back(&mut fields, string::utf8(b"project_url"));
        vector::push_back(&mut values, string::utf8(b"https://kychook.io"));

        // Expose key attributes for display cards.
        vector::push_back(&mut fields, string::utf8(b"attributes"));
        vector::push_back(
            &mut values,
            string::utf8(
                b"provider_id={provider_id},nationality={nationality},kyc_level={kyc_level},walrus_cid={walrus_cid}",
            ),
        );

        display::new_with_fields<Badge>(publisher, fields, values, ctx)
    }

    /// Create and transfer a Display for Badge so wallets/explorers can render an image.
    /// Requires a Publisher object derived from this package's one-time witness.
    public entry fun init_display(
        publisher: &package::Publisher,
        ctx: &mut TxContext,
    ) {
        let display_obj = build_display(publisher, ctx);
        // Keep ownership with the publisher's address for integrity.
        transfer::public_transfer(display_obj, tx_context::sender(ctx));
    }

    /// Update an existing Display with new URLs or text.
    /// Only the package Publisher may call this.
    public entry fun update_display(
        display_obj: &mut display::Display<Badge>,
        publisher: &package::Publisher,
    ) {
        assert!(display::is_authorized<Badge>(publisher), E_BADGE_TRANSFER_DISABLED);
        let mut fields = vector::empty<String>();
        let mut values = vector::empty<String>();

        let image_template = string::utf8(b"{image_url}");

        vector::push_back(&mut fields, string::utf8(b"image_url"));
        vector::push_back(&mut values, image_template);

        vector::push_back(&mut fields, string::utf8(b"image"));
        vector::push_back(&mut values, image_template);

        vector::push_back(&mut fields, string::utf8(b"avatar_url"));
        vector::push_back(&mut values, image_template);

        vector::push_back(&mut fields, string::utf8(b"img_url"));
        vector::push_back(&mut values, image_template);

        vector::push_back(&mut fields, string::utf8(b"description"));
        vector::push_back(&mut values, string::utf8(b"Soulbound KYC credential minted by KycHook"));

        display::add_multiple<Badge>(display_obj, fields, values);
    }
}
