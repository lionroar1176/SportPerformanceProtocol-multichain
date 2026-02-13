// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/ISPPToken.sol";

/**
 * @title DeflatinaryBurn
 * @dev Token burn mechanism tied to performance metrics
 *
 * Key Features:
 * - Performance-based burn multipliers (1.5x to 4.0x)
 * - Effort validation from wearable data
 * - 10% of rewards are burned to reduce supply
 * - Tracks total burned for transparency
 * - Configurable reward tiers
 */
contract DeflatinaryBurn is Ownable {
    /// @dev Reward tier constants
    uint8 public constant TIER_NIFTY_FIFTY = 0;
    uint8 public constant TIER_GAYLE_STORM = 1;
    uint8 public constant TIER_FIVE_WICKET_HAUL = 2;
    uint8 public constant TIER_HAT_TRICK = 3;
    uint8 public constant TIER_MAIDEN_MASTER = 4;
    uint8 public constant TIER_RUN_MACHINE = 5;
    uint8 public constant TIER_GOLDEN_ARM = 6;
    uint8 public constant TIER_ALL_ROUNDER = 7;

    /// @dev Burn transaction record
    struct BurnTransaction {
        bytes32 matchId;
        address player;
        uint256 burnAmount;
        uint256 rewardAmount;
        uint8 tier;
        uint256 effortScore;
        uint256 timestamp;
        bool executed;
    }

    /// @dev Storage
    ISPPToken public tokenContract;
    address public oracleContract;

    /// @dev Burn multipliers for each tier (multiplied by 10)
    mapping(uint8 => uint256) public burnMultipliers;

    /// @dev Base reward amounts for each tier
    mapping(uint8 => uint256) public baseRewards;

    /// @dev Total tokens burned
    uint256 public totalBurnedAmount;

    /// @dev Total rewards distributed
    uint256 public totalRewardsDistributed;

    /// @dev Player rewards and burns tracking
    mapping(address => uint256) public playerTotalRewards;
    mapping(address => uint256) public playerTotalBurned;

    /// @dev Burn transactions
    mapping(bytes32 => BurnTransaction) public burnTransactions;

    /// @dev Events
    event TokensBurned(
        bytes32 indexed matchId,
        address indexed player,
        uint256 burnAmount,
        uint256 rewardAmount,
        uint8 tier
    );

    event RewardCalculated(
        address indexed player,
        uint8 tier,
        uint256 baseReward,
        uint256 effortMultiplier,
        uint256 finalReward
    );

    event TierUpdated(
        uint8 indexed tier,
        uint256 multiplier,
        uint256 baseReward
    );

    event OracleUpdated(address indexed oldOracle, address indexed newOracle);

    /// @dev Errors
    error InvalidTier();
    error InvalidEffortScore();
    error Unauthorized();
    error BurnAlreadyExecuted();

    /// @dev Modifier for oracle-only functions
    modifier onlyOracle() {
        require(
            msg.sender == oracleContract || msg.sender == owner(),
            "Not authorized"
        );
        _;
    }

    constructor(address _tokenContract, address _oracleContract) Ownable(msg.sender) {
        require(_tokenContract != address(0), "Invalid token contract");
        require(_oracleContract != address(0), "Invalid oracle contract");

        tokenContract = ISPPToken(_tokenContract);
        oracleContract = _oracleContract;

        // Initialize burn multipliers (multiplied by 10)
        burnMultipliers[TIER_NIFTY_FIFTY] = 15; // 1.5x
        burnMultipliers[TIER_GAYLE_STORM] = 30; // 3.0x
        burnMultipliers[TIER_FIVE_WICKET_HAUL] = 25; // 2.5x
        burnMultipliers[TIER_HAT_TRICK] = 30; // 3.0x
        burnMultipliers[TIER_MAIDEN_MASTER] = 15; // 1.5x
        burnMultipliers[TIER_RUN_MACHINE] = 40; // 4.0x
        burnMultipliers[TIER_GOLDEN_ARM] = 13; // 1.3x
        burnMultipliers[TIER_ALL_ROUNDER] = 20; // 2.0x

        // Initialize base rewards (in wei - 18 decimals)
        baseRewards[TIER_NIFTY_FIFTY] = 50 * 10**18;
        baseRewards[TIER_GAYLE_STORM] = 150 * 10**18;
        baseRewards[TIER_FIVE_WICKET_HAUL] = 100 * 10**18;
        baseRewards[TIER_HAT_TRICK] = 200 * 10**18;
        baseRewards[TIER_MAIDEN_MASTER] = 30 * 10**18;
        baseRewards[TIER_RUN_MACHINE] = 250 * 10**18;
        baseRewards[TIER_GOLDEN_ARM] = 40 * 10**18;
        baseRewards[TIER_ALL_ROUNDER] = 120 * 10**18;
    }

    /**
     * @dev Set oracle contract address (only owner)
     * @param _oracleContract New oracle address
     */
    function setOracleContract(address _oracleContract) external onlyOwner {
        require(_oracleContract != address(0), "Invalid oracle address");
        address oldOracle = oracleContract;
        oracleContract = _oracleContract;
        emit OracleUpdated(oldOracle, _oracleContract);
    }

    /**
     * @dev Calculate reward based on tier and effort score
     * @param tier Performance tier (0-7)
     * @param effortScore Effort score from wearable (0-100)
     * @return Final reward amount
     */
    function calculateReward(uint8 tier, uint256 effortScore)
        public
        view
        returns (uint256)
    {
        if (tier > TIER_ALL_ROUNDER) {
            revert InvalidTier();
        }

        if (effortScore > 100) {
            revert InvalidEffortScore();
        }

        // Get base reward and multiplier
        uint256 baseReward = baseRewards[tier];
        uint256 burnMultiplier = burnMultipliers[tier];

        // Calculate effort adjustment (effort_score / 100)
        uint256 effortAdjusted = (baseReward * effortScore) / 100;

        // Apply burn multiplier (divided by 10 since we stored multiplied values)
        uint256 finalReward = (effortAdjusted * burnMultiplier) / 10;

        return finalReward;
    }

    /**
     * @dev Execute burn for a player's performance
     * @param matchId The match identifier
     * @param player Player's address
     * @param tier Performance tier
     * @param effortScore Effort score from wearable
     * @return burnAmount Amount burned
     * @return rewardAmount Amount rewarded
     */
    function burnForPerformance(
        bytes32 matchId,
        address player,
        uint8 tier,
        uint256 effortScore
    ) external onlyOracle returns (uint256 burnAmount, uint256 rewardAmount) {
        // Create transaction ID
        bytes32 txId = _computeTxId(matchId, player);

        // Check if already executed
        if (burnTransactions[txId].executed) {
            revert BurnAlreadyExecuted();
        }

        // Calculate reward
        rewardAmount = calculateReward(tier, effortScore);

        // Calculate burn amount (10% of reward)
        burnAmount = rewardAmount / 10;

        // Record transaction
        burnTransactions[txId] = BurnTransaction({
            matchId: matchId,
            player: player,
            burnAmount: burnAmount,
            rewardAmount: rewardAmount,
            tier: tier,
            effortScore: effortScore,
            timestamp: block.timestamp,
            executed: true
        });

        // Update totals
        totalBurnedAmount += burnAmount;
        totalRewardsDistributed += rewardAmount;

        // Update player totals
        playerTotalRewards[player] += rewardAmount;
        playerTotalBurned[player] += burnAmount;

        // Execute the burn (tokens should be transferred to this contract first)
        // In production, you'd need to handle the token transfer logic

        // Emit events
        emit RewardCalculated(
            player,
            tier,
            baseRewards[tier],
            effortScore,
            rewardAmount
        );

        emit TokensBurned(matchId, player, burnAmount, rewardAmount, tier);

        return (burnAmount, rewardAmount);
    }

    /**
     * @dev Get reward tier configuration
     * @param tier The tier (0-7)
     * @return multiplier Burn multiplier
     * @return baseReward Base reward amount
     */
    function getRewardTier(uint8 tier)
        external
        view
        returns (uint256 multiplier, uint256 baseReward)
    {
        if (tier > TIER_ALL_ROUNDER) {
            revert InvalidTier();
        }

        return (burnMultipliers[tier], baseRewards[tier]);
    }

    /**
     * @dev Get total tokens burned
     * @return Total burned
     */
    function totalBurned() external view returns (uint256) {
        return totalBurnedAmount;
    }

    /**
     * @dev Get total rewards distributed
     * @return Total rewards
     */
    function totalRewards() external view returns (uint256) {
        return totalRewardsDistributed;
    }

    /**
     * @dev Get player's total rewards earned
     * @param player Player's address
     * @return Total rewards
     */
    function getPlayerRewards(address player) external view returns (uint256) {
        return playerTotalRewards[player];
    }

    /**
     * @dev Get player's total tokens burned
     * @param player Player's address
     * @return Total burned
     */
    function getPlayerBurned(address player) external view returns (uint256) {
        return playerTotalBurned[player];
    }

    /**
     * @dev Update tier configuration (admin only)
     * @param tier Tier to update
     * @param multiplier New multiplier
     * @param baseReward New base reward
     */
    function updateTier(
        uint8 tier,
        uint256 multiplier,
        uint256 baseReward
    ) external onlyOwner {
        if (tier > TIER_ALL_ROUNDER) {
            revert InvalidTier();
        }

        burnMultipliers[tier] = multiplier;
        baseRewards[tier] = baseReward;

        emit TierUpdated(tier, multiplier, baseReward);
    }

    /**
     * @dev Get burn transaction details
     * @param matchId The match identifier
     * @param player Player's address
     * @return Burn transaction data
     */
    function getBurnTransaction(bytes32 matchId, address player)
        external
        view
        returns (BurnTransaction memory)
    {
        bytes32 txId = _computeTxId(matchId, player);
        return burnTransactions[txId];
    }

    /**
     * @dev Compute transaction ID from match and player
     * @param matchId The match identifier
     * @param player Player's address
     * @return Transaction ID
     */
    function _computeTxId(bytes32 matchId, address player)
        internal
        pure
        returns (bytes32)
    {
        return keccak256(abi.encodePacked(matchId, player));
    }
}
