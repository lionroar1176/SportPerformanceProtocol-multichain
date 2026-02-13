/**
 * Deflationary Burn Engine
 * Manages token burning and reward distribution based on performance
 */
module spp_protocol::deflatinary_burn {
    use std::signer;
    use std::vector;
    use aptos_framework::event::{Self, EventHandle};
    use aptos_framework::account;
    use aptos_framework::timestamp;
    use aptos_std::table::{Self, Table};
    use spp_protocol::spp_token;
    use spp_protocol::reward_tiers;

    /// Error codes
    const E_NOT_AUTHORIZED: u64 = 1;
    const E_MATCH_NOT_FOUND: u64 = 2;
    const E_ALREADY_BURNED: u64 = 3;
    const E_INSUFFICIENT_BALANCE: u64 = 4;
    const E_INVALID_TIER: u64 = 5;

    /// Reward tiers (matches enum in other chains)
    const TIER_NIFTY_FIFTY: u8 = 0;
    const TIER_GAYLE_STORM: u8 = 1;
    const TIER_FIVE_WICKET_HAUL: u8 = 2;
    const TIER_HAT_TRICK: u8 = 3;
    const TIER_MAIDEN_MASTER: u8 = 4;
    const TIER_RUN_MACHINE: u8 = 5;
    const TIER_GOLDEN_ARM: u8 = 6;
    const TIER_ALL_ROUNDER: u8 = 7;

    /// Burn record
    struct BurnRecord has store, drop, copy {
        match_id: vector<u8>,
        player: address,
        burn_amount: u64,
        reward_amount: u64,
        tier: u8,
        effort_score: u64,
        timestamp: u64,
    }

    /// Burn engine state
    struct BurnEngineState has key {
        admin: address,
        burn_records: Table<vector<u8>, BurnRecord>,
        total_burned: u64,
        total_rewards: u64,
        player_rewards: Table<address, u64>,
        player_burned: Table<address, u64>,
        burn_executed_events: EventHandle<BurnExecutedEvent>,
        reward_claimed_events: EventHandle<RewardClaimedEvent>,
    }

    /// Events
    struct BurnExecutedEvent has drop, store {
        match_id: vector<u8>,
        player: address,
        burn_amount: u64,
        reward_amount: u64,
        tier: u8,
        timestamp: u64,
    }

    struct RewardClaimedEvent has drop, store {
        player: address,
        amount: u64,
        timestamp: u64,
    }

    /// Initialize burn engine
    public entry fun initialize(admin: &signer) {
        let admin_addr = signer::address_of(admin);

        move_to(admin, BurnEngineState {
            admin: admin_addr,
            burn_records: table::new(),
            total_burned: 0,
            total_rewards: 0,
            player_rewards: table::new(),
            player_burned: table::new(),
            burn_executed_events: account::new_event_handle<BurnExecutedEvent>(admin),
            reward_claimed_events: account::new_event_handle<RewardClaimedEvent>(admin),
        });
    }

    /// Calculate reward based on tier and effort score
    public fun calculate_reward(tier: u8, effort_score: u64): u64 {
        // Get tier config from reward_tiers module
        let (multiplier, base_reward) = reward_tiers::get_tier_config(tier);

        // Calculate effort multiplier (effort_score is 0-100)
        let effort_multiplier = effort_score;

        // Calculate final reward: base_reward * multiplier * (effort_score / 100)
        let reward = (base_reward * multiplier * effort_multiplier) / 10000; // Divide by 10000 to account for percentages

        reward
    }

    /// Execute burn for performance
    public entry fun burn_for_performance(
        player: &signer,
        match_id: vector<u8>,
        tier: u8,
        performance_score: u64,
        effort_score: u64
    ) acquires BurnEngineState {
        let player_addr = signer::address_of(player);
        let state = borrow_global_mut<BurnEngineState>(@spp_protocol);

        // Validate tier
        assert!(tier <= 7, E_INVALID_TIER);

        // Create burn key
        let burn_key = match_id;
        vector::append(&mut burn_key, bcs::to_bytes(&player_addr));

        // Check if already burned for this match
        assert!(!table::contains(&state.burn_records, burn_key), E_ALREADY_BURNED);

        // Calculate reward
        let reward_amount = calculate_reward(tier, effort_score);

        // Calculate burn amount (10% of reward)
        let burn_amount = reward_amount / 10;

        // Burn tokens
        spp_token::burn(player, burn_amount);

        // Create burn record
        let record = BurnRecord {
            match_id,
            player: player_addr,
            burn_amount,
            reward_amount,
            tier,
            effort_score,
            timestamp: timestamp::now_seconds(),
        };

        table::add(&mut state.burn_records, burn_key, record);

        // Update totals
        state.total_burned = state.total_burned + burn_amount;
        state.total_rewards = state.total_rewards + reward_amount;

        // Update player stats
        if (table::contains(&state.player_burned, player_addr)) {
            let current = *table::borrow(&state.player_burned, player_addr);
            *table::borrow_mut(&mut state.player_burned, player_addr) = current + burn_amount;
        } else {
            table::add(&mut state.player_burned, player_addr, burn_amount);
        };

        if (table::contains(&state.player_rewards, player_addr)) {
            let current = *table::borrow(&state.player_rewards, player_addr);
            *table::borrow_mut(&mut state.player_rewards, player_addr) = current + reward_amount;
        } else {
            table::add(&mut state.player_rewards, player_addr, reward_amount);
        };

        // Mint reward tokens to player
        spp_token::mint(&state.admin, player_addr, reward_amount);

        // Emit event
        event::emit_event(
            &mut state.burn_executed_events,
            BurnExecutedEvent {
                match_id,
                player: player_addr,
                burn_amount,
                reward_amount,
                tier,
                timestamp: timestamp::now_seconds(),
            }
        );
    }

    /// Get total burned
    #[view]
    public fun total_burned(): u64 acquires BurnEngineState {
        borrow_global<BurnEngineState>(@spp_protocol).total_burned
    }

    /// Get total rewards
    #[view]
    public fun total_rewards(): u64 acquires BurnEngineState {
        borrow_global<BurnEngineState>(@spp_protocol).total_rewards
    }

    /// Get player rewards
    #[view]
    public fun get_player_rewards(player: address): u64 acquires BurnEngineState {
        let state = borrow_global<BurnEngineState>(@spp_protocol);
        if (table::contains(&state.player_rewards, player)) {
            *table::borrow(&state.player_rewards, player)
        } else {
            0
        }
    }

    /// Get player burned amount
    #[view]
    public fun get_player_burned(player: address): u64 acquires BurnEngineState {
        let state = borrow_global<BurnEngineState>(@spp_protocol);
        if (table::contains(&state.player_burned, player)) {
            *table::borrow(&state.player_burned, player)
        } else {
            0
        }
    }

    /// Get burn record
    #[view]
    public fun get_burn_record(match_id: vector<u8>, player: address): BurnRecord acquires BurnEngineState {
        let state = borrow_global<BurnEngineState>(@spp_protocol);
        let burn_key = match_id;
        vector::append(&mut burn_key, bcs::to_bytes(&player));

        assert!(table::contains(&state.burn_records, burn_key), E_MATCH_NOT_FOUND);
        *table::borrow(&state.burn_records, burn_key)
    }
}
