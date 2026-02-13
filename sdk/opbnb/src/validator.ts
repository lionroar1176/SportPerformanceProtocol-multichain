/**
 * opBNB Layer 2 Validator SDK
 * Extension of BNB validator for opBNB L2 network
 */

import { BNBValidatorSDK } from '@spp/bnb-validator-sdk';
import { ChainInfo } from '@spp/types';

/**
 * opBNB Validator SDK
 * Extends BNBValidatorSDK with opBNB-specific chain configuration
 *
 * opBNB is a Layer 2 scaling solution built on the BNB Chain using
 * Optimistic Rollup technology, providing:
 * - Lower gas fees (typically 10-100x cheaper than BNB Chain)
 * - Higher throughput (up to 10,000 TPS)
 * - EVM compatibility (same contracts and tools as BNB Chain)
 * - Fast finality (1-2 seconds for soft finality)
 */
export class OpBNBValidatorSDK extends BNBValidatorSDK {
  /**
   * Get chain information for opBNB
   * Overrides parent to provide opBNB-specific chain details
   */
  getChainInfo(): ChainInfo {
    const isMainnet = this.config.network === 'mainnet';

    return {
      name: 'opBNB',
      chainId: isMainnet ? 204 : 5611, // Mainnet: 204, Testnet: 5611
      nativeCurrency: 'BNB',
      blockExplorer: isMainnet
        ? 'https://opbnbscan.com'
        : 'https://testnet.opbnbscan.com',
      rpcUrl: this.config.rpcUrl,
    };
  }
}

/**
 * Type alias for backward compatibility
 */
export type OpBNBValidator = OpBNBValidatorSDK;
