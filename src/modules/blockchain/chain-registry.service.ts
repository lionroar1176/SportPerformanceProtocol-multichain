/**
 * Chain Registry Service
 * Manages multiple blockchain adapters with health monitoring and failover support
 */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  ChainType,
  ChainConfig,
  IChainAdapter,
  ChainInfo,
} from './interfaces/chain-adapter.interface';
import { createChainAdapter, getSupportedChains } from './adapters';

/**
 * Chain status for monitoring
 */
export interface ChainStatus {
  chainType: ChainType;
  isHealthy: boolean;
  lastHealthCheck: Date;
  failureCount: number;
  lastError?: string;
}

/**
 * Registry configuration
 */
export interface RegistryConfig {
  healthCheckInterval?: number; // milliseconds
  maxFailures?: number; // failures before marking as unhealthy
  enableFailover?: boolean;
  primaryChain?: ChainType;
}

/**
 * Chain registration entry
 */
interface ChainEntry {
  adapter: IChainAdapter;
  config: ChainConfig;
  status: ChainStatus;
}

@Injectable()
export class ChainRegistryService implements OnModuleInit {
  private readonly logger = new Logger(ChainRegistryService.name);
  private readonly chains = new Map<ChainType, ChainEntry>();
  private healthCheckInterval: NodeJS.Timeout | null = null;

  // Configuration
  private config: RegistryConfig = {
    healthCheckInterval: 60000, // 1 minute
    maxFailures: 3,
    enableFailover: true,
    primaryChain: ChainType.ARBITRUM,
  };

  constructor(private readonly eventEmitter: EventEmitter2) {}

  /**
   * Initialize registry and start health monitoring
   */
  async onModuleInit(): Promise<void> {
    this.logger.log('Initializing Chain Registry Service');

    // Start health monitoring
    if (this.config.healthCheckInterval && this.config.healthCheckInterval > 0) {
      this.startHealthMonitoring();
    }
  }

  /**
   * Configure the registry
   */
  configure(config: Partial<RegistryConfig>): void {
    this.config = { ...this.config, ...config };
    this.logger.log(`Registry configured: ${JSON.stringify(this.config)}`);

    // Restart health monitoring if interval changed
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.startHealthMonitoring();
    }
  }

  /**
   * Register a new chain adapter
   */
  async registerChain(chainType: ChainType, config: ChainConfig): Promise<void> {
    try {
      this.logger.log(`Registering chain: ${chainType}`);

      // Create adapter instance
      const adapter = createChainAdapter(chainType);

      // Initialize adapter
      await adapter.initialize(config);

      // Create chain entry
      const entry: ChainEntry = {
        adapter,
        config,
        status: {
          chainType,
          isHealthy: true,
          lastHealthCheck: new Date(),
          failureCount: 0,
        },
      };

      this.chains.set(chainType, entry);

      this.logger.log(`Chain registered successfully: ${chainType}`);
      this.eventEmitter.emit('chain.registered', { chainType, info: adapter.getChainInfo() });
    } catch (error) {
      this.logger.error(`Failed to register chain ${chainType}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Unregister a chain
   */
  unregisterChain(chainType: ChainType): void {
    if (!this.chains.has(chainType)) {
      this.logger.warn(`Chain ${chainType} not registered`);
      return;
    }

    this.chains.delete(chainType);
    this.logger.log(`Chain unregistered: ${chainType}`);
    this.eventEmitter.emit('chain.unregistered', { chainType });
  }

  /**
   * Get adapter by chain type
   */
  getAdapter(chainType: ChainType): IChainAdapter {
    const entry = this.chains.get(chainType);

    if (!entry) {
      throw new Error(`Chain ${chainType} not registered`);
    }

    if (!entry.status.isHealthy && this.config.enableFailover) {
      this.logger.warn(`Chain ${chainType} is unhealthy, attempting failover`);
      return this.getHealthyAdapter();
    }

    return entry.adapter;
  }

  /**
   * Get a healthy adapter (for failover)
   */
  private getHealthyAdapter(): IChainAdapter {
    // Try primary chain first
    if (this.config.primaryChain) {
      const primary = this.chains.get(this.config.primaryChain);
      if (primary && primary.status.isHealthy) {
        return primary.adapter;
      }
    }

    // Find any healthy chain
    for (const entry of this.chains.values()) {
      if (entry.status.isHealthy) {
        this.logger.log(`Failing over to ${entry.status.chainType}`);
        return entry.adapter;
      }
    }

    throw new Error('No healthy chains available');
  }

  /**
   * Get all registered chains
   */
  getRegisteredChains(): ChainType[] {
    return Array.from(this.chains.keys());
  }

  /**
   * Get all active (healthy) chains
   */
  getActiveChains(): ChainType[] {
    return Array.from(this.chains.values())
      .filter(entry => entry.status.isHealthy)
      .map(entry => entry.status.chainType);
  }

  /**
   * Get chain information
   */
  getChainInfo(chainType: ChainType): ChainInfo {
    const entry = this.chains.get(chainType);

    if (!entry) {
      throw new Error(`Chain ${chainType} not registered`);
    }

    return entry.adapter.getChainInfo();
  }

  /**
   * Get all chain information
   */
  getAllChainInfo(): ChainInfo[] {
    return Array.from(this.chains.values()).map(entry => entry.adapter.getChainInfo());
  }

  /**
   * Get chain status
   */
  getChainStatus(chainType: ChainType): ChainStatus {
    const entry = this.chains.get(chainType);

    if (!entry) {
      throw new Error(`Chain ${chainType} not registered`);
    }

    return { ...entry.status };
  }

  /**
   * Get all chain statuses
   */
  getAllChainStatuses(): ChainStatus[] {
    return Array.from(this.chains.values()).map(entry => ({ ...entry.status }));
  }

  /**
   * Check if a chain is registered
   */
  isChainRegistered(chainType: ChainType): boolean {
    return this.chains.has(chainType);
  }

  /**
   * Check if a chain is healthy
   */
  isChainHealthy(chainType: ChainType): boolean {
    const entry = this.chains.get(chainType);
    return entry ? entry.status.isHealthy : false;
  }

  /**
   * Manually trigger health check for a specific chain
   */
  async checkChainHealth(chainType: ChainType): Promise<boolean> {
    const entry = this.chains.get(chainType);

    if (!entry) {
      throw new Error(`Chain ${chainType} not registered`);
    }

    try {
      const isHealthy = await entry.adapter.healthCheck();

      entry.status.lastHealthCheck = new Date();

      if (isHealthy) {
        // Reset failure count on success
        if (entry.status.failureCount > 0) {
          this.logger.log(`Chain ${chainType} recovered`);
          this.eventEmitter.emit('chain.recovered', { chainType });
        }
        entry.status.failureCount = 0;
        entry.status.isHealthy = true;
        entry.status.lastError = undefined;
      } else {
        // Increment failure count
        entry.status.failureCount++;
        this.logger.warn(`Chain ${chainType} health check failed (${entry.status.failureCount})`);

        // Mark as unhealthy if max failures reached
        if (entry.status.failureCount >= (this.config.maxFailures || 3)) {
          if (entry.status.isHealthy) {
            this.logger.error(`Chain ${chainType} marked as unhealthy`);
            this.eventEmitter.emit('chain.unhealthy', { chainType });
          }
          entry.status.isHealthy = false;
        }
      }

      return isHealthy;
    } catch (error) {
      this.logger.error(`Health check error for ${chainType}: ${error.message}`);
      entry.status.failureCount++;
      entry.status.lastError = error.message;
      entry.status.lastHealthCheck = new Date();

      if (entry.status.failureCount >= (this.config.maxFailures || 3)) {
        if (entry.status.isHealthy) {
          this.eventEmitter.emit('chain.unhealthy', { chainType });
        }
        entry.status.isHealthy = false;
      }

      return false;
    }
  }

  /**
   * Check health of all registered chains
   */
  async checkAllChainsHealth(): Promise<Map<ChainType, boolean>> {
    const results = new Map<ChainType, boolean>();

    for (const chainType of this.chains.keys()) {
      const isHealthy = await this.checkChainHealth(chainType);
      results.set(chainType, isHealthy);
    }

    return results;
  }

  /**
   * Start automatic health monitoring
   */
  private startHealthMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    const interval = this.config.healthCheckInterval || 60000;

    this.logger.log(`Starting health monitoring (interval: ${interval}ms)`);

    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.checkAllChainsHealth();
      } catch (error) {
        this.logger.error(`Health monitoring error: ${error.message}`);
      }
    }, interval);
  }

  /**
   * Stop health monitoring
   */
  stopHealthMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
      this.logger.log('Health monitoring stopped');
    }
  }

  /**
   * Get registry statistics
   */
  getStatistics(): {
    totalChains: number;
    healthyChains: number;
    unhealthyChains: number;
    primaryChain: ChainType | undefined;
    supportedChains: ChainType[];
  } {
    const statuses = Array.from(this.chains.values()).map(e => e.status);

    return {
      totalChains: this.chains.size,
      healthyChains: statuses.filter(s => s.isHealthy).length,
      unhealthyChains: statuses.filter(s => !s.isHealthy).length,
      primaryChain: this.config.primaryChain,
      supportedChains: getSupportedChains(),
    };
  }

  /**
   * Cleanup on module destroy
   */
  onModuleDestroy(): void {
    this.stopHealthMonitoring();
  }
}
