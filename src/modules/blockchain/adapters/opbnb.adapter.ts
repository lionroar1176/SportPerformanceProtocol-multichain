/**
 * opBNB Chain Adapter
 * Uses @spp/opbnb-validator-sdk for opBNB Chain integration
 * opBNB is an optimistic rollup on BNB Chain with higher throughput and lower fees
 */

import { Injectable } from '@nestjs/common';
import { BaseChainAdapter } from './base.adapter';
import {
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
  RewardTier,
} from '../interfaces/chain-adapter.interface';

// Note: @spp/opbnb-validator-sdk will need to be installed
interface OpBNBValidatorSDK {
  initialize(config: any): Promise<void>;
  registerMatch(matchId: string, sport: number): Promise<string>;
  finalizeMatch(matchId: string, winner: number, dataHash: string): Promise<string>;
  recordPerformance(
    matchId: string,
    player: string,
    performanceScore: number,
    effortScore: number,
    tier: number,
  ): Promise<string>;
  executeBurn(
    matchId: string,
    player: string,
    tier: number,
    performanceScore: number,
    effortScore: number,
  ): Promise<{ txHash: string; burnAmount: string; rewardAmount: string }>;
  getMatch(matchId: string): Promise<any>;
  getPerformance(matchId: string, player: string): Promise<any>;
  getBalance(address: string): Promise<string>;
  verifyData(matchId: string, expectedHash: string): Promise<boolean>;
  getTransactionReceipt(txHash: string): Promise<any>;
  healthCheck(): Promise<boolean>;
}

@Injectable()
export class OpBNBAdapter extends BaseChainAdapter {
  private sdk: OpBNBValidatorSDK;

  constructor() {
    super(OpBNBAdapter.name);
  }

  /**
   * Get chain information
   */
  getChainInfo(): ChainInfo {
    return {
      name: 'opBNB',
      chainType: ChainType.OPBNB,
      nativeCurrency: 'BNB',
      blockExplorer: 'https://opbnbscan.com',
      isTestnet: false,
    };
  }

  /**
   * Initialize opBNB Chain SDK
   */
  protected async initializeChain(): Promise<void> {
    try {
      // In production, initialize the actual SDK
      // this.sdk = new OpBNBValidatorSDK();
      // await this.sdk.initialize({
      //   rpcUrl: this.config.rpcUrl,
      //   chainId: this.config.chainId || 204,
      //   privateKey: this.config.privateKey,
      //   contracts: this.config.contractAddresses,
      // });

      this.logger.log('opBNB Chain adapter initialized (SDK pending implementation)');

      // For now, create a mock SDK
      this.sdk = this.createMockSDK();
    } catch (error) {
      this.handleError('opBNB Chain initialization', error);
    }
  }

  /**
   * Register a new match on opBNB
   */
  async registerMatch(params: MatchParams): Promise<TransactionResult> {
    this.ensureInitialized();

    try {
      this.logger.log(`Registering match ${params.matchId} on opBNB`);

      const txHash = await this.sdk.registerMatch(params.matchId, params.sport);

      this.logTransaction('Match registration', txHash);

      // opBNB has faster block times, shorter confirmation wait
      return this.waitForConfirmation(txHash, 10000); // 10 seconds
    } catch (error) {
      this.handleError('Register match', error);
    }
  }

  /**
   * Finalize a match on opBNB
   */
  async finalizeMatch(params: FinalizeMatchParams): Promise<TransactionResult> {
    this.ensureInitialized();

    try {
      this.logger.log(`Finalizing match ${params.matchId} on opBNB`);

      const txHash = await this.sdk.finalizeMatch(
        params.matchId,
        params.winner,
        params.dataHash,
      );

      this.logTransaction('Match finalization', txHash);

      return this.waitForConfirmation(txHash, 10000);
    } catch (error) {
      this.handleError('Finalize match', error);
    }
  }

  /**
   * Record general performance on opBNB
   */
  async recordPerformance(params: PerformanceParams): Promise<TransactionResult> {
    this.ensureInitialized();

    try {
      this.logger.log(`Recording performance for ${params.player} on opBNB`);

      const txHash = await this.sdk.recordPerformance(
        params.matchId,
        params.player,
        params.performanceScore,
        params.effortScore,
        params.rewardTier,
      );

      this.logTransaction('Performance recording', txHash);

      return this.waitForConfirmation(txHash, 10000);
    } catch (error) {
      this.handleError('Record performance', error);
    }
  }

  /**
   * Record cricket-specific performance
   */
  async recordCricketPerformance(params: CricketPerformanceParams): Promise<TransactionResult> {
    this.ensureInitialized();

    try {
      this.logger.log(`Recording cricket performance for ${params.player} on opBNB`);

      // Calculate performance metrics
      const performanceScore = this.calculateCricketPerformanceScore(params);
      const effortScore = this.calculateCricketEffortScore(params);
      const tier = this.determineCricketTier(params);

      // Use general performance recording
      return this.recordPerformance({
        matchId: params.matchId,
        player: params.player,
        performanceScore,
        effortScore,
        rewardTier: tier,
      });
    } catch (error) {
      this.handleError('Record cricket performance', error);
    }
  }

  /**
   * Execute burn transaction on opBNB
   */
  async executeBurn(params: BurnParams): Promise<BurnResult> {
    this.ensureInitialized();

    try {
      this.logger.log(`Executing burn for ${params.player} on opBNB`);

      const result = await this.sdk.executeBurn(
        params.matchId,
        params.player,
        params.tier,
        params.performanceScore,
        params.effortScore,
      );

      this.logTransaction('Burn execution', result.txHash);

      return {
        txHash: result.txHash,
        burnAmount: BigInt(result.burnAmount),
        rewardAmount: BigInt(result.rewardAmount),
        tier: params.tier,
        player: params.player,
        matchId: params.matchId,
      };
    } catch (error) {
      this.handleError('Execute burn', error);
    }
  }

  /**
   * Get match data from opBNB
   */
  async getMatch(matchId: string): Promise<MatchData | null> {
    this.ensureInitialized();

    try {
      const data = await this.sdk.getMatch(matchId);

      if (!data) {
        return null;
      }

      return {
        matchId,
        sport: data.sport,
        status: data.status,
        winner: data.winner,
        dataHash: data.dataHash,
        playerCount: data.playerCount,
        registeredAt: data.registeredAt,
        finalizedAt: data.finalizedAt,
      };
    } catch (error) {
      this.logger.error(`Failed to get match data: ${error.message}`);
      return null;
    }
  }

  /**
   * Get performance data for a player
   */
  async getPerformance(matchId: string, player: string): Promise<PerformanceData | null> {
    this.ensureInitialized();

    try {
      const data = await this.sdk.getPerformance(matchId, player);

      if (!data) {
        return null;
      }

      return {
        matchId,
        player,
        performanceScore: data.performanceScore,
        effortScore: data.effortScore,
        rewardTier: data.rewardTier,
        timestamp: data.timestamp,
        verified: data.verified,
      };
    } catch (error) {
      this.logger.error(`Failed to get performance data: ${error.message}`);
      return null;
    }
  }

  /**
   * Get token balance on opBNB
   */
  async getTokenBalance(address: string): Promise<bigint> {
    this.ensureInitialized();

    try {
      if (!this.validateAddress(address)) {
        throw new Error('Invalid opBNB address format');
      }

      const balance = await this.sdk.getBalance(address);
      return BigInt(balance);
    } catch (error) {
      this.logger.error(`Failed to get token balance: ${error.message}`);
      return BigInt(0);
    }
  }

  /**
   * Verify match data hash
   */
  async verifyMatchData(matchId: string, expectedHash: string): Promise<boolean> {
    this.ensureInitialized();

    try {
      return await this.sdk.verifyData(matchId, expectedHash);
    } catch (error) {
      this.logger.error(`Failed to verify match data: ${error.message}`);
      return false;
    }
  }

  /**
   * Health check for opBNB
   */
  async healthCheck(): Promise<boolean> {
    try {
      if (!this.initialized || !this.sdk) {
        return false;
      }

      return await this.sdk.healthCheck();
    } catch (error) {
      this.logger.error(`Health check failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Check transaction status on opBNB
   */
  protected async checkTransactionStatus(txHash: string): Promise<TransactionResult> {
    try {
      const receipt = await this.sdk.getTransactionReceipt(txHash);

      if (!receipt) {
        return this.createTransactionResult(txHash, 'pending');
      }

      return this.createTransactionResult(
        txHash,
        receipt.status ? 'confirmed' : 'failed',
        receipt.blockNumber,
        receipt.gasUsed ? BigInt(receipt.gasUsed) : undefined,
      );
    } catch (error) {
      return this.createTransactionResult(txHash, 'pending');
    }
  }

  /**
   * Format address for opBNB (EVM compatible)
   */
  protected formatAddress(address: string): string {
    return address.toLowerCase();
  }

  /**
   * Validate opBNB address (EVM format)
   */
  protected validateAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  /**
   * Calculate cricket performance score
   */
  private calculateCricketPerformanceScore(params: CricketPerformanceParams): number {
    const runScore = params.runs * 2;
    const wicketScore = params.wickets * 10;
    const economyPenalty = params.runsConceded / 10;
    return (runScore + wicketScore - economyPenalty) / 10;
  }

  /**
   * Calculate cricket effort score
   */
  private calculateCricketEffortScore(params: CricketPerformanceParams): number {
    const battingEffort = params.ballsFaced;
    const bowlingEffort = params.oversBowled * 6;
    const maidenBonus = params.maidenOvers * 20;
    return (battingEffort + bowlingEffort + maidenBonus) / 10;
  }

  /**
   * Determine reward tier based on cricket performance
   */
  private determineCricketTier(params: CricketPerformanceParams): RewardTier {
    if (params.runs >= 100) return RewardTier.GAYLE_STORM;
    if (params.runs >= 50) return RewardTier.NIFTY_FIFTY;
    if (params.wickets >= 5) return RewardTier.FIVE_WICKET_HAUL;
    if (params.wickets >= 3) return RewardTier.HAT_TRICK;
    if (params.maidenOvers >= 3) return RewardTier.MAIDEN_MASTER;
    return RewardTier.ALL_ROUNDER;
  }

  /**
   * Create mock SDK for development
   * TODO: Replace with actual SDK implementation
   */
  private createMockSDK(): OpBNBValidatorSDK {
    return {
      initialize: async () => {},
      registerMatch: async (matchId, sport) => `0x${Date.now().toString(16).padStart(64, '0')}`,
      finalizeMatch: async (matchId, winner, dataHash) =>
        `0x${Date.now().toString(16).padStart(64, '0')}`,
      recordPerformance: async (matchId, player, perfScore, effortScore, tier) =>
        `0x${Date.now().toString(16).padStart(64, '0')}`,
      executeBurn: async (matchId, player, tier, perfScore, effortScore) => ({
        txHash: `0x${Date.now().toString(16).padStart(64, '0')}`,
        burnAmount: '1000000000000000000',
        rewardAmount: '5000000000000000000',
      }),
      getMatch: async (matchId) => null,
      getPerformance: async (matchId, player) => null,
      getBalance: async (address) => '0',
      verifyData: async (matchId, expectedHash) => true,
      getTransactionReceipt: async (txHash) => ({
        status: true,
        blockNumber: Math.floor(Date.now() / 1000),
        gasUsed: '50000', // opBNB typically uses less gas
      }),
      healthCheck: async () => true,
    };
  }
}
