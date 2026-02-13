/**
 * Performance Oracle - Match and Performance Data Recording
 * Stores verifiable performance data on-chain for Sport Performance Protocol
 */
module spp_protocol::performance_oracle {
    use std::signer;
    use std::vector;
    use std::string::String;
    use aptos_framework::event::{Self, EventHandle};
    use aptos_framework::account;
    use aptos_framework::timestamp;
    use aptos_std::table::{Self, Table};

    /// Error codes
    const E_NOT_AUTHORIZED: u64 = 1;
    const E_MATCH_NOT_FOUND: u64 = 2;
    const E_MATCH_ALREADY_EXISTS: u64 = 3;
    const E_MATCH_ALREADY_FINALIZED: u64 = 4;
    const E_MATCH_NOT_FINALIZED: u64 = 5;

    /// Sport types
    const SPORT_CRICKET: u8 = 0;
    const SPORT_FOOTBALL: u8 = 1;
    const SPORT_BASKETBALL: u8 = 2;
    const SPORT_TENNIS: u8 = 3;

    /// Match status
    const STATUS_REGISTERED: u8 = 0;
    const STATUS_IN_PROGRESS: u8 = 1;
    const STATUS_FINALIZED: u8 = 2;
    const STATUS_CANCELLED: u8 = 3;

    /// Match data structure
    struct Match has store, drop, copy {
        match_id: vector<u8>,
        sport: u8,
        status: u8,
        winner: u8,
        data_hash: vector<u8>,
        player_count: u64,
        registered_at: u64,
        finalized_at: u64,
    }

    /// Performance data structure
    struct Performance has store, drop, copy {
        match_id: vector<u8>,
        player: address,
        performance_score: u64,
        effort_score: u64,
        reward_tier: u8,
        timestamp: u64,
        verified: bool,
    }

    /// Cricket-specific performance data
    struct CricketPerformance has store, drop, copy {
        match_id: vector<u8>,
        player: address,
        runs: u64,
        balls_faced: u64,
        wickets: u64,
        overs_bowled: u64,
        runs_conceded: u64,
        maiden_overs: u64,
        timestamp: u64,
    }

    /// Oracle state
    struct OracleState has key {
        admin: address,
        oracle_addresses: vector<address>,
        match_store: Table<vector<u8>, Match>,
        performance_store: Table<vector<u8>, Performance>,
        cricket_performance_store: Table<vector<u8>, CricketPerformance>,
        match_registered_events: EventHandle<MatchRegisteredEvent>,
        match_finalized_events: EventHandle<MatchFinalizedEvent>,
        performance_recorded_events: EventHandle<PerformanceRecordedEvent>,
    }

    /// Events
    struct MatchRegisteredEvent has drop, store {
        match_id: vector<u8>,
        sport: u8,
        timestamp: u64,
    }

    struct MatchFinalizedEvent has drop, store {
        match_id: vector<u8>,
        winner: u8,
        data_hash: vector<u8>,
        timestamp: u64,
    }

    struct PerformanceRecordedEvent has drop, store {
        match_id: vector<u8>,
        player: address,
        performance_score: u64,
        timestamp: u64,
    }

    /// Initialize the oracle
    public entry fun initialize(admin: &signer) {
        let admin_addr = signer::address_of(admin);

        move_to(admin, OracleState {
            admin: admin_addr,
            oracle_addresses: vector::empty(),
            match_store: table::new(),
            performance_store: table::new(),
            cricket_performance_store: table::new(),
            match_registered_events: account::new_event_handle<MatchRegisteredEvent>(admin),
            match_finalized_events: account::new_event_handle<MatchFinalizedEvent>(admin),
            performance_recorded_events: account::new_event_handle<PerformanceRecordedEvent>(admin),
        });
    }

    /// Add oracle address
    public entry fun add_oracle(
        admin: &signer,
        oracle_addr: address
    ) acquires OracleState {
        let admin_addr = signer::address_of(admin);
        let state = borrow_global_mut<OracleState>(@spp_protocol);
        assert!(admin_addr == state.admin, E_NOT_AUTHORIZED);

        vector::push_back(&mut state.oracle_addresses, oracle_addr);
    }

    /// Register a match
    public entry fun register_match(
        oracle: &signer,
        match_id: vector<u8>,
        sport: u8
    ) acquires OracleState {
        let oracle_addr = signer::address_of(oracle);
        let state = borrow_global_mut<OracleState>(@spp_protocol);

        // Check authorization
        assert!(
            oracle_addr == state.admin || vector::contains(&state.oracle_addresses, &oracle_addr),
            E_NOT_AUTHORIZED
        );

        // Check if match already exists
        assert!(!table::contains(&state.match_store, match_id), E_MATCH_ALREADY_EXISTS);

        // Create match
        let match_data = Match {
            match_id,
            sport,
            status: STATUS_REGISTERED,
            winner: 0,
            data_hash: vector::empty(),
            player_count: 0,
            registered_at: timestamp::now_seconds(),
            finalized_at: 0,
        };

        table::add(&mut state.match_store, match_id, match_data);

        // Emit event
        event::emit_event(
            &mut state.match_registered_events,
            MatchRegisteredEvent {
                match_id,
                sport,
                timestamp: timestamp::now_seconds(),
            }
        );
    }

    /// Finalize match
    public entry fun finalize_match(
        oracle: &signer,
        match_id: vector<u8>,
        winner: u8,
        data_hash: vector<u8>
    ) acquires OracleState {
        let oracle_addr = signer::address_of(oracle);
        let state = borrow_global_mut<OracleState>(@spp_protocol);

        // Check authorization
        assert!(
            oracle_addr == state.admin || vector::contains(&state.oracle_addresses, &oracle_addr),
            E_NOT_AUTHORIZED
        );

        // Get match
        assert!(table::contains(&state.match_store, match_id), E_MATCH_NOT_FOUND);
        let match_data = table::borrow_mut(&mut state.match_store, match_id);

        // Check if already finalized
        assert!(match_data.status != STATUS_FINALIZED, E_MATCH_ALREADY_FINALIZED);

        // Update match
        match_data.status = STATUS_FINALIZED;
        match_data.winner = winner;
        match_data.data_hash = data_hash;
        match_data.finalized_at = timestamp::now_seconds();

        // Emit event
        event::emit_event(
            &mut state.match_finalized_events,
            MatchFinalizedEvent {
                match_id,
                winner,
                data_hash,
                timestamp: timestamp::now_seconds(),
            }
        );
    }

    /// Record performance
    public entry fun record_performance(
        oracle: &signer,
        match_id: vector<u8>,
        player: address,
        performance_score: u64,
        effort_score: u64,
        reward_tier: u8
    ) acquires OracleState {
        let oracle_addr = signer::address_of(oracle);
        let state = borrow_global_mut<OracleState>(@spp_protocol);

        // Check authorization
        assert!(
            oracle_addr == state.admin || vector::contains(&state.oracle_addresses, &oracle_addr),
            E_NOT_AUTHORIZED
        );

        // Check if match exists
        assert!(table::contains(&state.match_store, match_id), E_MATCH_NOT_FOUND);

        // Create performance key (match_id + player address)
        let perf_key = match_id;
        vector::append(&mut perf_key, bcs::to_bytes(&player));

        // Create performance record
        let performance = Performance {
            match_id,
            player,
            performance_score,
            effort_score,
            reward_tier,
            timestamp: timestamp::now_seconds(),
            verified: true,
        };

        // Store or update performance
        if (table::contains(&state.performance_store, perf_key)) {
            *table::borrow_mut(&mut state.performance_store, perf_key) = performance;
        } else {
            table::add(&mut state.performance_store, perf_key, performance);
        };

        // Emit event
        event::emit_event(
            &mut state.performance_recorded_events,
            PerformanceRecordedEvent {
                match_id,
                player,
                performance_score,
                timestamp: timestamp::now_seconds(),
            }
        );
    }

    /// Record cricket-specific performance
    public entry fun record_cricket_performance(
        oracle: &signer,
        match_id: vector<u8>,
        player: address,
        runs: u64,
        balls_faced: u64,
        wickets: u64,
        overs_bowled: u64,
        runs_conceded: u64,
        maiden_overs: u64
    ) acquires OracleState {
        let oracle_addr = signer::address_of(oracle);
        let state = borrow_global_mut<OracleState>(@spp_protocol);

        // Check authorization
        assert!(
            oracle_addr == state.admin || vector::contains(&state.oracle_addresses, &oracle_addr),
            E_NOT_AUTHORIZED
        );

        // Check if match exists
        assert!(table::contains(&state.match_store, match_id), E_MATCH_NOT_FOUND);

        // Create performance key
        let perf_key = match_id;
        vector::append(&mut perf_key, bcs::to_bytes(&player));

        // Create cricket performance record
        let cricket_perf = CricketPerformance {
            match_id,
            player,
            runs,
            balls_faced,
            wickets,
            overs_bowled,
            runs_conceded,
            maiden_overs,
            timestamp: timestamp::now_seconds(),
        };

        // Store or update
        if (table::contains(&state.cricket_performance_store, perf_key)) {
            *table::borrow_mut(&mut state.cricket_performance_store, perf_key) = cricket_perf;
        } else {
            table::add(&mut state.cricket_performance_store, perf_key, cricket_perf);
        };
    }

    /// Get match data (view function)
    #[view]
    public fun get_match(match_id: vector<u8>): Match acquires OracleState {
        let state = borrow_global<OracleState>(@spp_protocol);
        assert!(table::contains(&state.match_store, match_id), E_MATCH_NOT_FOUND);
        *table::borrow(&state.match_store, match_id)
    }

    /// Get performance data (view function)
    #[view]
    public fun get_performance(match_id: vector<u8>, player: address): Performance acquires OracleState {
        let state = borrow_global<OracleState>(@spp_protocol);
        let perf_key = match_id;
        vector::append(&mut perf_key, bcs::to_bytes(&player));

        assert!(table::contains(&state.performance_store, perf_key), E_MATCH_NOT_FOUND);
        *table::borrow(&state.performance_store, perf_key)
    }
}
