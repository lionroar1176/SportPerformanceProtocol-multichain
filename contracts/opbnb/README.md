# opBNB L2 Contracts - Sport Performance Protocol

This directory contains the opBNB L2 deployment configuration for the Sport Performance Protocol. opBNB uses the **same Solidity contracts** as BNB Smart Chain, but with different network configurations and RPC endpoints.

## Overview

opBNB is an optimistic Layer 2 solution built on the BNB Smart Chain. It offers:
- **Lower gas fees** (~$0.001 per transaction)
- **Faster block times** (~1 second)
- **Higher throughput** (10,000+ TPS)
- **EVM compatibility** (same contracts as BSC)

## Architecture

The opBNB implementation uses a **symlink** to the BNB contracts directory:

```
contracts/opbnb/
├── contracts -> ../bnb/contracts/  # Symlink to BNB contracts
├── hardhat.config.ts               # opBNB-specific network config
├── package.json
├── scripts/
│   └── deploy.ts                   # opBNB deployment script
└── README.md (this file)
```

All contract source code is located in `../bnb/contracts/`. This ensures consistency between BNB and opBNB deployments.

## Key Differences from BNB

| Feature | BNB Smart Chain | opBNB |
|---------|----------------|-------|
| Chain ID | 56 (mainnet), 97 (testnet) | 204 (mainnet), 5611 (testnet) |
| Block Time | ~3 seconds | ~1 second |
| Gas Price | ~5 Gwei | ~0.01 Gwei |
| TPS | ~100 | ~10,000 |
| Finality | ~75 seconds | ~1 second (soft), ~7 days (hard) |

## Prerequisites

- Node.js >= 16.x
- npm or yarn
- BNB for gas fees (very small amounts needed on opBNB)

## Installation

```bash
# Install dependencies
npm install

# Or with yarn
yarn install
```

## Configuration

Create a `.env` file in the project root:

```env
# Private key for deployment (without 0x prefix)
PRIVATE_KEY=your_private_key_here

# opBNBScan API key for contract verification
OPBNB_SCAN_API_KEY=your_opbnb_scan_api_key

# RPC URLs (optional - defaults provided in hardhat.config.ts)
OPBNB_TESTNET_RPC=https://opbnb-testnet-rpc.bnbchain.org
OPBNB_MAINNET_RPC=https://opbnb-mainnet-rpc.bnbchain.org
```

## Compilation

```bash
npm run compile
```

This compiles the contracts from `../bnb/contracts/` using opBNB network settings.

## Testing

Tests can be run using the same test files as BNB:

```bash
# Run all tests
npm test

# Run specific test
npx hardhat test test/SPPToken.test.ts
```

Note: Tests are symlinked or can reference the BNB test directory.

## Deployment

### Testnet Deployment

```bash
# Deploy to opBNB Testnet
npm run deploy:testnet
```

### Mainnet Deployment

```bash
# Deploy to opBNB Mainnet
npm run deploy:mainnet
```

### Deployment Output

Save the contract addresses to your `.env` file:

```env
OPBNB_SPP_TOKEN_ADDRESS=0x...
OPBNB_PERFORMANCE_ORACLE_ADDRESS=0x...
OPBNB_DEFLATINARY_BURN_ADDRESS=0x...
OPBNB_REWARD_TIERS_ADDRESS=0x...
```

## Contract Verification

Verify contracts on opBNBScan:

```bash
# Verify SPPToken
npx hardhat verify --network opBNBMainnet <TOKEN_ADDRESS> "1000000000000000000000000000"

# Verify PerformanceOracle
npx hardhat verify --network opBNBMainnet <ORACLE_ADDRESS>

# Verify DeflatinaryBurn
npx hardhat verify --network opBNBMainnet <BURN_ADDRESS> "<TOKEN_ADDRESS>" "<ORACLE_ADDRESS>"

# Verify RewardTiers
npx hardhat verify --network opBNBMainnet <TIERS_ADDRESS>
```

## Network Information

### opBNB Testnet
- **Chain ID**: 5611
- **RPC URL**: https://opbnb-testnet-rpc.bnbchain.org
- **Block Explorer**: https://testnet.opbnbscan.com
- **Faucet**: https://testnet.bnbchain.org/faucet-smart

### opBNB Mainnet
- **Chain ID**: 204
- **RPC URL**: https://opbnb-mainnet-rpc.bnbchain.org
- **Block Explorer**: https://opbnbscan.com
- **Gas Token**: BNB (very small amounts)

## Gas Costs Comparison

Approximate gas costs for common operations:

| Operation | BSC (5 Gwei) | opBNB (0.01 Gwei) | Savings |
|-----------|--------------|-------------------|---------|
| Token Transfer | ~$0.05 | ~$0.0001 | 99.8% |
| Register Match | ~$0.20 | ~$0.0004 | 99.8% |
| Record Performance | ~$0.30 | ~$0.0006 | 99.8% |
| Burn Transaction | ~$0.15 | ~$0.0003 | 99.8% |

## Integration Example

```typescript
import { ethers } from "ethers";
import SPPTokenABI from "./artifacts/contracts/SPPToken.sol/SPPToken.json";

// Connect to opBNB
const provider = new ethers.JsonRpcProvider("https://opbnb-mainnet-rpc.bnbchain.org");
const sppToken = new ethers.Contract(OPBNB_TOKEN_ADDRESS, SPPTokenABI.abi, provider);

// Read token balance
const balance = await sppToken.balanceOf(playerAddress);
console.log("Balance:", ethers.formatEther(balance), "SPP");

// With signer
const signer = new ethers.Wallet(privateKey, provider);
const sppTokenWithSigner = sppToken.connect(signer);

// Transfer tokens (very low gas cost!)
const tx = await sppTokenWithSigner.transfer(recipientAddress, ethers.parseEther("100"));
await tx.wait();
console.log("Transaction cost:", ethers.formatEther(tx.gasPrice * tx.gasLimit), "BNB");
```

## Bridge Between BSC and opBNB

To move assets between BSC and opBNB:

### Bridge Assets (Official BNB Bridge)
1. Visit: https://opbnb-bridge.bnbchain.org/
2. Connect your wallet
3. Select BSC → opBNB (or vice versa)
4. Enter amount and confirm

### Withdrawal Period
- **Deposit (BSC → opBNB)**: ~5-10 minutes
- **Withdrawal (opBNB → BSC)**: ~7 days (optimistic rollup challenge period)

## Why Use opBNB?

1. **Cost-Effective**: 99.8% cheaper than BSC
2. **Fast**: 1-second block times
3. **Scalable**: Handles high-frequency operations
4. **Compatible**: Same contracts, same tools
5. **Secure**: Inherits BSC security

## Ideal Use Cases

opBNB is perfect for:
- High-frequency performance recording
- Micro-transactions and rewards
- Real-time match data updates
- Player interactions and social features
- Testing and development

## Multi-Chain Strategy

Recommended deployment strategy:

1. **opBNB**: Primary layer for high-frequency operations
   - Match registration
   - Performance recording
   - Micro-rewards
   - Player statistics

2. **BSC**: Settlement layer for high-value transactions
   - Large token transfers
   - Governance decisions
   - Major reward distributions

3. **Bridge**: Periodic settlement between layers
   - Aggregate opBNB rewards
   - Bridge to BSC for large withdrawals

## Troubleshooting

### Common Issues

1. **RPC Connection Failed**
   - Try alternative RPC: https://opbnb-mainnet.nodereal.io/v1/64a9df0874fb4a93b9d0a3849de012d3
   - Check network status: https://status.bnbchain.org/

2. **Gas Estimation Failed**
   - Ensure sufficient BNB balance (even small amounts)
   - Check if contract is authorized (oracle permissions)

3. **Bridge Delays**
   - Deposits: Wait 10-15 minutes
   - Withdrawals: Wait full 7-day challenge period

4. **Contract Not Verified**
   - Ensure using opBNBScan API (different from BscScan)
   - Double-check constructor parameters

## Performance Tips

1. **Batch Operations**: Group multiple transactions to save gas
2. **Off-Chain Aggregation**: Aggregate data off-chain, submit proofs on-chain
3. **Event Indexing**: Use The Graph or similar for efficient querying
4. **Gas Optimization**: Enable optimizer with high runs for frequently-called functions

## Additional Resources

- [opBNB Documentation](https://docs.bnbchain.org/opbnb-docs/)
- [opBNB Bridge Guide](https://docs.bnbchain.org/opbnb-docs/core-concepts/bridge/)
- [opBNBScan](https://opbnbscan.com/)
- [NodeReal RPC](https://nodereal.io/meganode/api-marketplace/bnb-opbnb-rpc)
- [BNB Chain Status](https://status.bnbchain.org/)

## Support

For issues specific to opBNB deployment:
- Check opBNB documentation
- Visit BNB Chain Discord: https://discord.gg/bnbchain
- Review opBNBScan for transaction details

## License

This project is licensed under the MIT License - see the LICENSE file for details.
