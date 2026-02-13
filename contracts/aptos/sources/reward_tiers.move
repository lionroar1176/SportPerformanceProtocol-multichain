/**
 * Reward Tiers Configuration
 * Defines reward multipliers and base rewards for each performance tier
 */
module spp_protocol::reward_tiers {
    use std::signer;

    /// Error codes
    const E_NOT_AUTHORIZED: u64 = 1;
    const E_INVALID_TIER: u64 = 2;

    /// Tier configuration
    struct TierConfig has store, drop, copy {
        tier: u8,
        multiplier: u64,      // Multiplied by 100 (e.g., 150 = 1.5x)
        base_reward: u64,     // Base reward amount
        min_score: u64,       // Minimum performance score required
    }

    /// Tiers state
    struct TiersState has key {
        admin: address,
        tier_0: TierConfig,  // NIFTY_FIFTY
        tier_1: TierConfig,  // GAYLE_STORM
        tier_2: TierConfig,  // FIVE_WICKET_HAUL
        tier_3: TierConfig,  // HAT_TRICK
        tier_4: TierConfig,  // MAIDEN_MASTER
        tier_5: TierConfig,  // RUN_MACHINE
        tier_6: TierConfig,  // GOLDEN_ARM
        tier_7: TierConfig,  // ALL_ROUNDER
    }

    /// Initialize reward tiers with default values
    public entry fun initialize(admin: &signer) {
        let admin_addr = signer::address_of(admin);

        move_to(admin, TiersState {
            admin: admin_addr,
            tier_0: TierConfig { tier: 0, multiplier: 150, base_reward: 50_00000000, min_score: 50 },
            tier_1: TierConfig { tier: 1, multiplier: 300, base_reward: 150_00000000, min_score: 70 },
            tier_2: TierConfig { tier: 2, multiplier: 250, base_reward: 100_00000000, min_score: 60 },
            tier_3: TierConfig { tier: 3, multiplier: 300, base_reward: 200_00000000, min_score: 80 },
            tier_4: TierConfig { tier: 4, multiplier: 150, base_reward: 30_00000000, min_score: 40 },
            tier_5: TierConfig { tier: 5, multiplier: 400, base_reward: 250_00000000, min_score: 90 },
            tier_6: TierConfig { tier: 6, multiplier: 130, base_reward: 40_00000000, min_score: 45 },
            tier_7: TierConfig { tier: 7, multiplier: 200, base_reward: 120_00000000, min_score: 65 },
        });
    }

    /// Update tier configuration (admin only)
    public entry fun update_tier(
        admin: &signer,
        tier: u8,
        multiplier: u64,
        base_reward: u64,
        min_score: u64
    ) acquires TiersState {
        let admin_addr = signer::address_of(admin);
        let state = borrow_global_mut<TiersState>(@spp_protocol);

        assert!(admin_addr == state.admin, E_NOT_AUTHORIZED);
        assert!(tier <= 7, E_INVALID_TIER);

        let new_config = TierConfig { tier, multiplier, base_reward, min_score };

        if (tier == 0) { state.tier_0 = new_config; }
        else if (tier == 1) { state.tier_1 = new_config; }
        else if (tier == 2) { state.tier_2 = new_config; }
        else if (tier == 3) { state.tier_3 = new_config; }
        else if (tier == 4) { state.tier_4 = new_config; }
        else if (tier == 5) { state.tier_5 = new_config; }
        else if (tier == 6) { state.tier_6 = new_config; }
        else if (tier == 7) { state.tier_7 = new_config; };
    }

    /// Get tier configuration
    #[view]
    public fun get_tier_config(tier: u8): (u64, u64) acquires TiersState {
        let state = borrow_global<TiersState>(@spp_protocol);
        assert!(tier <= 7, E_INVALID_TIER);

        let config = if (tier == 0) { state.tier_0 }
        else if (tier == 1) { state.tier_1 }
        else if (tier == 2) { state.tier_2 }
        else if (tier == 3) { state.tier_3 }
        else if (tier == 4) { state.tier_4 }
        else if (tier == 5) { state.tier_5 }
        else if (tier == 6) { state.tier_6 }
        else { state.tier_7 };

        (config.multiplier, config.base_reward)
    }

    /// Get all tier configurations
    #[view]
    public fun get_all_tiers(): vector<TierConfig> acquires TiersState {
        let state = borrow_global<TiersState>(@spp_protocol);
        vector[
            state.tier_0,
            state.tier_1,
            state.tier_2,
            state.tier_3,
            state.tier_4,
            state.tier_5,
            state.tier_6,
            state.tier_7,
        ]
    }
}
