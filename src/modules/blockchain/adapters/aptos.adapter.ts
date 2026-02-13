/**
 * Aptos Chain Adapter
 * Uses @spp/aptos-validator-sdk for Aptos blockchain integration
 * Aptos uses Move language and has different address format (64-char hex)
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

// Note: @spp/aptos-validator-sdk will need to be installed
interface AptosValidatorSDK {
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
  getTransaction(txHash: string): Promise<any>;
  healthCheck(): Promise<boolean>;
}

@Injectable()
export class AptosAdapter extends BaseChainAdapter {
  private sdk: AptosValidatorSDK;

  constructor() {
    super(AptosAdapter.name);
  }

  /**
   * Get chain information
   */
  getChainInfo(): ChainInfo {
    return {
      name: 'Aptos',
      chainType: ChainType.APTOS,
      nativeCurrency: 'APT',
      blockExplorer: 'https://explorer.aptoslabs.com',
      isTestnet: false,
    };
  }

  /**
   * Initialize Aptos SDK
   */
  protected async initializeChain(): Promise<void> {
    try {
      // In production, initialize the actual SDK
      // this.sdk = new AptosValidatorSDK();
      // await this.sdk.initialize({
      //   nodeUrl: this.config.rpcUrl,
      //   chainId: this.config.chainId || 1, // Mainnet
      //   privateKey: this.config.privateKey,
      //   moduleAddresses: this.config.contractAddresses,
      // });

      this.logger.log('Aptos Chain adapter initialized (SDK pending implementation)');

      // For now, create a mock SDK
      this.sdk = this.createMockSDK();
    } catch (error) {
      this.handleError('Aptos Chain initialization', error);
    }
  }

  /**
   * Register a new match on Aptos
   */
  async registerMatch(params: MatchParams): Promise<TransactionResult> {
    this.ensureInitialized();

    try {
      this.logger.log(`Registering match ${params.matchId} on Aptos`);

      const txHash = await this.sdk.registerMatch(params.matchId, params.sport);

      this.logTransaction('Match registration', txHash);

      // Aptos has fast finality (~1-2 seconds)
      return this.waitForConfirmation(txHash, 5000);
    } catch (error) {
      this.handleError('Register match', error);
    }
  }

  /**
   * Finalize a match on Aptos
   */
  async finalizeMatch(params: FinalizeMatchParams): Promise<TransactionResult> {
    this.ensureInitialized();

    try {
      this.logger.log(`Finalizing match ${params.matchId} on Aptos`);

      const txHash = await this.sdk.finalizeMatch(
        params.matchId,
        params.winner,
        params.dataHash,
      );

      this.logTransaction('Match finalization', txHash);

      return this.waitForConfirmation(txHash, 5000);
    } catch (error) {
      this.handleError('Finalize match', error);
    }
  }

  /**
   * Record general performance on Aptos
   */
  async recordPerformance(params: PerformanceParams): Promise<TransactionResult> {
    this.ensureInitialized();

    try {
      this.logger.log(`Recording performance for ${params.player} on Aptos`);

      // Normalize Aptos address format
      const aptosPlayer = this.formatAddress(params.player);

      if (!this.validateAddress(aptosPlayer)) {
        throw new Error('Invalid Aptos address format');
      }

      const txHash = await this.sdk.recordPerformance(
        params.matchId,
        aptosPlayer,
        params.performanceScore,
        params.effortScore,
        params.rewardTier,
      );

      this.logTransaction('Performance recording', txHash);

      return this.waitForConfirmation(txHash, 5000);
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
      this.logger.log(`Recording cricket performance for ${params.player} on Aptos`);

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
   * Execute burn transaction on Aptos
   */
  async executeBurn(params: BurnParams): Promise<BurnResult> {
    this.ensureInitialized();

    try {
      this.logger.log(`Executing burn for ${params.player} on Aptos`);

      // Normalize Aptos address format
      const aptosPlayer = this.formatAddress(params.player);

      if (!this.validateAddress(aptosPlayer)) {
        throw new Error('Invalid Aptos address format');
      }

      const result = await this.sdk.executeBurn(
        params.matchId,
        aptosPlayer,
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
        player: aptosPlayer,
        matchId: params.matchId,
      };
    } catch (error) {
      this.handleError('Execute burn', error);
    }
  }

  /**
   * Get match data from Aptos
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
      const aptosPlayer = this.formatAddress(player);
      const data = await this.sdk.getPerformance(matchId, aptosPlayer);

      if (!data) {
        return null;
      }

      return {
        matchId,
        player: aptosPlayer,
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
   * Get token balance on Aptos
   */
  async getTokenBalance(address: string): Promise<bigint> {
    this.ensureInitialized();

    try {
      const aptosAddress = this.formatAddress(address);

      if (!this.validateAddress(aptosAddress)) {
        throw new Error('Invalid Aptos address format');
      }

      const balance = await this.sdk.getBalance(aptosAddress);
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
   * Health check for Aptos
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
   * Check transaction status on Aptos
   */
  protected async checkTransactionStatus(txHash: string): Promise<TransactionResult> {
    try {
      const tx = await this.sdk.getTransaction(txHash);

      if (!tx) {
        return this.createTransactionResult(txHash, 'pending');
      }

      // Aptos transaction structure is different from EVM
      const status = tx.success ? 'confirmed' : 'failed';
      const gasUsed = tx.gas_used ? BigInt(tx.gas_used) : undefined;

      return this.createTransactionResult(
        txHash,
        status,
        tx.version, // Aptos uses version as block identifier
        gasUsed,
      );
    } catch (error) {
      return this.createTransactionResult(txHash, 'pending');
    }
  }

  /**
   * Format address for Aptos
   * Aptos addresses are 64-char hex strings (with or without 0x prefix)
   */
  protected formatAddress(address: string): string {
    // Remove 0x prefix if present
    let cleanAddress = address.toLowerCase().replace(/^0x/, '');

    // Pad to 64 characters if shorter
    cleanAddress = cleanAddress.padStart(64, '0');

    // Add 0x prefix
    return '0x' + cleanAddress;
  }

  /**
   * Validate Aptos address format
   * Aptos addresses are 64-char hex strings (0x + 64 hex chars)
   */
  protected validateAddress(address: string): boolean {
    // Accept addresses with or without 0x prefix
    const cleanAddress = address.replace(/^0x/, '');

    // Must be valid hex and 64 characters or less
    return /^[a-fA-F0-9]{1,64}$/.test(cleanAddress);
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
  private createMockSDK(): AptosValidatorSDK {
    return {
      initialize: async () => {},
      registerMatch: async (matchId, sport) =>
        `0x${Date.now().toString(16).padStart(64, '0')}`,
      finalizeMatch: async (matchId, winner, dataHash) =>
        `0x${Date.now().toString(16).padStart(64, '0')}`,
      recordPerformance: async (matchId, player, perfScore, effortScore, tier) =>
        `0x${Date.now().toString(16).padStart(64, '0')}`,
      executeBurn: async (matchId, player, tier, perfScore, effortScore) => ({
        txHash: `0x${Date.now().toString(16).padStart(64, '0')}`,
        burnAmount: '1000000', // Aptos uses different denominations
        rewardAmount: '5000000',
      }),
      getMatch: async (matchId) => null,
      getPerformance: async (matchId, player) => null,
      getBalance: async (address) => '0',
      verifyData: async (matchId, expectedHash) => true,
      getTransaction: async (txHash) => ({
        success: true,
        version: Math.floor(Date.now() / 1000),
        gas_used: '200',
      }),
      healthCheck: async () => true,
    };
  }
}
