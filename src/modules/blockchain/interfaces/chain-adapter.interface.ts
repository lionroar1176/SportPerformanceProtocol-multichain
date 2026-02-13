/**
 * Chain Adapter Interface
 * Unified interface for all blockchain adapters
 */

export enum ChainType {
  ARBITRUM = 'arbitrum',
  SOLANA = 'solana',
  BNB = 'bnb',
  OPBNB = 'opbnb',
  APTOS = 'aptos',
}

export enum RewardTier {
  NIFTY_FIFTY = 0,
  GAYLE_STORM = 1,
  FIVE_WICKET_HAUL = 2,
  HAT_TRICK = 3,
  MAIDEN_MASTER = 4,
  RUN_MACHINE = 5,
  GOLDEN_ARM = 6,
  ALL_ROUNDER = 7,
}

export interface ChainConfig {
  rpcUrl: string;
  chainId?: number | string;
  privateKey?: string;
  contractAddresses: {
    token: string;
    oracle: string;
    burnEngine: string;
    rewardTiers: string;
  };
}

export interface ChainInfo {
  name: string;
  chainType: ChainType;
  nativeCurrency: string;
  blockExplorer: string;
  isTestnet: boolean;
}

export interface TransactionResult {
  txHash: string;
  status: 'pending' | 'confirmed' | 'failed';
  blockNumber?: number;
  gasUsed?: bigint;
  error?: string;
}

export interface MatchParams {
  matchId: string;
  sport: number;
}

export interface FinalizeMatchParams {
  matchId: string;
  winner: number;
  dataHash: string;
}

export interface PerformanceParams {
  matchId: string;
  player: string;
  performanceScore: number;
  effortScore: number;
  rewardTier: RewardTier;
}

export interface CricketPerformanceParams {
  matchId: string;
  player: string;
  runs: number;
  ballsFaced: number;
  wickets: number;
  oversBowled: number;
  runsConceded: number;
  maidenOvers: number;
}

export interface BurnParams {
  matchId: string;
  player: string;
  tier: RewardTier;
  performanceScore: number;
  effortScore: number;
}

export interface BurnResult {
  txHash: string;
  burnAmount: bigint;
  rewardAmount: bigint;
  tier: RewardTier;
  player: string;
  matchId: string;
}

export interface MatchData {
  matchId: string;
  sport: number;
  status: number;
  winner?: number;
  dataHash?: string;
  playerCount: number;
  registeredAt: number;
  finalizedAt?: number;
}

export interface PerformanceData {
  matchId: string;
  player: string;
  performanceScore: number;
  effortScore: number;
  rewardTier: RewardTier;
  timestamp: number;
  verified: boolean;
}

/**
 * Base interface that all chain adapters must implement
 */
export interface IChainAdapter {
  /**
   * Initialize the adapter with configuration
   */
  initialize(config: ChainConfig): Promise<void>;

  /**
   * Get chain information
   */
  getChainInfo(): ChainInfo;

  /**
   * Register a new match
   */
  registerMatch(params: MatchParams): Promise<TransactionResult>;

  /**
   * Finalize a match
   */
  finalizeMatch(params: FinalizeMatchParams): Promise<TransactionResult>;

  /**
   * Record general performance
   */
  recordPerformance(params: PerformanceParams): Promise<TransactionResult>;

  /**
   * Record cricket-specific performance
   */
  recordCricketPerformance(params: CricketPerformanceParams): Promise<TransactionResult>;

  /**
   * Execute burn and mint rewards
   */
  executeBurn(params: BurnParams): Promise<BurnResult>;

  /**
   * Get match data
   */
  getMatch(matchId: string): Promise<MatchData | null>;

  /**
   * Get performance data
   */
  getPerformance(matchId: string, player: string): Promise<PerformanceData | null>;

  /**
   * Get token balance
   */
  getTokenBalance(address: string): Promise<bigint>;

  /**
   * Verify match data hash
   */
  verifyMatchData(matchId: string, expectedHash: string): Promise<boolean>;

  /**
   * Check if chain is healthy/responsive
   */
  healthCheck(): Promise<boolean>;
}
