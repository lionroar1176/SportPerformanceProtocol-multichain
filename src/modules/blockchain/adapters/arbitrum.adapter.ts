/**
 * Arbitrum Stylus Chain Adapter
 * Wraps the existing StylusBridgeService to implement IChainAdapter interface
 */

import { Injectable } from '@nestjs/common';
import { createPublicClient, http, Address } from 'viem';
import { arbitrumSepolia } from 'viem/chains';
import { BaseChainAdapter } from './base.adapter';
import { StylusBridgeService } from '../stylus-bridge.service';
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

@Injectable()
export class ArbitrumAdapter extends BaseChainAdapter {
  private publicClient: ReturnType<typeof createPublicClient>;
  private stylusBridge: StylusBridgeService;

  constructor() {
    super(ArbitrumAdapter.name);
  }

  /**
   * Set the Stylus bridge service (injected after construction)
   */
  setStylusBridge(bridge: StylusBridgeService): void {
    this.stylusBridge = bridge;
  }

  /**
   * Get chain information
   */
  getChainInfo(): ChainInfo {
    return {
      name: 'Arbitrum Sepolia',
      chainType: ChainType.ARBITRUM,
      nativeCurrency: 'ETH',
      blockExplorer: 'https://sepolia.arbiscan.io',
      isTestnet: true,
    };
  }

  /**
   * Initialize Arbitrum-specific clients
   */
  protected async initializeChain(): Promise<void> {
    try {
      // Create public client for reading blockchain data
      this.publicClient = createPublicClient({
        chain: arbitrumSepolia,
        transport: http(this.config.rpcUrl),
      });

      // Test connection
      const blockNumber = await this.publicClient.getBlockNumber();
      this.logger.log(`Connected to Arbitrum at block ${blockNumber}`);
    } catch (error) {
      this.handleError('Arbitrum initialization', error);
    }
  }

  /**
   * Register a new match on-chain
   */
  async registerMatch(params: MatchParams): Promise<TransactionResult> {
    this.ensureInitialized();

    try {
      this.logger.log(`Registering match ${params.matchId} for sport ${params.sport}`);

      // Use the existing Stylus bridge service
      const result = await this.stylusBridge.registerMatch(params.matchId);

      this.logTransaction('Match registration', result.hash);

      return {
        txHash: result.hash,
        status: result.status === 'success' ? 'confirmed' : 'failed',
        blockNumber: result.blockNumber ? Number(result.blockNumber) : undefined,
        gasUsed: result.gasUsed,
      };
    } catch (error) {
      this.handleError('Register match', error);
    }
  }

  /**
   * Finalize a match with winner and data hash
   */
  async finalizeMatch(params: FinalizeMatchParams): Promise<TransactionResult> {
    this.ensureInitialized();

    try {
      this.logger.log(`Finalizing match ${params.matchId} with winner ${params.winner}`);

      // Prepare finalization data for Stylus bridge
      const finalizationData = {
        matchId: params.matchId,
        dataHash: params.dataHash as `0x${string}`,
        playerCount: 2, // Will be updated based on actual player count
        performances: [], // Will be populated with actual performance data
      };

      const result = await this.stylusBridge.finalizeMatch(finalizationData);

      this.logTransaction('Match finalization', result.hash);

      return {
        txHash: result.hash,
        status: result.status === 'success' ? 'confirmed' : 'failed',
        blockNumber: result.blockNumber ? Number(result.blockNumber) : undefined,
        gasUsed: result.gasUsed,
      };
    } catch (error) {
      this.handleError('Finalize match', error);
    }
  }

  /**
   * Record general performance metrics
   */
  async recordPerformance(params: PerformanceParams): Promise<TransactionResult> {
    this.ensureInitialized();

    try {
      this.logger.log(
        `Recording performance for player ${params.player} in match ${params.matchId}`,
      );

      // The Stylus bridge records performance as part of finalization
      // For now, return a simulated result
      // In production, this would call a specific contract method

      const txHash = `0x${Date.now().toString(16).padStart(64, '0')}`;

      return this.createTransactionResult(txHash, 'confirmed');
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
      this.logger.log(
        `Recording cricket performance for player ${params.player} in match ${params.matchId}`,
      );

      // Calculate performance metrics from cricket stats
      const performanceScore =
        (params.runs * 2 + params.wickets * 10 - params.runsConceded / 10) / 10;
      const effortScore =
        (params.ballsFaced + params.oversBowled * 6 + params.maidenOvers * 20) / 10;

      // Determine reward tier based on performance
      let tier = RewardTier.ALL_ROUNDER;
      if (params.runs >= 50) tier = RewardTier.NIFTY_FIFTY;
      if (params.runs >= 100) tier = RewardTier.GAYLE_STORM;
      if (params.wickets >= 3) tier = RewardTier.HAT_TRICK;
      if (params.wickets >= 5) tier = RewardTier.FIVE_WICKET_HAUL;
      if (params.maidenOvers >= 3) tier = RewardTier.MAIDEN_MASTER;

      // Record using general performance method
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
   * Execute burn and mint rewards
   */
  async executeBurn(params: BurnParams): Promise<BurnResult> {
    this.ensureInitialized();

    try {
      this.logger.log(
        `Executing burn for player ${params.player} in match ${params.matchId}, tier: ${params.tier}`,
      );

      // Use the Stylus bridge burn function
      const result = await this.stylusBridge.burnForPerformance({
        matchId: params.matchId,
        playerAddress: params.player as Address,
        tier: params.tier,
        performanceScore: params.performanceScore,
        effortScore: params.effortScore,
      });

      this.logTransaction('Burn execution', result.txHash);

      return {
        txHash: result.txHash,
        burnAmount: result.burnAmount,
        rewardAmount: result.rewardAmount,
        tier: result.tier,
        player: result.player,
        matchId: params.matchId,
      };
    } catch (error) {
      this.handleError('Execute burn', error);
    }
  }

  /**
   * Get match data from chain
   */
  async getMatch(matchId: string): Promise<MatchData | null> {
    this.ensureInitialized();

    try {
      const proof = await this.stylusBridge.getMatchProof(matchId);

      if (!proof.isFinalized) {
        return null;
      }

      return {
        matchId,
        sport: 0, // Would need to be stored/retrieved separately
        status: proof.isFinalized ? 2 : 0, // 0: pending, 2: finalized
        dataHash: proof.dataHash,
        playerCount: 0, // Would need to be retrieved separately
        registeredAt: 0,
        finalizedAt: Number(proof.finalizedAt),
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
      // The Stylus contracts don't currently expose individual performance queries
      // This would need to be added to the contracts or retrieved from events
      this.logger.warn('getPerformance not yet implemented on Stylus contracts');
      return null;
    } catch (error) {
      this.logger.error(`Failed to get performance data: ${error.message}`);
      return null;
    }
  }

  /**
   * Get token balance for an address
   */
  async getTokenBalance(address: string): Promise<bigint> {
    this.ensureInitialized();

    try {
      if (!this.validateAddress(address)) {
        throw new Error('Invalid address format');
      }

      // Read token balance from ERC-20 contract
      const balance = await this.publicClient.readContract({
        address: this.config.contractAddresses.token as Address,
        abi: [
          {
            name: 'balanceOf',
            type: 'function',
            stateMutability: 'view',
            inputs: [{ name: 'account', type: 'address' }],
            outputs: [{ name: 'balance', type: 'uint256' }],
          },
        ],
        functionName: 'balanceOf',
        args: [address as Address],
      });

      return balance as bigint;
    } catch (error) {
      this.logger.error(`Failed to get token balance: ${error.message}`);
      return BigInt(0);
    }
  }

  /**
   * Verify match data hash matches expected
   */
  async verifyMatchData(matchId: string, expectedHash: string): Promise<boolean> {
    this.ensureInitialized();

    try {
      const proof = await this.stylusBridge.getMatchProof(matchId);
      return proof.dataHash.toLowerCase() === expectedHash.toLowerCase();
    } catch (error) {
      this.logger.error(`Failed to verify match data: ${error.message}`);
      return false;
    }
  }

  /**
   * Check if chain is healthy/responsive
   */
  async healthCheck(): Promise<boolean> {
    try {
      if (!this.initialized) {
        return false;
      }

      // Try to get the latest block number
      const blockNumber = await this.publicClient.getBlockNumber();

      // Check if we can read from the oracle contract
      const totalBurned = await this.stylusBridge.getTotalBurned();

      this.logger.debug(
        `Health check passed - Block: ${blockNumber}, Total burned: ${totalBurned}`,
      );
      return true;
    } catch (error) {
      this.logger.error(`Health check failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Check transaction status
   */
  protected async checkTransactionStatus(txHash: string): Promise<TransactionResult> {
    try {
      const receipt = await this.publicClient.getTransactionReceipt({
        hash: txHash as `0x${string}`,
      });

      return {
        txHash,
        status: receipt.status === 'success' ? 'confirmed' : 'failed',
        blockNumber: Number(receipt.blockNumber),
        gasUsed: receipt.gasUsed,
      };
    } catch (error) {
      // Transaction not yet mined
      return {
        txHash,
        status: 'pending',
      };
    }
  }

  /**
   * Format address for Arbitrum (EVM)
   */
  protected formatAddress(address: string): string {
    return address.toLowerCase();
  }

  /**
   * Validate Ethereum/Arbitrum address format
   */
  protected validateAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }
}
