# Sport Performance Protocol - Aptos Smart Contracts

Move modules for Sport Performance Protocol on Aptos blockchain.

## Overview

This directory contains the Move smart contracts for SPP on Aptos:

- **spp_token.move** - Fungible Asset token with burn mechanism
- **performance_oracle.move** - Match and performance data recording
- **deflatinary_burn.move** - Token burn engine and reward distribution
- **reward_tiers.move** - Reward tier configuration and management

## Prerequisites

- [Aptos CLI](https://aptos.dev/cli-tools/aptos-cli-tool/install-aptos-cli/)
- Aptos account with APT tokens for deployment

## Compile

```bash
aptos move compile
```

## Test

```bash
aptos move test
```

## Deploy to Devnet

1. Create or import an account:
```bash
aptos init --network devnet
```

2. Fund your account:
```bash
aptos account fund-with-faucet --account default
```

3. Publish the modules:
```bash
aptos move publish --named-addresses spp_protocol=default
```

## Deploy to Mainnet

```bash
aptos move publish --named-addresses spp_protocol=<your-address> --network mainnet
```

## Contract Architecture

### spp_token Module

Implements a Fungible Asset with:
- Standard FA operations (transfer, mint, burn)
- Deflationary mechanics through burn
- Token statistics tracking

### performance_oracle Module

Records verifiable performance data:
- Match registration and finalization
- Performance recording (generic and cricket-specific)
- On-chain data verification

### deflatinary_burn Module

Manages tokenomics:
- Burn execution based on performance
- Reward calculation using tier multipliers
- Player statistics tracking

### reward_tiers Module

Configurable reward system:
- 8 performance tiers with different multipliers
- Base reward amounts
- Minimum score requirements

## Usage Example

```typescript
import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';

const config = new AptosConfig({ network: Network.DEVNET });
const aptos = new Aptos(config);

// Register a match
await aptos.transaction.build.simple({
  sender: account.accountAddress,
  data: {
    function: `${moduleAddress}::performance_oracle::register_match`,
    functionArguments: [
      Array.from(new TextEncoder().encode('MATCH_001')),
      0, // Cricket
    ],
  },
});

// Record performance
await aptos.transaction.build.simple({
  sender: account.accountAddress,
  data: {
    function: `${moduleAddress}::performance_oracle::record_cricket_performance`,
    functionArguments: [
      Array.from(new TextEncoder().encode('MATCH_001')),
      playerAddress,
      75, // runs
      50, // balls faced
      2,  // wickets
      4,  // overs bowled
      28, // runs conceded
      1,  // maiden overs
    ],
  },
});

// Execute burn and get rewards
await aptos.transaction.build.simple({
  sender: account.accountAddress,
  data: {
    function: `${moduleAddress}::deflatinary_burn::burn_for_performance`,
    functionArguments: [
      Array.from(new TextEncoder().encode('MATCH_001')),
      0, // tier (NIFTY_FIFTY)
      80, // performance score
      75, // effort score
    ],
  },
});
```

## Reward Tiers

| Tier | Name | Multiplier | Base Reward | Min Score |
|------|------|------------|-------------|-----------|
| 0 | Nifty Fifty | 1.5x | 50 SPP | 50 |
| 1 | Gayle Storm | 3.0x | 150 SPP | 70 |
| 2 | Five Wicket Haul | 2.5x | 100 SPP | 60 |
| 3 | Hat Trick | 3.0x | 200 SPP | 80 |
| 4 | Maiden Master | 1.5x | 30 SPP | 40 |
| 5 | Run Machine | 4.0x | 250 SPP | 90 |
| 6 | Golden Arm | 1.3x | 40 SPP | 45 |
| 7 | All Rounder | 2.0x | 120 SPP | 65 |

## Security Considerations

- Admin functions are protected by access control
- Match data is immutable once finalized
- Burn operations validate token balance
- All state changes emit events for transparency

## License

MIT
