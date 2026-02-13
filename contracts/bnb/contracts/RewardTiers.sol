// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title RewardTiers
 * @dev Manages the reward tier configuration system
 *
 * Key Features:
 * - 8 predefined tiers based on cricket achievements
 * - Each tier has a multiplier and base reward
 * - Admin can update tier values for flexibility
 * - Read-only access for other contracts
 * - Gas-optimized storage
 */
contract RewardTiers is Ownable {
    /// @dev Tier constants
    uint8 public constant TIER_NIFTY_FIFTY = 0;
    uint8 public constant TIER_GAYLE_STORM = 1;
    uint8 public constant TIER_FIVE_WICKET_HAUL = 2;
    uint8 public constant TIER_HAT_TRICK = 3;
    uint8 public constant TIER_MAIDEN_MASTER = 4;
    uint8 public constant TIER_RUN_MACHINE = 5;
    uint8 public constant TIER_GOLDEN_ARM = 6;
    uint8 public constant TIER_ALL_ROUNDER = 7;

    /// @dev Tier configuration
    struct TierConfig {
        uint8 tierId;
        string name;
        string description;
        uint256 multiplier; // Multiplied by 10 (e.g., 15 = 1.5x)
        uint256 baseReward;
        uint256 minRuns; // Minimum runs for batting tiers
        uint256 minWickets; // Minimum wickets for bowling tiers
        bool isActive;
    }

    /// @dev Storage
    mapping(uint8 => TierConfig) public tiers;
    uint8 public totalTiers;

    /// @dev Events
    event TierConfigured(
        uint8 indexed tierId,
        string name,
        uint256 multiplier,
        uint256 baseReward
    );

    event TierUpdated(
        uint8 indexed tierId,
        uint256 newMultiplier,
        uint256 newBaseReward
    );

    event TierActivated(uint8 indexed tierId, bool active);

    /// @dev Errors
    error InvalidTier();
    error TierNotActive();

    constructor() Ownable(msg.sender) {
        totalTiers = 8;

        // Configure all 8 tiers
        _configureTier(
            TIER_NIFTY_FIFTY,
            "Nifty Fifty",
            "Scored 50+ runs in a match",
            15, // 1.5x
            50 * 10**18,
            50,
            0
        );

        _configureTier(
            TIER_GAYLE_STORM,
            "Gayle Storm",
            "Scored 100+ runs with SR > 150",
            30, // 3.0x
            150 * 10**18,
            100,
            0
        );

        _configureTier(
            TIER_FIVE_WICKET_HAUL,
            "Five Wicket Haul",
            "Took 5+ wickets in a match",
            25, // 2.5x
            100 * 10**18,
            0,
            5
        );

        _configureTier(
            TIER_HAT_TRICK,
            "Hat Trick",
            "Took 3 wickets in 3 consecutive balls",
            30, // 3.0x
            200 * 10**18,
            0,
            3
        );

        _configureTier(
            TIER_MAIDEN_MASTER,
            "Maiden Master",
            "Bowled 3+ maiden overs",
            15, // 1.5x
            30 * 10**18,
            0,
            0
        );

        _configureTier(
            TIER_RUN_MACHINE,
            "Run Machine",
            "Scored 150+ runs in a match",
            40, // 4.0x
            250 * 10**18,
            150,
            0
        );

        _configureTier(
            TIER_GOLDEN_ARM,
            "Golden Arm",
            "Best economy rate in match",
            13, // 1.3x
            40 * 10**18,
            0,
            1
        );

        _configureTier(
            TIER_ALL_ROUNDER,
            "All Rounder",
            "30+ runs and 2+ wickets",
            20, // 2.0x
            120 * 10**18,
            30,
            2
        );
    }

    /**
     * @dev Get tier multiplier and base reward
     * @param tierId Tier identifier (0-7)
     * @return multiplier Tier multiplier
     * @return baseReward Base reward amount
     */
    function getTierMultiplier(uint8 tierId)
        external
        view
        returns (uint256 multiplier, uint256 baseReward)
    {
        if (tierId >= totalTiers) {
            revert InvalidTier();
        }

        TierConfig storage tier = tiers[tierId];

        if (!tier.isActive) {
            revert TierNotActive();
        }

        return (tier.multiplier, tier.baseReward);
    }

    /**
     * @dev Get tier details
     * @param tierId Tier identifier
     * @return Complete tier configuration
     */
    function getTierDetails(uint8 tierId)
        external
        view
        returns (
            string memory name,
            string memory description,
            uint256 multiplier,
            uint256 baseReward,
            bool isActive
        )
    {
        if (tierId >= totalTiers) {
            revert InvalidTier();
        }

        TierConfig storage tier = tiers[tierId];

        return (
            tier.name,
            tier.description,
            tier.multiplier,
            tier.baseReward,
            tier.isActive
        );
    }

    /**
     * @dev Get tier requirements
     * @param tierId Tier identifier
     * @return minRuns Minimum runs required
     * @return minWickets Minimum wickets required
     */
    function getTierRequirements(uint8 tierId)
        external
        view
        returns (uint256 minRuns, uint256 minWickets)
    {
        if (tierId >= totalTiers) {
            revert InvalidTier();
        }

        TierConfig storage tier = tiers[tierId];

        return (tier.minRuns, tier.minWickets);
    }

    /**
     * @dev Update tier multiplier and base reward (admin only)
     * @param tierId Tier to update
     * @param multiplier New multiplier
     * @param baseReward New base reward
     */
    function updateTier(
        uint8 tierId,
        uint256 multiplier,
        uint256 baseReward
    ) external onlyOwner {
        if (tierId >= totalTiers) {
            revert InvalidTier();
        }

        tiers[tierId].multiplier = multiplier;
        tiers[tierId].baseReward = baseReward;

        emit TierUpdated(tierId, multiplier, baseReward);
    }

    /**
     * @dev Activate or deactivate a tier (admin only)
     * @param tierId Tier to update
     * @param active New status
     */
    function setTierActive(uint8 tierId, bool active) external onlyOwner {
        if (tierId >= totalTiers) {
            revert InvalidTier();
        }

        tiers[tierId].isActive = active;

        emit TierActivated(tierId, active);
    }

    /**
     * @dev Check if a tier is active
     * @param tierId Tier to check
     * @return True if active
     */
    function isTierActive(uint8 tierId) external view returns (bool) {
        if (tierId >= totalTiers) {
            revert InvalidTier();
        }

        return tiers[tierId].isActive;
    }

    /**
     * @dev Get total number of tiers
     * @return Total tiers
     */
    function getTotalTiers() external view returns (uint8) {
        return totalTiers;
    }

    /**
     * @dev Get tier name by ID
     * @param tierId Tier identifier
     * @return Tier name
     */
    function getTierName(uint8 tierId) external view returns (string memory) {
        if (tierId >= totalTiers) {
            revert InvalidTier();
        }

        return tiers[tierId].name;
    }

    /**
     * @dev Internal function to configure a tier
     */
    function _configureTier(
        uint8 tierId,
        string memory name,
        string memory description,
        uint256 multiplier,
        uint256 baseReward,
        uint256 minRuns,
        uint256 minWickets
    ) internal {
        tiers[tierId] = TierConfig({
            tierId: tierId,
            name: name,
            description: description,
            multiplier: multiplier,
            baseReward: baseReward,
            minRuns: minRuns,
            minWickets: minWickets,
            isActive: true
        });

        emit TierConfigured(tierId, name, multiplier, baseReward);
    }
}
