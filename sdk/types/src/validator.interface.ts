/**
 * Validator SDK Interface
 * Unified interface that all chain-specific validators must implement
 */

export interface IValidatorSDK {
  // Configuration
  initialize(config: ValidatorConfig): Promise<void>;
  getChainInfo(): ChainInfo;

  // Transaction Submission
  registerMatch(matchId: string, sport: number): Promise<TransactionResult>;
  finalizeMatch(matchId: string, winner: number, dataHash: string): Promise<TransactionResult>;
  recordPerformance(params: PerformanceParams): Promise<TransactionResult>;
  recordCricketPerformance(params: CricketPerformanceParams): Promise<TransactionResult>;
  executeBurn(matchId: string, player: string): Promise<BurnResult>;

  // Queries
  getMatch(matchId: string): Promise<MatchData | null>;
  getPerformance(matchId: string, player: string): Promise<PerformanceData | null>;
  getTokenBalance(address: string): Promise<bigint>;

  // Event Listening
  subscribeToMatchEvents(callback: (event: MatchEvent) => void): Subscription;
  subscribeToBurnEvents(callback: (event: BurnEvent) => void): Subscription;

  // Validation
  verifyMatchData(matchId: string, expectedHash: string): Promise<boolean>;
  verifyPerformance(matchId: string, player: string, expectedScore: number): Promise<boolean>;
}

export interface ValidatorConfig {
  rpcUrl: string;
  privateKey?: string;        // For signing transactions
  contractAddresses: {
    token: string;
    oracle: string;
    burnEngine: string;
    rewardTiers: string;
  };
  gasConfig?: {
    maxGasPrice?: bigint;
    gasLimit?: bigint;
  };
  network?: string;            // For Aptos: 'mainnet' | 'testnet' | 'devnet'
}

export interface ChainInfo {
  name: string;
  chainId: number | string;
  nativeCurrency: string;
  blockExplorer: string;
  rpcUrl?: string;
}

export interface TransactionResult {
  txHash: string;
  status: 'pending' | 'confirmed' | 'failed';
  blockNumber?: number;
  gasUsed?: bigint;
  error?: string;
}

export interface Subscription {
  unsubscribe: () => void;
}
