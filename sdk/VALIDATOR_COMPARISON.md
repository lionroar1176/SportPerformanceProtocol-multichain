# Sport Performance Protocol - Validator SDK Comparison

This document compares the three validator SDKs available for the Sport Performance Protocol across different blockchain networks.

## Overview

| SDK | Chain | Technology | Chain ID | Gas Costs | TPS | Finality |
|-----|-------|------------|----------|-----------|-----|----------|
| **Aptos** | Aptos | Move | 1 (mainnet) | Very Low | 160,000+ | <1s |
| **BNB** | BNB Smart Chain | EVM/Solidity | 56 (mainnet) | Medium | ~300 | ~3s |
| **opBNB** | opBNB L2 | EVM/Solidity | 204 (mainnet) | Very Low | 10,000+ | ~2s |

## SDK Packages

```bash
# Aptos Validator SDK
npm install @spp/aptos-validator-sdk @aptos-labs/ts-sdk

# BNB Validator SDK
npm install @spp/bnb-validator-sdk ethers@^6.13.0

# opBNB Validator SDK
npm install @spp/opbnb-validator-sdk ethers@^6.13.0
```

## Quick Start Comparison

### Aptos

```typescript
import { AptosValidatorSDK } from '@spp/aptos-validator-sdk';

const validator = new AptosValidatorSDK();
await validator.initialize({
  rpcUrl: 'https://fullnode.mainnet.aptoslabs.com',
  privateKey: process.env.PRIVATE_KEY,
  contractAddresses: {
    token: '0x...::spp_token',
    oracle: '0x...::performance_oracle',
    burnEngine: '0x...::deflationary_burn',
    rewardTiers: '0x...::reward_tiers',
  },
  network: 'mainnet',
});
```

### BNB

```typescript
import { BNBValidatorSDK } from '@spp/bnb-validator-sdk';

const validator = new BNBValidatorSDK();
await validator.initialize({
  rpcUrl: 'https://bsc-dataseed1.binance.org',
  privateKey: process.env.PRIVATE_KEY,
  contractAddresses: {
    token: '0x...',
    oracle: '0x...',
    burnEngine: '0x...',
    rewardTiers: '0x...',
  },
  network: 'mainnet',
  gasConfig: {
    maxGasPrice: parseUnits('5', 'gwei'),
  },
});
```

### opBNB

```typescript
import { OpBNBValidatorSDK } from '@spp/opbnb-validator-sdk';

const validator = new OpBNBValidatorSDK();
await validator.initialize({
  rpcUrl: 'https://opbnb-mainnet-rpc.bnbchain.org',
  privateKey: process.env.PRIVATE_KEY,
  contractAddresses: {
    token: '0x...',
    oracle: '0x...',
    burnEngine: '0x...',
    rewardTiers: '0x...',
  },
  network: 'mainnet',
  gasConfig: {
    maxGasPrice: parseUnits('0.001', 'gwei'),
  },
});
```

## API Compatibility

All three SDKs implement the same `IValidatorSDK` interface, providing identical methods:

| Method | Aptos | BNB | opBNB | Description |
|--------|-------|-----|-------|-------------|
| `initialize()` | ✅ | ✅ | ✅ | Initialize validator |
| `getChainInfo()` | ✅ | ✅ | ✅ | Get chain information |
| `registerMatch()` | ✅ | ✅ | ✅ | Register new match |
| `finalizeMatch()` | ✅ | ✅ | ✅ | Finalize match |
| `recordPerformance()` | ✅ | ✅ | ✅ | Record performance |
| `recordCricketPerformance()` | ✅ | ✅ | ✅ | Record cricket stats |
| `executeBurn()` | ✅ | ✅ | ✅ | Execute deflationary burn |
| `getMatch()` | ✅ | ✅ | ✅ | Query match data |
| `getPerformance()` | ✅ | ✅ | ✅ | Query performance data |
| `getTokenBalance()` | ✅ | ✅ | ✅ | Check token balance |
| `subscribeToMatchEvents()` | ✅ | ✅ | ✅ | Subscribe to match events |
| `subscribeToBurnEvents()` | ✅ | ✅ | ✅ | Subscribe to burn events |
| `verifyMatchData()` | ✅ | ✅ | ✅ | Verify match data hash |
| `verifyPerformance()` | ✅ | ✅ | ✅ | Verify performance score |

## Cost Comparison

### Per-Transaction Costs (USD)

| Operation | Aptos | BNB L1 | opBNB L2 |
|-----------|-------|--------|----------|
| Register Match | ~$0.001 | ~$0.50 | ~$0.005 |
| Record Performance | ~$0.001 | ~$0.30 | ~$0.003 |
| Record Cricket Performance | ~$0.002 | ~$0.40 | ~$0.004 |
| Execute Burn | ~$0.002 | ~$0.80 | ~$0.008 |
| Query (read) | Free | Free | Free |

### Monthly Cost Estimate (1000 operations)

| SDK | Register | Performance | Burns | Total/Month |
|-----|----------|-------------|-------|-------------|
| **Aptos** | $1 | $1 | $2 | **~$4** |
| **BNB** | $500 | $300 | $800 | **~$1,600** |
| **opBNB** | $5 | $3 | $8 | **~$16** |

## Performance Characteristics

### Transaction Throughput

| SDK | TPS (Theoretical) | Block Time | Confirmation Time |
|-----|-------------------|------------|-------------------|
| Aptos | 160,000+ | ~0.5s | <1s (soft) |
| BNB | ~300 | ~3s | ~15s (12 blocks) |
| opBNB | 10,000+ | ~1s | ~2s (soft), ~7 days (L1) |

### Scalability

| Feature | Aptos | BNB | opBNB |
|---------|-------|-----|-------|
| Parallel Execution | ✅ Yes | ❌ No | ❌ No |
| State Sharding | 🚧 Planned | ❌ No | ❌ No |
| L2 Scaling | ❌ N/A | ❌ No | ✅ Yes |
| Batch Processing | ✅ Efficient | ⚠️ Expensive | ✅ Efficient |

## Technology Stack

### Aptos
- **Language:** Move
- **VM:** MoveVM
- **Consensus:** AptosBFT (DiemBFT variant)
- **SDK:** @aptos-labs/ts-sdk
- **Features:** Parallel execution, resource-oriented programming

### BNB
- **Language:** Solidity
- **VM:** EVM
- **Consensus:** Parlia (PoSA)
- **SDK:** ethers.js v6
- **Features:** EVM compatibility, large validator set

### opBNB
- **Language:** Solidity
- **VM:** EVM (Optimistic Rollup)
- **Consensus:** Sequencer + L1 finality
- **SDK:** ethers.js v6 (extends BNB SDK)
- **Features:** EVM compatible L2, fraud proofs, low gas

## Network Information

### Mainnet

| Network | Chain ID | RPC Endpoint | Block Explorer |
|---------|----------|--------------|----------------|
| Aptos | 1 | https://fullnode.mainnet.aptoslabs.com | https://explorer.aptoslabs.com |
| BNB | 56 | https://bsc-dataseed1.binance.org | https://bscscan.com |
| opBNB | 204 | https://opbnb-mainnet-rpc.bnbchain.org | https://opbnbscan.com |

### Testnet

| Network | Chain ID | RPC Endpoint | Block Explorer |
|---------|----------|--------------|----------------|
| Aptos | 2 | https://fullnode.testnet.aptoslabs.com | https://explorer.aptoslabs.com/?network=testnet |
| BNB | 97 | https://data-seed-prebsc-1-s1.binance.org:8545 | https://testnet.bscscan.com |
| opBNB | 5611 | https://opbnb-testnet-rpc.bnbchain.org | https://testnet.opbnbscan.com |

## Use Case Recommendations

### Choose Aptos When:
- ✅ Need highest throughput (160k+ TPS)
- ✅ Want lowest transaction costs
- ✅ Require sub-second finality
- ✅ Can leverage parallel execution
- ✅ Processing large-scale global events
- ✅ Want resource-oriented security model

### Choose BNB When:
- ✅ Need maximum EVM compatibility
- ✅ Want largest ecosystem integration
- ✅ Require immediate L1 security
- ✅ Bridge to other EVM chains frequently
- ✅ Moderate transaction volume
- ✅ Prefer battle-tested EVM stack

### Choose opBNB When:
- ✅ Need EVM compatibility with low costs
- ✅ Want 100x gas savings vs BNB L1
- ✅ Can tolerate ~7 day L1 finality
- ✅ High transaction volume
- ✅ Need fast soft finality (1-2s)
- ✅ Want to scale existing BNB contracts

## Migration Path

### From BNB to opBNB

```typescript
// Minimal changes required
- import { BNBValidatorSDK } from '@spp/bnb-validator-sdk';
+ import { OpBNBValidatorSDK } from '@spp/opbnb-validator-sdk';

- const validator = new BNBValidatorSDK();
+ const validator = new OpBNBValidatorSDK();

// Update RPC and gas config
- rpcUrl: 'https://bsc-dataseed1.binance.org'
+ rpcUrl: 'https://opbnb-mainnet-rpc.bnbchain.org'

- maxGasPrice: parseUnits('5', 'gwei')
+ maxGasPrice: parseUnits('0.001', 'gwei')
```

### Multi-Chain Deployment

```typescript
// Initialize all three validators
const validators = {
  aptos: new AptosValidatorSDK(),
  bnb: new BNBValidatorSDK(),
  opbnb: new OpBNBValidatorSDK(),
};

// Initialize with respective configs
await Promise.all([
  validators.aptos.initialize(aptosConfig),
  validators.bnb.initialize(bnbConfig),
  validators.opbnb.initialize(opbnbConfig),
]);

// Process match on all chains
const matchId = 'global_match_001';
await Promise.all([
  validators.aptos.registerMatch(matchId, SportType.CRICKET),
  validators.bnb.registerMatch(matchId, SportType.CRICKET),
  validators.opbnb.registerMatch(matchId, SportType.CRICKET),
]);
```

## Error Handling

### Error Code Namespaces

| SDK | Error Prefix | Example |
|-----|--------------|---------|
| Aptos | `APTOS_` | `APTOS_TX_FAILED` |
| BNB | `BNB_` | `BNB_INSUFFICIENT_BALANCE` |
| opBNB | `BNB_` | `BNB_GAS_ESTIMATION_FAILED` |

Note: opBNB uses BNB error codes as it extends the BNB validator.

## Security Considerations

### Private Key Management

All SDKs support the same security practices:

```typescript
// Use environment variables
privateKey: process.env.VALIDATOR_PRIVATE_KEY

// Never commit to version control
// Use .env with .gitignore
```

### Gas Price Protection

```typescript
// Aptos (gas units)
gasConfig: { maxGasPrice: 100n }

// BNB/opBNB (wei)
gasConfig: { maxGasPrice: parseUnits('5', 'gwei') }
```

## Developer Experience

### TypeScript Support

| Feature | Aptos | BNB | opBNB |
|---------|-------|-----|-------|
| Full Type Definitions | ✅ | ✅ | ✅ |
| Interface Compliance | ✅ | ✅ | ✅ |
| Auto-completion | ✅ | ✅ | ✅ |
| Type Guards | ✅ | ✅ | ✅ |

### Documentation

| SDK | README | API Docs | Examples |
|-----|--------|----------|----------|
| Aptos | ✅ Comprehensive | ✅ Inline | ✅ Multiple |
| BNB | ✅ Comprehensive | ✅ Inline | ✅ Multiple |
| opBNB | ✅ Comprehensive | ✅ Inline | ✅ Multiple |

## Testing

### Test Networks

All SDKs provide full testnet support with free faucets:

- **Aptos:** https://aptoslabs.com/testnet-faucet
- **BNB:** https://testnet.bnbchain.org/faucet-smart
- **opBNB:** https://testnet.opbnbscan.com/faucet

### Local Development

```bash
# Aptos local node
aptos node run-local-testnet

# BNB local (Hardhat)
npx hardhat node --fork https://bsc-dataseed1.binance.org

# opBNB local (Hardhat)
npx hardhat node --fork https://opbnb-mainnet-rpc.bnbchain.org
```

## Summary Matrix

| Criterion | Aptos | BNB | opBNB | Winner |
|-----------|-------|-----|-------|--------|
| **Cost** | Very Low | High | Low | Aptos |
| **Speed** | Fastest | Moderate | Fast | Aptos |
| **Throughput** | Highest | Lowest | High | Aptos |
| **EVM Compatibility** | ❌ | ✅ | ✅ | BNB/opBNB |
| **Finality** | <1s | ~15s | ~2s | Aptos |
| **Ecosystem** | Growing | Largest | Growing | BNB |
| **L1 Security** | Native | Native | L1-secured | Aptos/BNB |
| **Developer Tools** | Good | Excellent | Excellent | BNB/opBNB |
| **Gas Predictability** | High | Medium | High | Aptos/opBNB |
| **Parallel Execution** | ✅ | ❌ | ❌ | Aptos |

## Recommendations by Scale

### Small Scale (< 1000 tx/day)
- **Primary:** BNB (best ecosystem, moderate costs acceptable)
- **Alternative:** opBNB (if cost matters)

### Medium Scale (1K-10K tx/day)
- **Primary:** opBNB (good balance of cost and compatibility)
- **Alternative:** Aptos (if speed matters more than EVM)

### Large Scale (10K+ tx/day)
- **Primary:** Aptos (unbeatable cost and performance)
- **Alternative:** opBNB (if EVM required)

### Multi-Chain Strategy
- **Recommended:** Deploy on all three for maximum reach
- **Cost-effective:** Aptos (primary) + opBNB (EVM compatibility)
- **Ecosystem:** BNB (primary) + opBNB (scaling)

## License

MIT License - Sport Performance Protocol

## Additional Resources

- [SDK Types Documentation](./types/README.md)
- [Aptos SDK Documentation](./aptos/README.md)
- [BNB SDK Documentation](./bnb/README.md)
- [opBNB SDK Documentation](./opbnb/README.md)
- [Protocol Documentation](https://docs.sportperformanceprotocol.com)
