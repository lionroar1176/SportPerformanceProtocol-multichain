# BNB Smart Chain Validator SDK

Official BNB Chain validator SDK for the Sport Performance Protocol. This SDK enables validators to interact with SPP smart contracts on BNB Smart Chain using ethers.js v6.

## Features

- Full implementation of IValidatorSDK interface
- Support for both BNB mainnet (Chain ID 56) and testnet (Chain ID 97)
- Complete match lifecycle management
- Performance recording and verification
- Deflationary burn execution
- Real-time event subscriptions
- Comprehensive error handling
- Gas optimization utilities
- BEP-20 token operations
- TypeScript support with full type definitions

## Installation

```bash
npm install @spp/bnb-validator-sdk ethers@^6.13.0
```

Or with yarn:

```bash
yarn add @spp/bnb-validator-sdk ethers@^6.13.0
```

## Quick Start

```typescript
import { BNBValidatorSDK } from '@spp/bnb-validator-sdk';

// Initialize validator
const validator = new BNBValidatorSDK();

await validator.initialize({
  rpcUrl: 'https://bsc-dataseed1.binance.org',
  privateKey: process.env.VALIDATOR_PRIVATE_KEY,
  contractAddresses: {
    token: '0x...',
    oracle: '0x...',
    burnEngine: '0x...',
    rewardTiers: '0x...',
  },
  network: 'mainnet',
  gasConfig: {
    maxGasPrice: parseUnits('5', 'gwei'), // Max 5 gwei
  },
});

// Register a match
const result = await validator.registerMatch('match_123', 0); // 0 = Cricket
console.log('Match registered:', result.txHash);

// Record performance
await validator.recordPerformance({
  matchId: 'match_123',
  player: '0xPlayer...',
  performanceScore: 85,
  effortScore: 90,
  rewardTier: 0, // NIFTY_FIFTY
});

// Execute burn
const burnResult = await validator.executeBurn('match_123', '0xPlayer...');
console.log(`Burned: ${burnResult.burnAmount}, Rewarded: ${burnResult.rewardAmount}`);
```

## Configuration

### ValidatorConfig

```typescript
interface ValidatorConfig {
  rpcUrl: string;                    // BNB RPC endpoint
  privateKey?: string;               // Validator's private key (for transactions)
  contractAddresses: {
    token: string;                   // SPP token contract
    oracle: string;                  // Performance oracle contract
    burnEngine: string;              // Deflationary burn engine
    rewardTiers: string;            // Reward tiers contract
  };
  gasConfig?: {
    maxGasPrice?: bigint;           // Maximum gas price in wei
    gasLimit?: bigint;              // Default gas limit
  };
  network?: string;                  // 'mainnet' | 'testnet'
}
```

### Network Configuration

#### Mainnet (Chain ID: 56)
```typescript
{
  rpcUrl: 'https://bsc-dataseed1.binance.org',
  // Alternative RPCs:
  // 'https://bsc-dataseed2.binance.org'
  // 'https://bsc-dataseed3.binance.org'
  // 'https://bsc-dataseed4.binance.org'
  network: 'mainnet',
}
```

#### Testnet (Chain ID: 97)
```typescript
{
  rpcUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545',
  // Alternative RPCs:
  // 'https://data-seed-prebsc-2-s1.binance.org:8545'
  network: 'testnet',
}
```

## API Reference

### Match Management

#### registerMatch(matchId: string, sport: number)

Register a new match in the protocol.

```typescript
const result = await validator.registerMatch('match_123', SportType.CRICKET);
if (result.status === 'confirmed') {
  console.log('Match registered in block:', result.blockNumber);
}
```

**Sport Types:**
- `0` - Cricket
- `1` - Football
- `2` - Basketball
- `3` - Tennis

#### finalizeMatch(matchId: string, winner: number, dataHash: string)

Finalize a match with winner and data verification hash.

```typescript
const result = await validator.finalizeMatch(
  'match_123',
  1,              // Team 1 won
  'QmHash...'     // IPFS hash of match data
);
```

#### getMatch(matchId: string)

Retrieve match data from blockchain.

```typescript
const match = await validator.getMatch('match_123');
if (match) {
  console.log('Status:', match.status);
  console.log('Winner:', match.winner);
  console.log('Players:', match.playerCount);
}
```

### Performance Recording

#### recordPerformance(params: PerformanceParams)

Record general performance data for a player.

```typescript
await validator.recordPerformance({
  matchId: 'match_123',
  player: '0xPlayerAddress',
  performanceScore: 85,
  effortScore: 90,
  rewardTier: RewardTier.NIFTY_FIFTY,
});
```

**Reward Tiers:**
- `NIFTY_FIFTY` (0) - 50+ runs
- `GAYLE_STORM` (1) - 100+ runs
- `FIVE_WICKET_HAUL` (2) - 5+ wickets
- `HAT_TRICK` (3) - 3 consecutive wickets
- `MAIDEN_MASTER` (4) - Multiple maiden overs
- `RUN_MACHINE` (5) - Consistent scoring
- `GOLDEN_ARM` (6) - Exceptional bowling
- `ALL_ROUNDER` (7) - Batting + Bowling excellence

#### recordCricketPerformance(params: CricketPerformanceParams)

Record detailed cricket statistics.

```typescript
await validator.recordCricketPerformance({
  matchId: 'match_123',
  player: '0xPlayerAddress',
  runs: 75,
  ballsFaced: 50,
  wickets: 2,
  oversBowled: 10,
  runsConceded: 45,
  maidenOvers: 2,
});
```

The contract will automatically calculate:
- Strike rate: (runs / ballsFaced) * 100
- Economy rate: runsConceded / oversBowled
- Performance tier based on achievements

#### getPerformance(matchId: string, player: string)

Retrieve performance data for a player.

```typescript
const perf = await validator.getPerformance('match_123', '0xPlayerAddress');
if (perf) {
  console.log('Score:', perf.performanceScore);
  console.log('Tier:', perf.rewardTier);
  console.log('Verified:', perf.verified);
}
```

### Burn Operations

#### executeBurn(matchId: string, player: string)

Execute deflationary burn and reward distribution.

```typescript
try {
  const burnResult = await validator.executeBurn('match_123', '0xPlayerAddress');

  console.log('Transaction:', burnResult.txHash);
  console.log('Tokens burned:', formatUnits(burnResult.burnAmount, 18));
  console.log('Rewards distributed:', formatUnits(burnResult.rewardAmount, 18));
  console.log('Performance tier:', burnResult.tier);
} catch (error) {
  console.error('Burn failed:', error.message);
}
```

**Requirements:**
- Match must be finalized
- Performance must be recorded and verified
- Validator must have sufficient token balance
- Burn engine must have token allowance

### Token Operations

#### getTokenBalance(address: string)

Get SPP token balance for any address.

```typescript
const balance = await validator.getTokenBalance('0xAddress');
console.log('Balance:', formatUnits(balance, 18), 'SPP');
```

### Event Subscriptions

#### subscribeToMatchEvents(callback)

Subscribe to match lifecycle events.

```typescript
const subscription = validator.subscribeToMatchEvents((event) => {
  console.log('Match event:', event.type);
  console.log('Match ID:', event.matchId);
  console.log('Block:', event.blockNumber);
  console.log('TX:', event.txHash);

  if (event.type === 'registered') {
    console.log('Sport:', event.data.sport);
  } else if (event.type === 'finalized') {
    console.log('Winner:', event.data.winner);
  }
});

// Unsubscribe when done
subscription.unsubscribe();
```

**Event Types:**
- `registered` - New match registered
- `finalized` - Match completed
- `cancelled` - Match cancelled

#### subscribeToBurnEvents(callback)

Subscribe to burn and reward events.

```typescript
const subscription = validator.subscribeToBurnEvents((event) => {
  console.log('Burn event:', event.type);
  console.log('Player:', event.player);
  console.log('Amount:', formatUnits(event.amount, 18));
  console.log('Block:', event.blockNumber);
});

// Unsubscribe
subscription.unsubscribe();
```

**Event Types:**
- `burn_executed` - Tokens burned
- `reward_claimed` - Rewards distributed

### Verification

#### verifyMatchData(matchId: string, expectedHash: string)

Verify match data integrity.

```typescript
const isValid = await validator.verifyMatchData('match_123', 'QmExpectedHash...');
if (!isValid) {
  console.error('Match data hash mismatch!');
}
```

#### verifyPerformance(matchId: string, player: string, expectedScore: number)

Verify performance score.

```typescript
const isValid = await validator.verifyPerformance(
  'match_123',
  '0xPlayerAddress',
  85
);
```

## Gas Optimization

### Setting Gas Limits

```typescript
await validator.initialize({
  // ... other config
  gasConfig: {
    maxGasPrice: parseUnits('5', 'gwei'),  // Don't pay more than 5 gwei
    gasLimit: 500000n,                      // Default gas limit
  },
});
```

### Gas Estimation

The SDK automatically estimates gas for all transactions with a 20% buffer:

```typescript
// Automatic gas estimation
const gasEstimate = await contract.method.estimateGas(...args);
const gasLimit = (gasEstimate * 120n) / 100n;  // +20% buffer
```

### Optimizing Batch Operations

```typescript
// Process multiple performances in parallel
const performances = [
  { matchId: 'match_123', player: '0xPlayer1', /* ... */ },
  { matchId: 'match_123', player: '0xPlayer2', /* ... */ },
];

const results = await Promise.all(
  performances.map(p => validator.recordPerformance(p))
);

console.log(`Recorded ${results.filter(r => r.status === 'confirmed').length} performances`);
```

### Gas Price Monitoring

```typescript
import { formatUnits } from 'ethers';

// Get current gas price
const feeData = await provider.getFeeData();
console.log('Current gas price:', formatUnits(feeData.gasPrice, 'gwei'), 'gwei');

// Only execute if gas is reasonable
if (feeData.gasPrice < parseUnits('10', 'gwei')) {
  await validator.registerMatch('match_123', SportType.CRICKET);
}
```

## Validator Requirements

### Hardware Requirements
- CPU: 2+ cores
- RAM: 4GB minimum, 8GB recommended
- Storage: 50GB SSD (for full node)
- Network: 10 Mbps stable connection

### Software Requirements
- Node.js 18+ or 20+
- TypeScript 5.0+
- ethers.js 6.13.0+

### BNB Balance
Validators need BNB for gas fees:
- Testnet: Get free BNB from [BNB Testnet Faucet](https://testnet.bnbchain.org/faucet-smart)
- Mainnet: Maintain 0.1-0.5 BNB for operations

### Token Requirements
- SPP tokens for burn operations
- Approve burn engine contract for token spending

## Error Handling

### Error Codes

```typescript
enum BNBValidatorError {
  NOT_INITIALIZED = 'BNB_NOT_INITIALIZED',
  NO_WALLET = 'BNB_NO_WALLET',
  TRANSACTION_FAILED = 'BNB_TX_FAILED',
  CONTRACT_ERROR = 'BNB_CONTRACT_ERROR',
  INVALID_MATCH = 'BNB_INVALID_MATCH',
  INVALID_PERFORMANCE = 'BNB_INVALID_PERFORMANCE',
  GAS_ESTIMATION_FAILED = 'BNB_GAS_ESTIMATION_FAILED',
  INSUFFICIENT_BALANCE = 'BNB_INSUFFICIENT_BALANCE',
}
```

### Error Handling Examples

```typescript
// Handling transaction failures
try {
  const result = await validator.registerMatch('match_123', SportType.CRICKET);
  if (result.status === 'failed') {
    console.error('Transaction failed:', result.error);

    if (result.error?.includes('INSUFFICIENT_BALANCE')) {
      console.log('Need more BNB for gas');
    }
  }
} catch (error) {
  console.error('Unexpected error:', error);
}

// Handling initialization errors
try {
  await validator.initialize(config);
} catch (error) {
  if (error.message.includes('NOT_INITIALIZED')) {
    console.error('SDK initialization failed');
  }
}

// Handling burn errors
try {
  const burnResult = await validator.executeBurn('match_123', '0xPlayer');
} catch (error) {
  if (error.message.includes('INVALID_PERFORMANCE')) {
    console.error('No performance data found for player');
  } else if (error.message.includes('INSUFFICIENT_BALANCE')) {
    console.error('Player needs more SPP tokens');
  }
}
```

## Complete Example

```typescript
import { BNBValidatorSDK, SportType, RewardTier } from '@spp/bnb-validator-sdk';
import { parseUnits, formatUnits } from 'ethers';

async function runValidator() {
  // Initialize
  const validator = new BNBValidatorSDK();

  await validator.initialize({
    rpcUrl: process.env.BNB_RPC_URL!,
    privateKey: process.env.VALIDATOR_PRIVATE_KEY!,
    contractAddresses: {
      token: process.env.TOKEN_ADDRESS!,
      oracle: process.env.ORACLE_ADDRESS!,
      burnEngine: process.env.BURN_ENGINE_ADDRESS!,
      rewardTiers: process.env.REWARD_TIERS_ADDRESS!,
    },
    network: 'mainnet',
    gasConfig: {
      maxGasPrice: parseUnits('5', 'gwei'),
    },
  });

  const chainInfo = validator.getChainInfo();
  console.log(`Connected to ${chainInfo.name} (Chain ID: ${chainInfo.chainId})`);

  // Subscribe to events
  const matchSub = validator.subscribeToMatchEvents((event) => {
    console.log(`Match ${event.type}:`, event.matchId);
  });

  const burnSub = validator.subscribeToBurnEvents((event) => {
    console.log(`Burn ${event.type}:`, formatUnits(event.amount, 18), 'SPP');
  });

  // Register match
  const matchId = `cricket_${Date.now()}`;
  const regResult = await validator.registerMatch(matchId, SportType.CRICKET);

  if (regResult.status === 'confirmed') {
    console.log('Match registered:', regResult.txHash);

    // Record cricket performance
    const perfResult = await validator.recordCricketPerformance({
      matchId,
      player: '0xPlayerAddress',
      runs: 75,
      ballsFaced: 50,
      wickets: 2,
      oversBowled: 10,
      runsConceded: 45,
      maidenOvers: 2,
    });

    console.log('Performance recorded:', perfResult.txHash);

    // Finalize match
    const finalResult = await validator.finalizeMatch(matchId, 1, 'QmDataHash...');
    console.log('Match finalized:', finalResult.txHash);

    // Execute burn
    try {
      const burnResult = await validator.executeBurn(matchId, '0xPlayerAddress');
      console.log('Burn executed:', burnResult.txHash);
      console.log('Burned:', formatUnits(burnResult.burnAmount, 18), 'SPP');
      console.log('Rewarded:', formatUnits(burnResult.rewardAmount, 18), 'SPP');
    } catch (error) {
      console.error('Burn failed:', error);
    }

    // Verify data
    const match = await validator.getMatch(matchId);
    console.log('Match status:', match?.status);

    const perf = await validator.getPerformance(matchId, '0xPlayerAddress');
    console.log('Performance score:', perf?.performanceScore);
  }

  // Cleanup
  matchSub.unsubscribe();
  burnSub.unsubscribe();
}

runValidator().catch(console.error);
```

## Security Best Practices

1. **Private Key Management**
   ```typescript
   // Use environment variables
   privateKey: process.env.VALIDATOR_PRIVATE_KEY

   // Never commit private keys to git
   // Use .env files with .gitignore
   ```

2. **Gas Price Protection**
   ```typescript
   gasConfig: {
     maxGasPrice: parseUnits('10', 'gwei'), // Set reasonable limit
   }
   ```

3. **Error Handling**
   ```typescript
   // Always wrap transactions in try-catch
   try {
     await validator.registerMatch(matchId, sport);
   } catch (error) {
     // Log and handle appropriately
     console.error('Transaction failed:', error);
   }
   ```

4. **Data Verification**
   ```typescript
   // Always verify on-chain data
   const isValid = await validator.verifyMatchData(matchId, expectedHash);
   if (!isValid) {
     throw new Error('Data verification failed');
   }
   ```

## Troubleshooting

### Connection Issues
```typescript
// Test RPC connection
const provider = new JsonRpcProvider(rpcUrl);
const network = await provider.getNetwork();
console.log('Connected to chain:', network.chainId);
```

### Transaction Failures
```typescript
// Check balance before transactions
const balance = await provider.getBalance(walletAddress);
console.log('BNB balance:', formatUnits(balance, 18));

// Estimate gas before sending
const gasEstimate = await contract.method.estimateGas(...args);
console.log('Estimated gas:', gasEstimate.toString());
```

### Event Subscription Issues
```typescript
// Test event listening
validator.subscribeToMatchEvents((event) => {
  console.log('Received event:', event);
});

// Wait for events
await new Promise(resolve => setTimeout(resolve, 5000));
```

## License

MIT License - see LICENSE file for details
