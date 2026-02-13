/**
 * Base Chain Adapter
 * Abstract base class providing common functionality for all blockchain adapters
 */

import { Logger } from '@nestjs/common';
import {
  IChainAdapter,
  ChainConfig,
  ChainInfo,
  ChainType,
  TransactionResult,
  MatchParams,
  FinalizeMatchParams,
  PerformanceParams,
  CricketPerformanceParams,
  BurnParams,
  BurnResult,
  MatchData,
  PerformanceData,
} from '../interfaces/chain-adapter.interface';

/**
 * Abstract base adapter implementing common functionality
 */
export abstract class BaseChainAdapter implements IChainAdapter {
  protected readonly logger: Logger;
  protected config: ChainConfig;
  protected initialized = false;

  constructor(loggerContext: string) {
    this.logger = new Logger(loggerContext);
  }

  /**
   * Initialize the adapter with configuration
   */
  async initialize(config: ChainConfig): Promise<void> {
    try {
      this.logger.log(`Initializing ${this.getChainInfo().name} adapter...`);

      // Validate configuration
      this.validateConfig(config);
      this.config = config;

      // Perform chain-specific initialization
      await this.initializeChain();

      this.initialized = true;
      this.logger.log(`${this.getChainInfo().name} adapter initialized successfully`);
    } catch (error) {
      this.logger.error(`Failed to initialize adapter: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Validate configuration before initialization
   */
  protected validateConfig(config: ChainConfig): void {
    if (!config.rpcUrl) {
      throw new Error('RPC URL is required');
    }

    if (!config.contractAddresses) {
      throw new Error('Contract addresses are required');
    }

    const { token, oracle, burnEngine, rewardTiers } = config.contractAddresses;
    if (!token || !oracle || !burnEngine || !rewardTiers) {
      throw new Error('All contract addresses must be provided');
    }
  }

  /**
   * Ensure adapter is initialized before operations
   */
  protected ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('Adapter not initialized. Call initialize() first.');
    }
  }

  /**
   * Handle errors consistently across all adapters
   */
  protected handleError(operation: string, error: any): never {
    const message = error?.message || 'Unknown error';
    this.logger.error(`${operation} failed: ${message}`, error.stack);
    throw new Error(`${operation} failed: ${message}`);
  }

  /**
   * Log transaction details
   */
  protected logTransaction(operation: string, txHash: string, details?: any): void {
    this.logger.log(`${operation} transaction submitted: ${txHash}`);
    if (details) {
      this.logger.debug(`Transaction details: ${JSON.stringify(details)}`);
    }
  }

  /**
   * Create a standardized transaction result
   */
  protected createTransactionResult(
    txHash: string,
    status: 'pending' | 'confirmed' | 'failed',
    blockNumber?: number,
    gasUsed?: bigint,
    error?: string,
  ): TransactionResult {
    return {
      txHash,
      status,
      blockNumber,
      gasUsed,
      error,
    };
  }

  /**
   * Wait for transaction confirmation with timeout
   */
  protected async waitForConfirmation(
    txHash: string,
    timeoutMs: number = 60000,
  ): Promise<TransactionResult> {
    const startTime = Date.now();

    try {
      this.logger.log(`Waiting for transaction confirmation: ${txHash}`);

      while (Date.now() - startTime < timeoutMs) {
        const result = await this.checkTransactionStatus(txHash);

        if (result.status === 'confirmed' || result.status === 'failed') {
          this.logger.log(`Transaction ${txHash} ${result.status}`);
          return result;
        }

        // Wait before checking again
        await this.sleep(2000);
      }

      // Timeout
      this.logger.warn(`Transaction ${txHash} confirmation timeout`);
      return this.createTransactionResult(txHash, 'pending');
    } catch (error) {
      this.handleError('Transaction confirmation', error);
    }
  }

  /**
   * Sleep utility for async delays
   */
  protected sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Format address for the specific chain
   */
  protected abstract formatAddress(address: string): string;

  /**
   * Validate address format for the specific chain
   */
  protected abstract validateAddress(address: string): boolean;

  /**
   * Chain-specific initialization
   */
  protected abstract initializeChain(): Promise<void>;

  /**
   * Check transaction status on the chain
   */
  protected abstract checkTransactionStatus(txHash: string): Promise<TransactionResult>;

  // Abstract methods that must be implemented by subclasses
  abstract getChainInfo(): ChainInfo;
  abstract registerMatch(params: MatchParams): Promise<TransactionResult>;
  abstract finalizeMatch(params: FinalizeMatchParams): Promise<TransactionResult>;
  abstract recordPerformance(params: PerformanceParams): Promise<TransactionResult>;
  abstract recordCricketPerformance(params: CricketPerformanceParams): Promise<TransactionResult>;
  abstract executeBurn(params: BurnParams): Promise<BurnResult>;
  abstract getMatch(matchId: string): Promise<MatchData | null>;
  abstract getPerformance(matchId: string, player: string): Promise<PerformanceData | null>;
  abstract getTokenBalance(address: string): Promise<bigint>;
  abstract verifyMatchData(matchId: string, expectedHash: string): Promise<boolean>;
  abstract healthCheck(): Promise<boolean>;
}
