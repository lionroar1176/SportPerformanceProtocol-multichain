/**
 * BNB Smart Chain Validator SDK
 * Implementation of IValidatorSDK for BNB Chain using ethers.js v6
 */

import {
  ethers,
  JsonRpcProvider,
  Wallet,
  Contract,
  TransactionReceipt,
  EventLog,
  Log,
  parseUnits,
  formatUnits,
} from 'ethers';

import {
  IValidatorSDK,
  ValidatorConfig,
  ChainInfo,
  TransactionResult,
  PerformanceParams,
  CricketPerformanceParams,
  BurnResult,
  MatchData,
  PerformanceData,
  Subscription,
  MatchEvent,
  BurnEvent,
  SportType,
  MatchStatus,
  RewardTier,
} from '@spp/types';

/**
 * Contract ABIs for BNB Chain
 */
const ORACLE_ABI = [
  // Match Management
  'function registerMatch(string matchId, uint8 sport) external',
  'function finalizeMatch(string matchId, uint8 winner, bytes32 dataHash) external',
  'function getMatch(string matchId) external view returns (tuple(string matchId, uint8 sport, uint8 status, uint8 winner, bytes32 dataHash, uint256 playerCount, uint256 registeredAt, uint256 finalizedAt))',

  // Performance Recording
  'function recordPerformance(string matchId, address player, uint256 performanceScore, uint256 effortScore, uint8 rewardTier) external',
  'function recordCricketPerformance(string matchId, address player, uint256 runs, uint256 ballsFaced, uint256 wickets, uint256 oversBowled, uint256 runsConceded, uint256 maidenOvers) external',
  'function getPerformance(string matchId, address player) external view returns (tuple(string matchId, address player, uint256 performanceScore, uint256 effortScore, uint8 rewardTier, uint256 timestamp, bool verified))',

  // Events
  'event MatchRegistered(string indexed matchId, uint8 sport, uint256 timestamp)',
  'event MatchFinalized(string indexed matchId, uint8 winner, bytes32 dataHash, uint256 timestamp)',
  'event PerformanceRecorded(string indexed matchId, address indexed player, uint256 performanceScore, uint8 rewardTier)',
];

const BURN_ENGINE_ABI = [
  'function executeBurn(string matchId, address player, uint8 tier, uint256 performanceScore, uint256 effortScore) external returns (uint256 burnAmount, uint256 rewardAmount)',
  'function calculateBurn(uint8 tier, uint256 performanceScore, uint256 effortScore) external view returns (uint256 burnAmount, uint256 rewardAmount)',
  'event BurnExecuted(string indexed matchId, address indexed player, uint256 burnAmount, uint256 rewardAmount, uint8 tier)',
  'event RewardClaimed(address indexed player, uint256 amount, uint256 timestamp)',
];

const TOKEN_ABI = [
  'function balanceOf(address account) external view returns (uint256)',
  'function transfer(address to, uint256 amount) external returns (bool)',
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
];

const REWARD_TIERS_ABI = [
  'function getTierConfig(uint8 tier) external view returns (tuple(uint8 tier, uint256 multiplier, uint256 baseReward, uint256 minimumScore))',
  'function validateTier(uint8 tier, uint256 score) external view returns (bool)',
];

/**
 * Error codes for BNB validator
 */
export enum BNBValidatorError {
  NOT_INITIALIZED = 'BNB_NOT_INITIALIZED',
  NO_WALLET = 'BNB_NO_WALLET',
  TRANSACTION_FAILED = 'BNB_TX_FAILED',
  CONTRACT_ERROR = 'BNB_CONTRACT_ERROR',
  INVALID_MATCH = 'BNB_INVALID_MATCH',
  INVALID_PERFORMANCE = 'BNB_INVALID_PERFORMANCE',
  GAS_ESTIMATION_FAILED = 'BNB_GAS_ESTIMATION_FAILED',
  INSUFFICIENT_BALANCE = 'BNB_INSUFFICIENT_BALANCE',
}

export class BNBValidatorSDK implements IValidatorSDK {
  protected provider!: JsonRpcProvider;
  protected wallet?: Wallet;
  protected config!: ValidatorConfig;
  protected oracleContract!: Contract;
  protected burnEngineContract!: Contract;
  protected tokenContract!: Contract;
  protected rewardTiersContract!: Contract;
  protected initialized: boolean = false;

  /**
   * Initialize the BNB validator with configuration
   */
  async initialize(config: ValidatorConfig): Promise<void> {
    this.config = config;
    this.provider = new JsonRpcProvider(config.rpcUrl);

    // Initialize wallet if private key provided
    if (config.privateKey) {
      this.wallet = new Wallet(config.privateKey, this.provider);
    }

    // Initialize contract instances
    this.oracleContract = new Contract(
      config.contractAddresses.oracle,
      ORACLE_ABI,
      this.wallet || this.provider
    );

    this.burnEngineContract = new Contract(
      config.contractAddresses.burnEngine,
      BURN_ENGINE_ABI,
      this.wallet || this.provider
    );

    this.tokenContract = new Contract(
      config.contractAddresses.token,
      TOKEN_ABI,
      this.wallet || this.provider
    );

    this.rewardTiersContract = new Contract(
      config.contractAddresses.rewardTiers,
      REWARD_TIERS_ABI,
      this.wallet || this.provider
    );

    this.initialized = true;
  }

  /**
   * Get chain information
   */
  getChainInfo(): ChainInfo {
    return {
      name: 'BNB Smart Chain',
      chainId: this.config.network === 'mainnet' ? 56 : 97,
      nativeCurrency: 'BNB',
      blockExplorer:
        this.config.network === 'mainnet'
          ? 'https://bscscan.com'
          : 'https://testnet.bscscan.com',
      rpcUrl: this.config.rpcUrl,
    };
  }

  /**
   * Register a new match
   */
  async registerMatch(matchId: string, sport: number): Promise<TransactionResult> {
    this.ensureInitialized();
    this.ensureWallet();

    try {
      // Estimate gas
      const gasEstimate = await this.oracleContract.registerMatch.estimateGas(
        matchId,
        sport
      );

      // Add 20% buffer to gas estimate
      const gasLimit = (gasEstimate * 120n) / 100n;

      // Get gas price
      const feeData = await this.provider.getFeeData();
      const gasPrice = this.config.gasConfig?.maxGasPrice
        ? feeData.gasPrice! < this.config.gasConfig.maxGasPrice
          ? feeData.gasPrice
          : this.config.gasConfig.maxGasPrice
        : feeData.gasPrice;

      // Execute transaction
      const tx = await this.oracleContract.registerMatch(matchId, sport, {
        gasLimit,
        gasPrice,
      });

      // Wait for confirmation
      const receipt = await tx.wait();

      return this.parseTransactionReceipt(receipt);
    } catch (error) {
      return this.handleTransactionError(error);
    }
  }

  /**
   * Finalize a match with winner and data hash
   */
  async finalizeMatch(
    matchId: string,
    winner: number,
    dataHash: string
  ): Promise<TransactionResult> {
    this.ensureInitialized();
    this.ensureWallet();

    try {
      // Convert data hash to bytes32
      const bytes32Hash = ethers.encodeBytes32String(dataHash.slice(0, 31));

      const gasEstimate = await this.oracleContract.finalizeMatch.estimateGas(
        matchId,
        winner,
        bytes32Hash
      );

      const gasLimit = (gasEstimate * 120n) / 100n;
      const feeData = await this.provider.getFeeData();
      const gasPrice = this.getOptimalGasPrice(feeData.gasPrice);

      const tx = await this.oracleContract.finalizeMatch(matchId, winner, bytes32Hash, {
        gasLimit,
        gasPrice,
      });

      const receipt = await tx.wait();
      return this.parseTransactionReceipt(receipt);
    } catch (error) {
      return this.handleTransactionError(error);
    }
  }

  /**
   * Record performance for a player
   */
  async recordPerformance(params: PerformanceParams): Promise<TransactionResult> {
    this.ensureInitialized();
    this.ensureWallet();

    try {
      const gasEstimate = await this.oracleContract.recordPerformance.estimateGas(
        params.matchId,
        params.player,
        params.performanceScore,
        params.effortScore,
        params.rewardTier
      );

      const gasLimit = (gasEstimate * 120n) / 100n;
      const feeData = await this.provider.getFeeData();
      const gasPrice = this.getOptimalGasPrice(feeData.gasPrice);

      const tx = await this.oracleContract.recordPerformance(
        params.matchId,
        params.player,
        params.performanceScore,
        params.effortScore,
        params.rewardTier,
        {
          gasLimit,
          gasPrice,
        }
      );

      const receipt = await tx.wait();
      return this.parseTransactionReceipt(receipt);
    } catch (error) {
      return this.handleTransactionError(error);
    }
  }

  /**
   * Record cricket-specific performance
   */
  async recordCricketPerformance(
    params: CricketPerformanceParams
  ): Promise<TransactionResult> {
    this.ensureInitialized();
    this.ensureWallet();

    try {
      const gasEstimate = await this.oracleContract.recordCricketPerformance.estimateGas(
        params.matchId,
        params.player,
        params.runs,
        params.ballsFaced,
        params.wickets,
        params.oversBowled,
        params.runsConceded,
        params.maidenOvers
      );

      const gasLimit = (gasEstimate * 120n) / 100n;
      const feeData = await this.provider.getFeeData();
      const gasPrice = this.getOptimalGasPrice(feeData.gasPrice);

      const tx = await this.oracleContract.recordCricketPerformance(
        params.matchId,
        params.player,
        params.runs,
        params.ballsFaced,
        params.wickets,
        params.oversBowled,
        params.runsConceded,
        params.maidenOvers,
        {
          gasLimit,
          gasPrice,
        }
      );

      const receipt = await tx.wait();
      return this.parseTransactionReceipt(receipt);
    } catch (error) {
      return this.handleTransactionError(error);
    }
  }

  /**
   * Execute burn for a player's performance
   */
  async executeBurn(matchId: string, player: string): Promise<BurnResult> {
    this.ensureInitialized();
    this.ensureWallet();

    try {
      // Get performance data first
      const perfData = await this.getPerformance(matchId, player);
      if (!perfData) {
        throw new Error(`${BNBValidatorError.INVALID_PERFORMANCE}: Performance not found`);
      }

      // Calculate burn amounts first
      const [burnAmount, rewardAmount] = await this.burnEngineContract.calculateBurn(
        perfData.rewardTier,
        perfData.performanceScore,
        perfData.effortScore
      );

      // Check token balance and allowance
      const balance = await this.tokenContract.balanceOf(this.wallet!.address);
      if (balance < burnAmount) {
        throw new Error(`${BNBValidatorError.INSUFFICIENT_BALANCE}: Insufficient token balance`);
      }

      // Ensure burn engine has allowance
      const allowance = await this.tokenContract.allowance(
        this.wallet!.address,
        this.config.contractAddresses.burnEngine
      );

      if (allowance < burnAmount) {
        // Approve burn engine
        const approveTx = await this.tokenContract.approve(
          this.config.contractAddresses.burnEngine,
          ethers.MaxUint256
        );
        await approveTx.wait();
      }

      // Execute burn
      const gasEstimate = await this.burnEngineContract.executeBurn.estimateGas(
        matchId,
        player,
        perfData.rewardTier,
        perfData.performanceScore,
        perfData.effortScore
      );

      const gasLimit = (gasEstimate * 120n) / 100n;
      const feeData = await this.provider.getFeeData();
      const gasPrice = this.getOptimalGasPrice(feeData.gasPrice);

      const tx = await this.burnEngineContract.executeBurn(
        matchId,
        player,
        perfData.rewardTier,
        perfData.performanceScore,
        perfData.effortScore,
        {
          gasLimit,
          gasPrice,
        }
      );

      const receipt = await tx.wait();

      return {
        txHash: receipt.hash,
        burnAmount,
        rewardAmount,
        tier: perfData.rewardTier,
        player,
        matchId,
        timestamp: Date.now(),
      };
    } catch (error) {
      throw new Error(
        `Burn execution failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get match data
   */
  async getMatch(matchId: string): Promise<MatchData | null> {
    this.ensureInitialized();

    try {
      const result = await this.oracleContract.getMatch(matchId);

      return {
        matchId: result.matchId,
        sport: result.sport as SportType,
        status: result.status as MatchStatus,
        winner: result.winner,
        dataHash: result.dataHash !== ethers.ZeroHash
          ? ethers.decodeBytes32String(result.dataHash)
          : undefined,
        playerCount: Number(result.playerCount),
        registeredAt: Number(result.registeredAt),
        finalizedAt: result.finalizedAt > 0 ? Number(result.finalizedAt) : undefined,
      };
    } catch (error) {
      console.error('Error getting match:', error);
      return null;
    }
  }

  /**
   * Get performance data for a player
   */
  async getPerformance(matchId: string, player: string): Promise<PerformanceData | null> {
    this.ensureInitialized();

    try {
      const result = await this.oracleContract.getPerformance(matchId, player);

      return {
        matchId: result.matchId,
        player: result.player,
        performanceScore: Number(result.performanceScore),
        effortScore: Number(result.effortScore),
        rewardTier: result.rewardTier as RewardTier,
        timestamp: Number(result.timestamp),
        verified: result.verified,
      };
    } catch (error) {
      console.error('Error getting performance:', error);
      return null;
    }
  }

  /**
   * Get token balance for an address
   */
  async getTokenBalance(address: string): Promise<bigint> {
    this.ensureInitialized();

    try {
      const balance = await this.tokenContract.balanceOf(address);
      return balance;
    } catch (error) {
      console.error('Error getting token balance:', error);
      return 0n;
    }
  }

  /**
   * Subscribe to match events
   */
  subscribeToMatchEvents(callback: (event: MatchEvent) => void): Subscription {
    this.ensureInitialized();

    const registeredFilter = this.oracleContract.filters.MatchRegistered();
    const finalizedFilter = this.oracleContract.filters.MatchFinalized();

    const handleRegistered = async (matchId: string, sport: number, timestamp: bigint, event: any) => {
      const block = await event.getBlock();
      callback({
        type: 'registered',
        matchId,
        timestamp: Number(timestamp),
        blockNumber: block.number,
        txHash: event.log.transactionHash,
        data: { sport },
      });
    };

    const handleFinalized = async (
      matchId: string,
      winner: number,
      dataHash: string,
      timestamp: bigint,
      event: any
    ) => {
      const block = await event.getBlock();
      callback({
        type: 'finalized',
        matchId,
        timestamp: Number(timestamp),
        blockNumber: block.number,
        txHash: event.log.transactionHash,
        data: { winner, dataHash },
      });
    };

    this.oracleContract.on(registeredFilter, handleRegistered);
    this.oracleContract.on(finalizedFilter, handleFinalized);

    return {
      unsubscribe: () => {
        this.oracleContract.off(registeredFilter, handleRegistered);
        this.oracleContract.off(finalizedFilter, handleFinalized);
      },
    };
  }

  /**
   * Subscribe to burn events
   */
  subscribeToBurnEvents(callback: (event: BurnEvent) => void): Subscription {
    this.ensureInitialized();

    const burnFilter = this.burnEngineContract.filters.BurnExecuted();
    const rewardFilter = this.burnEngineContract.filters.RewardClaimed();

    const handleBurn = async (
      matchId: string,
      player: string,
      burnAmount: bigint,
      rewardAmount: bigint,
      tier: number,
      event: any
    ) => {
      const block = await event.getBlock();
      callback({
        type: 'burn_executed',
        matchId,
        player,
        amount: burnAmount,
        timestamp: block.timestamp,
        blockNumber: block.number,
        txHash: event.log.transactionHash,
      });
    };

    const handleReward = async (
      player: string,
      amount: bigint,
      timestamp: bigint,
      event: any
    ) => {
      const block = await event.getBlock();
      callback({
        type: 'reward_claimed',
        matchId: '',
        player,
        amount,
        timestamp: Number(timestamp),
        blockNumber: block.number,
        txHash: event.log.transactionHash,
      });
    };

    this.burnEngineContract.on(burnFilter, handleBurn);
    this.burnEngineContract.on(rewardFilter, handleReward);

    return {
      unsubscribe: () => {
        this.burnEngineContract.off(burnFilter, handleBurn);
        this.burnEngineContract.off(rewardFilter, handleReward);
      },
    };
  }

  /**
   * Verify match data hash
   */
  async verifyMatchData(matchId: string, expectedHash: string): Promise<boolean> {
    this.ensureInitialized();

    try {
      const match = await this.getMatch(matchId);
      if (!match || !match.dataHash) {
        return false;
      }

      return match.dataHash === expectedHash;
    } catch (error) {
      return false;
    }
  }

  /**
   * Verify performance score
   */
  async verifyPerformance(
    matchId: string,
    player: string,
    expectedScore: number
  ): Promise<boolean> {
    this.ensureInitialized();

    try {
      const perf = await this.getPerformance(matchId, player);
      if (!perf) {
        return false;
      }

      return perf.performanceScore === expectedScore && perf.verified;
    } catch (error) {
      return false;
    }
  }

  /**
   * Helper: Ensure SDK is initialized
   */
  protected ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error(`${BNBValidatorError.NOT_INITIALIZED}: SDK not initialized`);
    }
  }

  /**
   * Helper: Ensure wallet is available
   */
  protected ensureWallet(): void {
    if (!this.wallet) {
      throw new Error(
        `${BNBValidatorError.NO_WALLET}: Wallet not initialized. Provide privateKey in config.`
      );
    }
  }

  /**
   * Helper: Get optimal gas price
   */
  protected getOptimalGasPrice(currentPrice: bigint | null): bigint | undefined {
    if (!currentPrice) return undefined;

    if (this.config.gasConfig?.maxGasPrice) {
      return currentPrice < this.config.gasConfig.maxGasPrice
        ? currentPrice
        : this.config.gasConfig.maxGasPrice;
    }

    return currentPrice;
  }

  /**
   * Helper: Parse transaction receipt
   */
  protected parseTransactionReceipt(receipt: TransactionReceipt): TransactionResult {
    return {
      txHash: receipt.hash,
      status: receipt.status === 1 ? 'confirmed' : 'failed',
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed,
    };
  }

  /**
   * Helper: Handle transaction errors
   */
  protected handleTransactionError(error: any): TransactionResult {
    let errorMessage = error instanceof Error ? error.message : String(error);
    let errorCode = BNBValidatorError.TRANSACTION_FAILED;

    // Parse specific errors
    if (errorMessage.includes('insufficient funds')) {
      errorCode = BNBValidatorError.INSUFFICIENT_BALANCE;
    } else if (errorMessage.includes('gas')) {
      errorCode = BNBValidatorError.GAS_ESTIMATION_FAILED;
    } else if (errorMessage.includes('contract')) {
      errorCode = BNBValidatorError.CONTRACT_ERROR;
    }

    return {
      txHash: '',
      status: 'failed',
      error: `${errorCode}: ${errorMessage}`,
    };
  }
}
