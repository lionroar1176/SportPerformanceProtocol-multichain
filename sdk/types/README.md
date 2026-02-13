# @spp/types

Shared TypeScript types and interfaces for Sport Performance Protocol multi-chain validator SDKs.

## Overview

This package provides the unified interface (`IValidatorSDK`) that all chain-specific validator SDKs must implement, ensuring consistent behavior across different blockchains.

## Installation

```bash
npm install @spp/types
```

## Usage

```typescript
import {
  IValidatorSDK,
  ValidatorConfig,
  RewardTier,
  TransactionResult
} from '@spp/types';

// Implement the interface for a specific chain
class MyChainValidatorSDK implements IValidatorSDK {
  async initialize(config: ValidatorConfig): Promise<void> {
    // Implementation
  }

  // ... implement other required methods
}
```

## Types Included

### Core Interfaces
- `IValidatorSDK` - Main validator interface
- `ValidatorConfig` - Configuration for validator initialization
- `ChainInfo` - Blockchain information
- `TransactionResult` - Transaction execution result

### Match Types
- `MatchData` - Match information
- `MatchEvent` - Match-related events
- `SportType` - Supported sports enum
- `MatchStatus` - Match status enum

### Performance Types
- `PerformanceParams` - Generic performance recording
- `CricketPerformanceParams` - Cricket-specific performance
- `PerformanceData` - Performance query result
- `RewardTier` - Reward tier enum

### Burn & Reward Types
- `BurnResult` - Token burn execution result
- `BurnEvent` - Burn-related events
- `TierConfig` - Reward tier configuration
- `BurnStats` - Burn statistics

## Supported Chains

These types are used by the following chain-specific SDKs:
- `@spp/arbitrum-validator-sdk`
- `@spp/solana-validator-sdk`
- `@spp/bnb-validator-sdk`
- `@spp/opbnb-validator-sdk`
- `@spp/aptos-validator-sdk`

## License

MIT
