/**
 * SPP Token - Fungible Asset for Sport Performance Protocol
 * Implements deflationary tokenomics with burn mechanism
 */
module spp_protocol::spp_token {
    use std::signer;
    use std::string::{Self, String};
    use std::option;
    use aptos_framework::fungible_asset::{Self, MintRef, TransferRef, BurnRef, Metadata};
    use aptos_framework::object::{Self, Object};
    use aptos_framework::primary_fungible_store;

    /// Error codes
    const E_NOT_OWNER: u64 = 1;
    const E_INSUFFICIENT_BALANCE: u64 = 2;
    const E_PAUSED: u64 = 3;

    /// Token metadata
    const TOKEN_NAME: vector<u8> = b"Sport Performance Protocol Token";
    const TOKEN_SYMBOL: vector<u8> = b"SPP";
    const TOKEN_DECIMALS: u8 = 8;
    const INITIAL_SUPPLY: u64 = 1_000_000_000_00000000; // 1 billion tokens with 8 decimals

    /// Token refs for managing the fungible asset
    struct TokenRefs has key {
        mint_ref: MintRef,
        transfer_ref: TransferRef,
        burn_ref: BurnRef,
    }

    /// Token stats
    struct TokenStats has key {
        total_burned: u64,
        circulating_supply: u64,
        paused: bool,
    }

    /// Initialize the SPP token
    public entry fun initialize(admin: &signer) {
        let admin_addr = signer::address_of(admin);

        // Create the fungible asset
        let constructor_ref = &object::create_named_object(admin, b"SPP_TOKEN");

        primary_fungible_store::create_primary_store_enabled_fungible_asset(
            constructor_ref,
            option::none(),
            string::utf8(TOKEN_NAME),
            string::utf8(TOKEN_SYMBOL),
            TOKEN_DECIMALS,
            string::utf8(b"https://sportperformanceprotocol.com/token-icon.png"),
            string::utf8(b"https://sportperformanceprotocol.com"),
        );

        // Generate refs
        let mint_ref = fungible_asset::generate_mint_ref(constructor_ref);
        let transfer_ref = fungible_asset::generate_transfer_ref(constructor_ref);
        let burn_ref = fungible_asset::generate_burn_ref(constructor_ref);

        // Store refs
        move_to(admin, TokenRefs {
            mint_ref,
            transfer_ref,
            burn_ref,
        });

        // Initialize stats
        move_to(admin, TokenStats {
            total_burned: 0,
            circulating_supply: INITIAL_SUPPLY,
            paused: false,
        });

        // Mint initial supply to admin
        let metadata = get_metadata();
        let fa = fungible_asset::mint(&mint_ref, INITIAL_SUPPLY);
        primary_fungible_store::deposit(admin_addr, fa);
    }

    /// Get token metadata object
    public fun get_metadata(): Object<Metadata> {
        let metadata_addr = object::create_object_address(&@spp_protocol, b"SPP_TOKEN");
        object::address_to_object<Metadata>(metadata_addr)
    }

    /// Burn tokens
    public entry fun burn(
        account: &signer,
        amount: u64
    ) acquires TokenRefs, TokenStats {
        let account_addr = signer::address_of(account);
        let metadata = get_metadata();

        // Burn from primary store
        let refs = borrow_global<TokenRefs>(@spp_protocol);
        primary_fungible_store::burn(&refs.burn_ref, account_addr, amount);

        // Update stats
        let stats = borrow_global_mut<TokenStats>(@spp_protocol);
        stats.total_burned = stats.total_burned + amount;
        stats.circulating_supply = stats.circulating_supply - amount;
    }

    /// Mint tokens (admin only)
    public entry fun mint(
        admin: &signer,
        to: address,
        amount: u64
    ) acquires TokenRefs, TokenStats {
        let admin_addr = signer::address_of(admin);
        assert!(admin_addr == @spp_protocol, E_NOT_OWNER);

        let refs = borrow_global<TokenRefs>(@spp_protocol);
        let fa = fungible_asset::mint(&refs.mint_ref, amount);
        primary_fungible_store::deposit(to, fa);

        // Update circulating supply
        let stats = borrow_global_mut<TokenStats>(@spp_protocol);
        stats.circulating_supply = stats.circulating_supply + amount;
    }

    /// Get balance
    #[view]
    public fun balance_of(account: address): u64 {
        let metadata = get_metadata();
        primary_fungible_store::balance(account, metadata)
    }

    /// Get total burned
    #[view]
    public fun total_burned(): u64 acquires TokenStats {
        borrow_global<TokenStats>(@spp_protocol).total_burned
    }

    /// Get circulating supply
    #[view]
    public fun circulating_supply(): u64 acquires TokenStats {
        borrow_global<TokenStats>(@spp_protocol).circulating_supply
    }

    /// Pause/unpause transfers (admin only)
    public entry fun set_paused(
        admin: &signer,
        paused: bool
    ) acquires TokenStats {
        let admin_addr = signer::address_of(admin);
        assert!(admin_addr == @spp_protocol, E_NOT_OWNER);

        let stats = borrow_global_mut<TokenStats>(@spp_protocol);
        stats.paused = paused;
    }
}
