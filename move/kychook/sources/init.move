module kychook::init {
    use sui::package;
    use sui::tx_context;
    use sui::transfer;
    use kychook::kyc_badge;

    /// One-time witness for this package. Auto-generated at publish time.
    /// Name must match module name in upper case.
    public struct INIT has drop {}

    /// Module initializer: claim Publisher, build Display, hand both to sender.
    fun init(witness: INIT, ctx: &mut tx_context::TxContext) {
        let publisher = package::claim(witness, ctx);
        let display_obj = kyc_badge::build_display(&publisher, ctx);
        transfer::public_transfer(display_obj, tx_context::sender(ctx));
        transfer::public_transfer(publisher, tx_context::sender(ctx));
    }
}
