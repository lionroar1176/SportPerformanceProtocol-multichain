// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PerformanceOracle
 * @dev Trust Layer for match data verification - stores finalized match proofs on-chain
 *
 * Key Features:
 * - Register matches before they begin
 * - Finalize matches with performance data
 * - Generate cryptographic proofs for match results
 * - Verify performance claims against stored data
 * - Access control (only authorized oracles can write)
 */
contract PerformanceOracle is Ownable {
    /// @dev Match data structure
    struct MatchData {
        bytes32 matchId;
        address organizer;
        uint256 registeredAt;
        uint256 finalizedAt;
        bool isFinalized;
        uint8 totalPlayers;
        bytes32 dataHash;
    }

    /// @dev Player performance data structure
    struct PlayerPerformance {
        address player;
        uint256 runsScored;
        uint256 wicketsTaken;
        uint256 ballsFaced;
        uint256 ballsBowled;
        uint256 strikeRate; // Multiplied by 100 to avoid decimals
        uint8 tier; // Reward tier (0-7)
        uint256 effortScore; // From wearable data (0-100)
        bool verified;
    }

    /// @dev Storage
    mapping(bytes32 => MatchData) public matches;
    mapping(bytes32 => mapping(address => PlayerPerformance)) public performances;
    mapping(address => bytes32[]) public playerMatchHistory;
    uint256 public totalMatches;

    /// @dev Authorized oracles who can write data
    mapping(address => bool) public authorizedOracles;

    /// @dev Events
    event MatchRegistered(
        bytes32 indexed matchId,
        address indexed organizer,
        uint256 timestamp
    );

    event MatchFinalized(
        bytes32 indexed matchId,
        uint256 totalPlayers,
        uint256 timestamp
    );

    event PerformanceRecorded(
        bytes32 indexed matchId,
        address indexed player,
        uint8 tier,
        uint256 effortScore
    );

    event OracleAuthorized(address indexed oracle, bool authorized);

    /// @dev Errors
    error MatchNotFound();
    error MatchAlreadyFinalized();
    error MatchNotFinalized();
    error Unauthorized();
    error InvalidPlayer();
    error MatchAlreadyExists();

    /// @dev Modifiers
    modifier onlyAuthorized() {
        require(
            authorizedOracles[msg.sender] || msg.sender == owner(),
            "Not authorized"
        );
        _;
    }

    constructor() Ownable(msg.sender) {
        totalMatches = 0;
        // Owner is automatically authorized
        authorizedOracles[msg.sender] = true;
    }

    /**
     * @dev Authorize or deauthorize an oracle (only owner)
     * @param oracle Oracle address
     * @param authorized Authorization status
     */
    function setOracleAuthorization(address oracle, bool authorized)
        external
        onlyOwner
    {
        require(oracle != address(0), "Invalid oracle address");
        authorizedOracles[oracle] = authorized;
        emit OracleAuthorized(oracle, authorized);
    }

    /**
     * @dev Register a new match before it begins
     * @param matchId Unique identifier for the match
     */
    function registerMatch(bytes32 matchId) external onlyAuthorized {
        // Check if match already exists
        if (matches[matchId].registeredAt != 0) {
            revert MatchAlreadyExists();
        }

        // Create new match record
        matches[matchId] = MatchData({
            matchId: matchId,
            organizer: msg.sender,
            registeredAt: block.timestamp,
            finalizedAt: 0,
            isFinalized: false,
            totalPlayers: 0,
            dataHash: bytes32(0)
        });

        totalMatches++;

        emit MatchRegistered(matchId, msg.sender, block.timestamp);
    }

    /**
     * @dev Finalize a match with performance data
     * @param matchId The match identifier
     * @param dataHash Hash of the complete match data
     * @param playerCount Number of players in the match
     */
    function finalizeMatch(
        bytes32 matchId,
        bytes32 dataHash,
        uint8 playerCount
    ) external onlyAuthorized {
        MatchData storage matchData = matches[matchId];

        // Verify match exists
        if (matchData.registeredAt == 0) {
            revert MatchNotFound();
        }

        // Check if already finalized
        if (matchData.isFinalized) {
            revert MatchAlreadyFinalized();
        }

        // Update match status
        matchData.finalizedAt = block.timestamp;
        matchData.isFinalized = true;
        matchData.dataHash = dataHash;
        matchData.totalPlayers = playerCount;

        emit MatchFinalized(matchId, playerCount, block.timestamp);
    }

    /**
     * @dev Record individual player performance
     * @param matchId The match identifier
     * @param player Player's address
     * @param runsScored Runs scored by the player
     * @param wicketsTaken Wickets taken by the player
     * @param ballsFaced Balls faced by the player
     * @param ballsBowled Balls bowled by the player
     * @param tier Reward tier (0-7)
     * @param effortScore Effort score from wearable (0-100)
     */
    function recordPerformance(
        bytes32 matchId,
        address player,
        uint256 runsScored,
        uint256 wicketsTaken,
        uint256 ballsFaced,
        uint256 ballsBowled,
        uint8 tier,
        uint256 effortScore
    ) external onlyAuthorized {
        // Verify match exists
        if (matches[matchId].registeredAt == 0) {
            revert MatchNotFound();
        }

        // Match must not be finalized yet (performances recorded before finalization)
        if (matches[matchId].isFinalized) {
            revert MatchAlreadyFinalized();
        }

        // Validate effort score
        require(effortScore <= 100, "Invalid effort score");
        require(tier <= 7, "Invalid tier");

        // Calculate strike rate (runs * 100 / balls_faced)
        uint256 strikeRate = ballsFaced > 0
            ? (runsScored * 100) / ballsFaced
            : 0;

        // Store performance data
        performances[matchId][player] = PlayerPerformance({
            player: player,
            runsScored: runsScored,
            wicketsTaken: wicketsTaken,
            ballsFaced: ballsFaced,
            ballsBowled: ballsBowled,
            strikeRate: strikeRate,
            tier: tier,
            effortScore: effortScore,
            verified: true
        });

        // Add to player's match history
        playerMatchHistory[player].push(matchId);

        emit PerformanceRecorded(matchId, player, tier, effortScore);
    }

    /**
     * @dev Get match proof for verification
     * @param matchId The match identifier
     * @return dataHash Match data hash
     * @return isFinalized Finalization status
     * @return finalizedAt Finalization timestamp
     */
    function getMatchProof(bytes32 matchId)
        external
        view
        returns (
            bytes32 dataHash,
            bool isFinalized,
            uint256 finalizedAt
        )
    {
        MatchData storage matchData = matches[matchId];
        return (matchData.dataHash, matchData.isFinalized, matchData.finalizedAt);
    }

    /**
     * @dev Verify a player's performance claim
     * @param matchId The match identifier
     * @param player Player's address
     * @return True if verified performance exists
     */
    function verifyPerformance(bytes32 matchId, address player)
        external
        view
        returns (bool)
    {
        return performances[matchId][player].verified;
    }

    /**
     * @dev Get player performance details
     * @param matchId The match identifier
     * @param player Player's address
     * @return Performance data
     */
    function getPlayerPerformance(bytes32 matchId, address player)
        external
        view
        returns (PlayerPerformance memory)
    {
        PlayerPerformance storage perf = performances[matchId][player];

        if (!perf.verified) {
            revert InvalidPlayer();
        }

        return perf;
    }

    /**
     * @dev Get total number of matches registered
     * @return Total matches
     */
    function getTotalMatches() external view returns (uint256) {
        return totalMatches;
    }

    /**
     * @dev Get match details
     * @param matchId The match identifier
     * @return Match data
     */
    function getMatchDetails(bytes32 matchId)
        external
        view
        returns (MatchData memory)
    {
        if (matches[matchId].registeredAt == 0) {
            revert MatchNotFound();
        }
        return matches[matchId];
    }

    /**
     * @dev Get player's match history
     * @param player Player's address
     * @return Array of match IDs
     */
    function getPlayerMatchHistory(address player)
        external
        view
        returns (bytes32[] memory)
    {
        return playerMatchHistory[player];
    }
}
