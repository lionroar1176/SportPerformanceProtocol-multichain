// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./IPerformanceOracle.sol";

/**
 * @title IDeflatinaryBurn
 * @dev Interface for deflationary burn engine
 */
interface IDeflatinaryBurn {
    struct BurnResult {
        bytes32 matchId;
        address player;
        uint256 burnAmount;
        uint256 rewardAmount;
        IPerformanceOracle.RewardTier tier;
        uint256 timestamp;
    }

    event BurnExecuted(
        bytes32 indexed matchId,
        address indexed player,
        uint256 burnAmount,
        uint256 rewardAmount,
        IPerformanceOracle.RewardTier tier,
        uint256 timestamp
    );

    event RewardClaimed(
        address indexed player,
        uint256 amount,
        uint256 timestamp
    );

    function calculateReward(
        IPerformanceOracle.RewardTier tier,
        uint256 effortScore
    ) external view returns (uint256);

    function burnForPerformance(
        bytes32 matchId,
        address player,
        IPerformanceOracle.RewardTier tier,
        uint256 performanceScore,
        uint256 effortScore
    ) external returns (BurnResult memory);

    function totalBurned() external view returns (uint256);

    function totalRewards() external view returns (uint256);

    function getPlayerRewards(address player) external view returns (uint256);

    function getPlayerBurned(address player) external view returns (uint256);
}
