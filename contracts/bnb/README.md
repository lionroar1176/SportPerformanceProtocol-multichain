# BNB Smart Chain Contracts - Sport Performance Protocol

This directory contains the Solidity smart contracts for the Sport Performance Protocol on BNB Smart Chain.

## Overview

The BNB Smart Chain implementation provides:
- **SPPToken**: ERC-20 token with burn functionality
- **PerformanceOracle**: Trust layer for match data verification
- **DeflatinaryBurn**: Token burn mechanism tied to performance metrics
- **RewardTiers**: Configurable reward tier system

## Architecture

```
contracts/
├── SPPToken.sol              # BEP-20 token with burn capability
├── PerformanceOracle.sol     # Match data verification and storage
├── DeflatinaryBurn.sol       # Performance-based burn mechanism
├── RewardTiers.sol           # Reward tier configuration
└── interfaces/
    ├── ISPPToken.sol
    ├── IPerformanceOracle.sol
    └── IDeflatinaryBurn.sol
```

## Prerequisites

- Node.js >= 16.x
- npm or yarn
- BNB Smart Chain wallet with BNB for gas fees

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

# BscScan API key for contract verification
BSCSCAN_API_KEY=your_bscscan_api_key

# RPC URLs (optional - defaults provided in hardhat.config.ts)
BSC_TESTNET_RPC=https://data-seed-prebsc-1-s1.binance.org:8545/
BSC_MAINNET_RPC=https://bsc-dataseed.binance.org/
```

## Compilation

```bash
npm run compile
```

This will compile all contracts and generate TypeScript types in `typechain-types/`.

## Testing

```bash
# Run all tests
npm test

# Run with gas reporting
REPORT_GAS=true npm test

# Run specific test file
npx hardhat test test/SPPToken.test.ts
```

## Deployment

### Testnet Deployment

```bash
# Deploy to BSC Testnet
npm run deploy:testnet
```

### Mainnet Deployment

```bash
# Deploy to BSC Mainnet (use with caution!)
npm run deploy:mainnet
```

### Deployment Output

The deployment script will output all contract addresses. Save these to your `.env` file:

```env
SPP_TOKEN_ADDRESS=0x...
PERFORMANCE_ORACLE_ADDRESS=0x...
DEFLATINARY_BURN_ADDRESS=0x...
REWARD_TIERS_ADDRESS=0x...
```

## Contract Verification

After deployment, verify contracts on BscScan:

```bash
# Verify SPPToken
npx hardhat verify --network bscMainnet <TOKEN_ADDRESS> "1000000000000000000000000000"

# Verify PerformanceOracle
npx hardhat verify --network bscMainnet <ORACLE_ADDRESS>

# Verify DeflatinaryBurn
npx hardhat verify --network bscMainnet <BURN_ADDRESS> "<TOKEN_ADDRESS>" "<ORACLE_ADDRESS>"

# Verify RewardTiers
npx hardhat verify --network bscMainnet <TIERS_ADDRESS>
```

## Contract Details

### SPPToken

**Key Features:**
- ERC-20 standard compliance
- Burnable tokens (deflationary)
- Mintable by owner
- Tracks total burned

**Main Functions:**
- `transfer(to, amount)` - Transfer tokens
- `burn(amount)` - Burn tokens from caller
- `burnFrom(account, amount)` - Burn tokens from account (requires approval or burn contract)
- `mint(to, amount)` - Mint new tokens (owner only)
- `totalBurned()` - Get total burned tokens

### PerformanceOracle

**Key Features:**
- Match registration and finalization
- Player performance recording
- Cryptographic proof generation
- Access control for authorized oracles

**Main Functions:**
- `registerMatch(matchId)` - Register new match
- `recordPerformance(matchId, player, ...)` - Record player stats
- `finalizeMatch(matchId, dataHash, playerCount)` - Finalize match
- `getPlayerPerformance(matchId, player)` - Get performance data
- `verifyPerformance(matchId, player)` - Verify performance claim

### DeflatinaryBurn

**Key Features:**
- Performance-based burn multipliers (1.5x to 4.0x)
- Effort score integration (0-100 from wearables)
- 10% burn rate on rewards
- Transaction tracking

**Main Functions:**
- `calculateReward(tier, effortScore)` - Calculate reward amount
- `burnForPerformance(matchId, player, tier, effortScore)` - Execute burn
- `getRewardTier(tier)` - Get tier configuration
- `updateTier(tier, multiplier, baseReward)` - Update tier (owner only)

### RewardTiers

**Tier System:**

| Tier | Name | Multiplier | Base Reward | Description |
|------|------|------------|-------------|-------------|
| 0 | Nifty Fifty | 1.5x | 50 SPP | Scored 50+ runs |
| 1 | Gayle Storm | 3.0x | 150 SPP | 100+ runs, SR > 150 |
| 2 | Five Wicket Haul | 2.5x | 100 SPP | Took 5+ wickets |
| 3 | Hat Trick | 3.0x | 200 SPP | 3 consecutive wickets |
| 4 | Maiden Master | 1.5x | 30 SPP | 3+ maiden overs |
| 5 | Run Machine | 4.0x | 250 SPP | Scored 150+ runs |
| 6 | Golden Arm | 1.3x | 40 SPP | Best economy rate |
| 7 | All Rounder | 2.0x | 120 SPP | 30+ runs, 2+ wickets |

## Gas Optimization

The contracts are optimized for gas efficiency:
- Using Solidity 0.8.19 with optimizer (200 runs)
- Efficient storage patterns
- Minimal external calls
- Batch operations where possible

## Security

Security features implemented:
- OpenZeppelin battle-tested contracts
- Access control (Ownable)
- Reentrancy protection
- Input validation
- Event emission for all state changes

## Network Information

### BSC Testnet
- **Chain ID**: 97
- **RPC URL**: https://data-seed-prebsc-1-s1.binance.org:8545/
- **Block Explorer**: https://testnet.bscscan.com/
- **Faucet**: https://testnet.bnbchain.org/faucet-smart

### BSC Mainnet
- **Chain ID**: 56
- **RPC URL**: https://bsc-dataseed.binance.org/
- **Block Explorer**: https://bscscan.com/
- **Gas Token**: BNB

## Integration Example

```typescript
import { ethers } from "ethers";
import SPPTokenABI from "./artifacts/contracts/SPPToken.sol/SPPToken.json";

// Connect to contract
const provider = new ethers.JsonRpcProvider("https://bsc-dataseed.binance.org/");
const sppToken = new ethers.Contract(TOKEN_ADDRESS, SPPTokenABI.abi, provider);

// Read token balance
const balance = await sppToken.balanceOf(playerAddress);
console.log("Balance:", ethers.formatEther(balance), "SPP");

// With signer (for writing)
const signer = new ethers.Wallet(privateKey, provider);
const sppTokenWithSigner = sppToken.connect(signer);

// Transfer tokens
const tx = await sppTokenWithSigner.transfer(recipientAddress, ethers.parseEther("100"));
await tx.wait();
```

## Troubleshooting

### Common Issues

1. **Insufficient BNB for gas**
   - Ensure your wallet has enough BNB for gas fees
   - Testnet: Get BNB from faucet
   - Mainnet: Buy BNB from exchange

2. **Nonce too low**
   - Reset your MetaMask account or wait for pending transactions

3. **Contract verification fails**
   - Ensure you're using the same compiler version and settings
   - Check constructor arguments match deployment

4. **Transaction reverts**
   - Check error messages in the transaction logs
   - Verify you have required permissions (oracle/owner)

## Support

For issues or questions:
- Create an issue in the repository
- Check existing documentation
- Review test files for usage examples

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Additional Resources

- [BNB Chain Documentation](https://docs.bnbchain.org/)
- [Hardhat Documentation](https://hardhat.org/docs)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [BscScan API](https://docs.bscscan.com/)
