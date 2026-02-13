/**
 * Blockchain Adapters Index
 * Exports all adapters and provides factory functions
 */

import { ChainType, IChainAdapter } from '../interfaces/chain-adapter.interface';
import { BaseChainAdapter } from './base.adapter';
import { ArbitrumAdapter } from './arbitrum.adapter';
import { BNBAdapter } from './bnb.adapter';
import { OpBNBAdapter } from './opbnb.adapter';
import { AptosAdapter } from './aptos.adapter';

// Export all adapters
export { BaseChainAdapter } from './base.adapter';
export { ArbitrumAdapter } from './arbitrum.adapter';
export { BNBAdapter } from './bnb.adapter';
export { OpBNBAdapter } from './opbnb.adapter';
export { AptosAdapter } from './aptos.adapter';

/**
 * Adapter factory function
 * Creates an instance of the appropriate adapter based on chain type
 */
export function createChainAdapter(chainType: ChainType): IChainAdapter {
  switch (chainType) {
    case ChainType.ARBITRUM:
      return new ArbitrumAdapter();

    case ChainType.BNB:
      return new BNBAdapter();

    case ChainType.OPBNB:
      return new OpBNBAdapter();

    case ChainType.APTOS:
      return new AptosAdapter();

    default:
      throw new Error(`Unsupported chain type: ${chainType}`);
  }
}

/**
 * Get all supported chain types
 */
export function getSupportedChains(): ChainType[] {
  return [ChainType.ARBITRUM, ChainType.BNB, ChainType.OPBNB, ChainType.APTOS];
}

/**
 * Check if a chain type is supported
 */
export function isChainSupported(chainType: ChainType): boolean {
  return getSupportedChains().includes(chainType);
}

/**
 * Get adapter class by chain type (for dependency injection)
 */
export function getAdapterClass(chainType: ChainType): new () => IChainAdapter {
  switch (chainType) {
    case ChainType.ARBITRUM:
      return ArbitrumAdapter;

    case ChainType.BNB:
      return BNBAdapter;

    case ChainType.OPBNB:
      return OpBNBAdapter;

    case ChainType.APTOS:
      return AptosAdapter;

    default:
      throw new Error(`Unsupported chain type: ${chainType}`);
  }
}

/**
 * Adapter metadata for introspection
 */
export interface AdapterMetadata {
  chainType: ChainType;
  name: string;
  adapterClass: new () => IChainAdapter;
  isEVM: boolean;
  features: string[];
}

/**
 * Get metadata for all adapters
 */
export function getAdapterMetadata(): AdapterMetadata[] {
  return [
    {
      chainType: ChainType.ARBITRUM,
      name: 'Arbitrum Stylus',
      adapterClass: ArbitrumAdapter,
      isEVM: true,
      features: ['stylus', 'rust-contracts', 'evm-compatible'],
    },
    {
      chainType: ChainType.BNB,
      name: 'BNB Smart Chain',
      adapterClass: BNBAdapter,
      isEVM: true,
      features: ['evm-compatible', 'high-throughput'],
    },
    {
      chainType: ChainType.OPBNB,
      name: 'opBNB',
      adapterClass: OpBNBAdapter,
      isEVM: true,
      features: ['evm-compatible', 'layer2', 'fast-finality', 'low-fees'],
    },
    {
      chainType: ChainType.APTOS,
      name: 'Aptos',
      adapterClass: AptosAdapter,
      isEVM: false,
      features: ['move-language', 'parallel-execution', 'fast-finality'],
    },
  ];
}
