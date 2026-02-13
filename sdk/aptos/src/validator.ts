/**
 * Aptos Validator SDK
 * Implementation of IValidatorSDK for Aptos blockchain
 */

import {
  Aptos,
  AptosConfig,
  Network,
  Account,
  Ed25519PrivateKey,
  AccountAddress,
  InputViewFunctionData,
} from '@aptos-labs/ts-sdk';

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
} from '@spp/types';

export class AptosValidatorSDK implements IValidatorSDK {
  private aptos!: Aptos;
  private account?: Account;
  private moduleAddress!: string;
  private config!: ValidatorConfig;

  async initialize(config: ValidatorConfig): Promise<void> {
    this.config = config;

    // Determine network
    const network = config.network === 'mainnet'
      ? Network.MAINNET
      : config.network === 'testnet'
      ? Network.TESTNET
      : Network.DEVNET;

    const aptosConfig = new AptosConfig({
      network,
      fullnode: config.rpcUrl,
    });

    this.aptos = new Aptos(aptosConfig);
    this.moduleAddress = config.contractAddresses.oracle;

    // Initialize account if private key provided
    if (config.privateKey) {
      const privateKey = new Ed25519PrivateKey(config.privateKey);
      this.account = Account.fromPrivateKey({ privateKey });
    }
  }

  getChainInfo(): ChainInfo {
    return {
      name: 'Aptos',
      chainId: this.config.network === 'mainnet' ? 1 : 2,
      nativeCurrency: 'APT',
      blockExplorer: this.config.network === 'mainnet'
        ? 'https://explorer.aptoslabs.com'
        : 'https://explorer.aptoslabs.com/?network=devnet',
      rpcUrl: this.config.rpcUrl,
    };
  }

  async registerMatch(matchId: string, sport: number): Promise<TransactionResult> {
    if (!this.account) {
      throw new Error('Account not initialized. Provide privateKey in config.');
    }

    try {
      const transaction = await this.aptos.transaction.build.simple({
        sender: this.account.accountAddress,
        data: {
          function: `${this.moduleAddress}::performance_oracle::register_match`,
          functionArguments: [
            Array.from(new TextEncoder().encode(matchId)),
            sport,
          ],
        },
      });

      const pendingTx = await this.aptos.signAndSubmitTransaction({
        signer: this.account,
        transaction,
      });

      const result = await this.aptos.waitForTransaction({
        transactionHash: pendingTx.hash,
      });

      return {
        txHash: pendingTx.hash,
        status: result.success ? 'confirmed' : 'failed',
        blockNumber: Number(result.version),
        gasUsed: BigInt(result.gas_used),
      };
    } catch (error) {
      return {
        txHash: '',
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async finalizeMatch(
    matchId: string,
    winner: number,
    dataHash: string
  ): Promise<TransactionResult> {
    if (!this.account) {
      throw new Error('Account not initialized. Provide privateKey in config.');
    }

    try {
      const transaction = await this.aptos.transaction.build.simple({
        sender: this.account.accountAddress,
        data: {
          function: `${this.moduleAddress}::performance_oracle::finalize_match`,
          functionArguments: [
            Array.from(new TextEncoder().encode(matchId)),
            winner,
            Array.from(new TextEncoder().encode(dataHash)),
          ],
        },
      });

      const pendingTx = await this.aptos.signAndSubmitTransaction({
        signer: this.account,
        transaction,
      });

      const result = await this.aptos.waitForTransaction({
        transactionHash: pendingTx.hash,
      });

      return {
        txHash: pendingTx.hash,
        status: result.success ? 'confirmed' : 'failed',
        blockNumber: Number(result.version),
        gasUsed: BigInt(result.gas_used),
      };
    } catch (error) {
      return {
        txHash: '',
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async recordPerformance(params: PerformanceParams): Promise<TransactionResult> {
    if (!this.account) {
      throw new Error('Account not initialized. Provide privateKey in config.');
    }

    try {
      const transaction = await this.aptos.transaction.build.simple({
        sender: this.account.accountAddress,
        data: {
          function: `${this.moduleAddress}::performance_oracle::record_performance`,
          functionArguments: [
            Array.from(new TextEncoder().encode(params.matchId)),
            params.player,
            params.performanceScore,
            params.effortScore,
            params.rewardTier,
          ],
        },
      });

      const pendingTx = await this.aptos.signAndSubmitTransaction({
        signer: this.account,
        transaction,
      });

      const result = await this.aptos.waitForTransaction({
        transactionHash: pendingTx.hash,
      });

      return {
        txHash: pendingTx.hash,
        status: result.success ? 'confirmed' : 'failed',
        blockNumber: Number(result.version),
        gasUsed: BigInt(result.gas_used),
      };
    } catch (error) {
      return {
        txHash: '',
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async recordCricketPerformance(
    params: CricketPerformanceParams
  ): Promise<TransactionResult> {
    if (!this.account) {
      throw new Error('Account not initialized. Provide privateKey in config.');
    }

    try {
      const transaction = await this.aptos.transaction.build.simple({
        sender: this.account.accountAddress,
        data: {
          function: `${this.moduleAddress}::performance_oracle::record_cricket_performance`,
          functionArguments: [
            Array.from(new TextEncoder().encode(params.matchId)),
            params.player,
            params.runs,
            params.ballsFaced,
            params.wickets,
            params.oversBowled,
            params.runsConceded,
            params.maidenOvers,
          ],
        },
      });

      const pendingTx = await this.aptos.signAndSubmitTransaction({
        signer: this.account,
        transaction,
      });

      const result = await this.aptos.waitForTransaction({
        transactionHash: pendingTx.hash,
      });

      return {
        txHash: pendingTx.hash,
        status: result.success ? 'confirmed' : 'failed',
        blockNumber: Number(result.version),
        gasUsed: BigInt(result.gas_used),
      };
    } catch (error) {
      return {
        txHash: '',
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async executeBurn(matchId: string, player: string): Promise<BurnResult> {
    if (!this.account) {
      throw new Error('Account not initialized. Provide privateKey in config.');
    }

    try {
      // Get match performance data first to determine tier
      const matchData = await this.getMatch(matchId);
      if (!matchData) {
        throw new Error('Match not found');
      }

      const perfData = await this.getPerformance(matchId, player);
      if (!perfData) {
        throw new Error('Performance data not found');
      }

      const transaction = await this.aptos.transaction.build.simple({
        sender: this.account.accountAddress,
        data: {
          function: `${this.config.contractAddresses.burnEngine}::deflatinary_burn::burn_for_performance`,
          functionArguments: [
            Array.from(new TextEncoder().encode(matchId)),
            perfData.rewardTier,
            perfData.performanceScore,
            perfData.effortScore,
          ],
        },
      });

      const pendingTx = await this.aptos.signAndSubmitTransaction({
        signer: this.account,
        transaction,
      });

      const result = await this.aptos.waitForTransaction({
        transactionHash: pendingTx.hash,
      });

      // Extract burn and reward amounts from events
      // In production, parse transaction events to get actual amounts
      const burnAmount = BigInt(0); // Parse from events
      const rewardAmount = BigInt(0); // Parse from events

      return {
        txHash: pendingTx.hash,
        burnAmount,
        rewardAmount,
        tier: perfData.rewardTier,
        player,
        matchId,
        timestamp: Date.now(),
      };
    } catch (error) {
      throw new Error(`Burn execution failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getMatch(matchId: string): Promise<MatchData | null> {
    try {
      const payload: InputViewFunctionData = {
        function: `${this.moduleAddress}::performance_oracle::get_match`,
        functionArguments: [Array.from(new TextEncoder().encode(matchId))],
      };

      const result = await this.aptos.view({ payload });

      if (!result || result.length === 0) {
        return null;
      }

      const matchData = result[0] as any;

      return {
        matchId,
        sport: matchData.sport as SportType,
        status: matchData.status as MatchStatus,
        winner: matchData.winner,
        dataHash: new TextDecoder().decode(new Uint8Array(matchData.data_hash)),
        playerCount: matchData.player_count,
        registeredAt: matchData.registered_at,
        finalizedAt: matchData.finalized_at || undefined,
      };
    } catch (error) {
      console.error('Error getting match:', error);
      return null;
    }
  }

  async getPerformance(matchId: string, player: string): Promise<PerformanceData | null> {
    try {
      const payload: InputViewFunctionData = {
        function: `${this.moduleAddress}::performance_oracle::get_performance`,
        functionArguments: [
          Array.from(new TextEncoder().encode(matchId)),
          player,
        ],
      };

      const result = await this.aptos.view({ payload });

      if (!result || result.length === 0) {
        return null;
      }

      const perfData = result[0] as any;

      return {
        matchId,
        player,
        performanceScore: perfData.performance_score,
        effortScore: perfData.effort_score,
        rewardTier: perfData.reward_tier,
        timestamp: perfData.timestamp,
        verified: perfData.verified,
      };
    } catch (error) {
      console.error('Error getting performance:', error);
      return null;
    }
  }

  async getTokenBalance(address: string): Promise<bigint> {
    try {
      const payload: InputViewFunctionData = {
        function: `${this.config.contractAddresses.token}::spp_token::balance_of`,
        functionArguments: [address],
      };

      const result = await this.aptos.view({ payload });

      if (!result || result.length === 0) {
        return BigInt(0);
      }

      return BigInt(result[0] as string);
    } catch (error) {
      console.error('Error getting token balance:', error);
      return BigInt(0);
    }
  }

  subscribeToMatchEvents(callback: (event: MatchEvent) => void): Subscription {
    // Aptos event subscription - implementation would use WebSocket or polling
    console.warn('Event subscription not fully implemented for Aptos');

    return {
      unsubscribe: () => {
        console.log('Unsubscribed from match events');
      },
    };
  }

  subscribeToBurnEvents(callback: (event: BurnEvent) => void): Subscription {
    // Aptos event subscription - implementation would use WebSocket or polling
    console.warn('Event subscription not fully implemented for Aptos');

    return {
      unsubscribe: () => {
        console.log('Unsubscribed from burn events');
      },
    };
  }

  async verifyMatchData(matchId: string, expectedHash: string): Promise<boolean> {
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

  async verifyPerformance(
    matchId: string,
    player: string,
    expectedScore: number
  ): Promise<boolean> {
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
}
