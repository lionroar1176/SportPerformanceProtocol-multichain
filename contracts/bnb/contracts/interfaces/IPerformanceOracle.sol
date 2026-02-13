// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title IPerformanceOracle
 * @dev Interface for performance data recording and verification
 */
interface IPerformanceOracle {
    enum SportType {
        CRICKET,
        FOOTBALL,
        BASKETBALL,
        TENNIS
    }

    enum MatchStatus {
        REGISTERED,
        IN_PROGRESS,
        FINALIZED,
        CANCELLED
    }

    enum RewardTier {
        NIFTY_FIFTY,
        GAYLE_STORM,
        FIVE_WICKET_HAUL,
        HAT_TRICK,
        MAIDEN_MASTER,
        RUN_MACHINE,
        GOLDEN_ARM,
        ALL_ROUNDER
    }

    struct MatchData {
        bytes32 matchId;
        SportType sport;
        MatchStatus status;
        uint8 winner;
        bytes32 dataHash;
        uint256 playerCount;
        uint256 registeredAt;
        uint256 finalizedAt;
    }

    struct PerformanceData {
        bytes32 matchId;
        address player;
        uint256 performanceScore;
        uint256 effortScore;
        RewardTier tier;
        uint256 timestamp;
        bool verified;
    }

    struct CricketPerformanceData {
        bytes32 matchId;
        address player;
        uint256 runs;
        uint256 ballsFaced;
        uint256 wickets;
        uint256 oversBowled;
        uint256 runsConceded;
        uint256 maidenOvers;
        uint256 timestamp;
    }

    event MatchRegistered(bytes32 indexed matchId, SportType sport, uint256 timestamp);
    event MatchFinalized(bytes32 indexed matchId, uint8 winner, bytes32 dataHash, uint256 timestamp);
    event PerformanceRecorded(bytes32 indexed matchId, address indexed player, uint256 performanceScore, uint256 timestamp);

    function registerMatch(bytes32 matchId, SportType sport) external;

    function finalizeMatch(bytes32 matchId, uint8 winner, bytes32 dataHash) external;

    function recordPerformance(
        bytes32 matchId,
        address player,
        uint256 performanceScore,
        uint256 effortScore,
        RewardTier tier
    ) external;

    function recordCricketPerformance(
        bytes32 matchId,
        address player,
        uint256 runs,
        uint256 ballsFaced,
        uint256 wickets,
        uint256 oversBowled,
        uint256 runsConceded,
        uint256 maidenOvers
    ) external;

    function getMatch(bytes32 matchId) external view returns (MatchData memory);

    function getPerformance(bytes32 matchId, address player) external view returns (PerformanceData memory);

    function getCricketPerformance(bytes32 matchId, address player) external view returns (CricketPerformanceData memory);

    function verifyMatchData(bytes32 matchId, bytes32 expectedHash) external view returns (bool);
}
