# opBNB Layer 2 Validator SDK

Official opBNB validator SDK for the Sport Performance Protocol. This SDK extends the BNB validator with opBNB-specific configuration, providing ultra-low gas fees and high throughput on BNB Chain's Layer 2 solution.

## What is opBNB?

opBNB is an optimistic rollup Layer 2 scaling solution built on BNB Chain, offering:

- **10-100x Lower Gas Fees** - Transactions cost a fraction of L1 BNB Chain
- **10,000+ TPS** - High throughput for mass adoption
- **EVM Compatible** - Same contracts, tools, and infrastructure as BNB Chain
- **Fast Finality** - 1-2 seconds for soft finality, ~7 days for L1 finality
- **Security** - Inherits security from BNB Chain through fraud proofs

## Features

- Full implementation of IValidatorSDK interface
- Extends BNB validator with opBNB chain configuration
- Support for both opBNB mainnet (Chain ID 204) and testnet (Chain ID 5611)
- Ultra-low gas costs for validator operations
- Complete match lifecycle management
- Performance recording and verification
- Deflationary burn execution
- Real-time event subscriptions
- TypeScript support with full type definitions

## Installation

```bash
npm install @spp/opbnb-validator-sdk ethers@^6.13.0
```

Or with yarn:

```bash
yarn add @spp/opbnb-validator-sdk ethers@^6.13.0
```

## Quick Start

```typescript
import { OpBNBValidatorSDK } from '@spp/opbnb-validator-sdk';

// Initialize validator
const validator = new OpBNBValidatorSDK();

await validator.initialize({
  rpcUrl: 'https://opbnb-mainnet-rpc.bnbchain.org',
  privateKey: process.env.VALIDATOR_PRIVATE_KEY,
  contractAddresses: {
    token: '0x...',
    oracle: '0x...',
    burnEngine: '0x...',
    rewardTiers: '0x...',
  },
  network: 'mainnet',
  gasConfig: {
    maxGasPrice: parseUnits('0.001', 'gwei'), // Much lower than BNB L1
  },
});

// Get chain info
const chainInfo = validator.getChainInfo();
console.log(`Connected to ${chainInfo.name} (Chain ID: ${chainInfo.chainId})`);
// Output: Connected to opBNB (Chain ID: 204)

// Use exactly like BNB validator
const result = await validator.registerMatch('match_123', 0);
console.log('Match registered:', result.txHash);
```

## Configuration

### Network Configuration

#### Mainnet (Chain ID: 204)
```typescript
{
  rpcUrl: 'https://opbnb-mainnet-rpc.bnbchain.org',
  // Alternative RPCs:
  // 'https://opbnb-mainnet.nodereal.io/v1/YOUR_API_KEY'
  // 'https://opbnb.publicnode.com'
  network: 'mainnet',
}
```

#### Testnet (Chain ID: 5611)
```typescript
{
  rpcUrl: 'https://opbnb-testnet-rpc.bnbchain.org',
  // Alternative RPCs:
  // 'https://opbnb-testnet.nodereal.io/v1/YOUR_API_KEY'
  network: 'testnet',
}
```

### Gas Configuration for opBNB

opBNB has significantly lower gas costs than BNB L1:

```typescript
await validator.initialize({
  // ... other config
  gasConfig: {
    // Much lower gas prices on L2
    maxGasPrice: parseUnits('0.001', 'gwei'),  // ~1000x lower than L1
    gasLimit: 500000n,
  },
});
```

**Typical Gas Costs (opBNB vs BNB L1):**

| Operation | BNB L1 | opBNB | Savings |
|-----------|--------|-------|---------|
| Register Match | ~$0.50 | ~$0.005 | 100x |
| Record Performance | ~$0.30 | ~$0.003 | 100x |
| Execute Burn | ~$0.80 | ~$0.008 | 100x |

## API Reference

The opBNB SDK supports the exact same API as the BNB SDK. All methods work identically:

### Match Management
- `registerMatch(matchId, sport)` - Register new match
- `finalizeMatch(matchId, winner, dataHash)` - Finalize match
- `getMatch(matchId)` - Query match data

### Performance Recording
- `recordPerformance(params)` - Record general performance
- `recordCricketPerformance(params)` - Record cricket stats
- `getPerformance(matchId, player)` - Query performance data

### Burn Operations
- `executeBurn(matchId, player)` - Execute deflationary burn

### Token Operations
- `getTokenBalance(address)` - Check SPP token balance

### Event Subscriptions
- `subscribeToMatchEvents(callback)` - Listen to match events
- `subscribeToBurnEvents(callback)` - Listen to burn events

### Verification
- `verifyMatchData(matchId, expectedHash)` - Verify match data
- `verifyPerformance(matchId, player, expectedScore)` - Verify performance

For detailed API documentation, see the [BNB SDK README](../bnb/README.md) - all methods work identically on opBNB.

## opBNB-Specific Optimizations

### Batch Processing

With lower gas costs, you can process more transactions in parallel:

```typescript
// Process 50 performances in parallel (economically viable on opBNB)
const performances = players.map(player => ({
  matchId: 'match_123',
  player: player.address,
  performanceScore: player.score,
  effortScore: player.effort,
  rewardTier: player.tier,
}));

// All transactions complete quickly and cheaply
const results = await Promise.all(
  performances.map(p => validator.recordPerformance(p))
);

console.log(`Processed ${results.length} performances for ~$${(results.length * 0.003).toFixed(2)}`);
```

### High-Frequency Updates

opBNB's low gas costs enable real-time updates:

```typescript
// Update performance data every minute during live match
setInterval(async () => {
  const liveStats = await fetchLiveMatchStats();

  for (const player of liveStats.players) {
    await validator.recordPerformance({
      matchId: liveStats.matchId,
      player: player.address,
      performanceScore: player.currentScore,
      effortScore: player.effort,
      rewardTier: calculateTier(player),
    });
  }

  console.log('Live stats updated on-chain');
}, 60000); // Every minute
```

### Micro-Transactions

Enable micro-burns and rewards:

```typescript
// Burn tiny amounts frequently (economical on opBNB)
async function executeMicroBurn(matchId: string, player: string) {
  const burnResult = await validator.executeBurn(matchId, player);

  // Gas cost (~$0.008) is negligible even for small burns
  console.log(`Burned ${formatUnits(burnResult.burnAmount, 18)} SPP`);
  console.log('Gas cost: ~$0.008');
}
```

## Gas Optimization Tips for opBNB

### 1. Leverage Lower Gas Costs

```typescript
// On BNB L1: Batch to save gas
// On opBNB: Process individually for simplicity

// BNB L1 approach (batch to save gas)
await batchRegisterMatches([match1, match2, match3]);

// opBNB approach (process individually, still cheap)
await validator.registerMatch(match1.id, match1.sport);
await validator.registerMatch(match2.id, match2.sport);
await validator.registerMatch(match3.id, match3.sport);
// Total cost: ~$0.015 (vs ~$1.50 on L1)
```

### 2. Aggressive Parallelization

```typescript
// Process many operations concurrently
const operations = [
  validator.registerMatch('match_1', SportType.CRICKET),
  validator.registerMatch('match_2', SportType.FOOTBALL),
  validator.recordPerformance(perf1),
  validator.recordPerformance(perf2),
  validator.executeBurn('match_old', player1),
];

// All complete quickly with minimal total cost
const results = await Promise.all(operations);
console.log('5 operations completed for ~$0.025');
```

### 3. Real-Time Event Processing

```typescript
// Subscribe and react immediately (gas cost is negligible)
validator.subscribeToMatchEvents(async (event) => {
  if (event.type === 'finalized') {
    // Immediately process burns for all players
    const players = await getMatchPlayers(event.matchId);

    await Promise.all(
      players.map(player => validator.executeBurn(event.matchId, player))
    );

    console.log(`Processed ${players.length} burns within seconds of finalization`);
  }
});
```

## Bridging Assets to opBNB

Before using opBNB, you need to bridge BNB and SPP tokens from BNB L1:

### Official Bridge

1. Visit [opBNB Bridge](https://opbnb-bridge.bnbchain.org)
2. Connect your wallet
3. Bridge BNB for gas fees
4. Bridge SPP tokens for validator operations

### Programmatic Bridging

```typescript
import { ethers } from 'ethers';

// L1 Bridge contract
const l1Bridge = new Contract(L1_BRIDGE_ADDRESS, L1_BRIDGE_ABI, l1Wallet);

// Bridge BNB to opBNB
const bridgeTx = await l1Bridge.depositETH({
  value: parseEther('0.1'), // Bridge 0.1 BNB
});

await bridgeTx.wait();
console.log('BNB bridged to opBNB (available in ~5 minutes)');

// Bridge SPP tokens
const bridgeTokenTx = await l1Bridge.depositERC20(
  SPP_TOKEN_ADDRESS,
  parseUnits('1000', 18), // Bridge 1000 SPP
);

await bridgeTokenTx.wait();
console.log('SPP tokens bridged to opBNB');
```

## Complete Example: opBNB Validator

```typescript
import { OpBNBValidatorSDK, SportType, RewardTier } from '@spp/opbnb-validator-sdk';
import { parseUnits, formatUnits } from 'ethers';

async function runOpBNBValidator() {
  // Initialize opBNB validator
  const validator = new OpBNBValidatorSDK();

  await validator.initialize({
    rpcUrl: 'https://opbnb-mainnet-rpc.bnbchain.org',
    privateKey: process.env.VALIDATOR_PRIVATE_KEY!,
    contractAddresses: {
      token: process.env.OPBNB_TOKEN_ADDRESS!,
      oracle: process.env.OPBNB_ORACLE_ADDRESS!,
      burnEngine: process.env.OPBNB_BURN_ENGINE_ADDRESS!,
      rewardTiers: process.env.OPBNB_REWARD_TIERS_ADDRESS!,
    },
    network: 'mainnet',
    gasConfig: {
      maxGasPrice: parseUnits('0.001', 'gwei'),
    },
  });

  const chainInfo = validator.getChainInfo();
  console.log(`Connected to ${chainInfo.name} (Chain ID: ${chainInfo.chainId})`);
  console.log(`Block Explorer: ${chainInfo.blockExplorer}`);

  // Subscribe to events
  const matchSub = validator.subscribeToMatchEvents((event) => {
    console.log(`[opBNB] Match ${event.type}:`, event.matchId);
    console.log(`Block: ${event.blockNumber}, TX: ${event.txHash}`);
  });

  const burnSub = validator.subscribeToBurnEvents((event) => {
    console.log(`[opBNB] Burn ${event.type}:`, formatUnits(event.amount, 18), 'SPP');
    console.log(`Player: ${event.player}`);
  });

  // Register multiple matches in parallel (cheap on L2)
  const matchIds = ['cricket_001', 'cricket_002', 'football_001'];
  const regResults = await Promise.all(
    matchIds.map((id, i) =>
      validator.registerMatch(id, i < 2 ? SportType.CRICKET : SportType.FOOTBALL)
    )
  );

  console.log(`Registered ${regResults.length} matches for ~$${(regResults.length * 0.005).toFixed(3)}`);

  // Record performances for first match
  const players = [
    { address: '0xPlayer1', runs: 75, balls: 50 },
    { address: '0xPlayer2', runs: 120, balls: 80 },
    { address: '0xPlayer3', runs: 45, balls: 35 },
  ];

  const perfResults = await Promise.all(
    players.map(player =>
      validator.recordCricketPerformance({
        matchId: matchIds[0],
        player: player.address,
        runs: player.runs,
        ballsFaced: player.balls,
        wickets: 0,
        oversBowled: 0,
        runsConceded: 0,
        maidenOvers: 0,
      })
    )
  );

  console.log(`Recorded ${perfResults.length} performances for ~$${(perfResults.length * 0.003).toFixed(3)}`);

  // Finalize match
  const finalResult = await validator.finalizeMatch(matchIds[0], 1, 'QmMatchData...');
  console.log('Match finalized:', finalResult.txHash);

  // Execute burns for all players in parallel
  const burnResults = await Promise.all(
    players.map(player => validator.executeBurn(matchIds[0], player.address))
  );

  let totalBurned = 0n;
  let totalRewarded = 0n;

  for (const result of burnResults) {
    totalBurned += result.burnAmount;
    totalRewarded += result.rewardAmount;
    console.log(`Player ${result.player}:`);
    console.log(`  Burned: ${formatUnits(result.burnAmount, 18)} SPP`);
    console.log(`  Rewarded: ${formatUnits(result.rewardAmount, 18)} SPP`);
    console.log(`  Tier: ${RewardTier[result.tier]}`);
  }

  console.log('\nTotal Summary:');
  console.log(`  Total Burned: ${formatUnits(totalBurned, 18)} SPP`);
  console.log(`  Total Rewarded: ${formatUnits(totalRewarded, 18)} SPP`);
  console.log(`  Total Gas Cost: ~$${(burnResults.length * 0.008).toFixed(3)}`);
  console.log(`  Gas Savings vs L1: ~$${(burnResults.length * 0.792).toFixed(2)}`);

  // Query on-chain data
  const match = await validator.getMatch(matchIds[0]);
  console.log('\nMatch Data:', {
    status: match?.status,
    players: match?.playerCount,
    winner: match?.winner,
  });

  // Verify data integrity
  const isValid = await validator.verifyMatchData(matchIds[0], 'QmMatchData...');
  console.log('Data verification:', isValid ? 'PASSED' : 'FAILED');

  // Cleanup
  matchSub.unsubscribe();
  burnSub.unsubscribe();
}

runOpBNBValidator().catch(console.error);
```

## L1 vs L2 Comparison

### When to Use opBNB vs BNB L1

**Use opBNB (L2) for:**
- High-frequency validator operations
- Processing many transactions
- Real-time match updates
- Micro-transactions and micro-burns
- Cost-sensitive applications
- Batch processing at scale

**Use BNB L1 for:**
- Final settlement and security
- Large-value transactions
- When immediate L1 finality is required
- Cross-chain bridges and integrations

### Cost Comparison Example

**Scenario:** Process 100 matches with 10 players each (1,000 performance records + 1,000 burns)

| Network | Gas Cost per TX | Total Operations | Total Cost |
|---------|----------------|------------------|------------|
| BNB L1 | ~$0.40 | 2,100 | ~$840 |
| opBNB L2 | ~$0.004 | 2,100 | ~$8.40 |
| **Savings** | | | **$831.60 (99%)** |

## Validator Requirements

### Hardware Requirements
- CPU: 2+ cores (same as L1)
- RAM: 4GB minimum (lighter than L1)
- Storage: 20GB SSD (smaller than L1)
- Network: 10 Mbps stable connection

### Software Requirements
- Node.js 18+ or 20+
- TypeScript 5.0+
- ethers.js 6.13.0+

### BNB Balance (for opBNB)
- Testnet: Get free BNB from [opBNB Testnet Faucet](https://testnet.opbnbscan.com/faucet)
- Mainnet: Bridge from L1 (0.01-0.05 BNB sufficient for thousands of transactions)

## Troubleshooting

### Connection Issues

```typescript
// Test opBNB RPC connection
const provider = new JsonRpcProvider('https://opbnb-mainnet-rpc.bnbchain.org');
const network = await provider.getNetwork();
console.log('Connected to chain:', network.chainId); // Should be 204
```

### Bridge Delays

Deposits from L1 to opBNB typically take 5-15 minutes:

```typescript
// Check if assets have arrived on L2
const balance = await provider.getBalance(walletAddress);
console.log('L2 BNB balance:', formatUnits(balance, 18));

const tokenBalance = await validator.getTokenBalance(walletAddress);
console.log('L2 SPP balance:', formatUnits(tokenBalance, 18));
```

### Gas Price Issues

opBNB gas prices are very stable and low:

```typescript
const feeData = await provider.getFeeData();
console.log('Current gas price:', formatUnits(feeData.gasPrice, 'gwei'), 'gwei');
// Typically: 0.001 gwei or lower
```

## Resources

- **opBNB Official Docs:** https://docs.bnbchain.org/opbnb-docs/
- **opBNB Bridge:** https://opbnb-bridge.bnbchain.org
- **opBNB Mainnet Explorer:** https://opbnbscan.com
- **opBNB Testnet Explorer:** https://testnet.opbnbscan.com
- **opBNB Testnet Faucet:** https://testnet.opbnbscan.com/faucet
- **SPP Documentation:** https://docs.sportperformanceprotocol.com

## Advantages of opBNB for SPP

1. **Cost Efficiency:** 100x lower gas costs enable micro-operations
2. **High Throughput:** Process thousands of performances per second
3. **Fast Finality:** 1-2 second confirmation for soft finality
4. **EVM Compatible:** Same contracts and tools as L1
5. **Inherited Security:** Fraud proofs secure L2 state on L1
6. **Scalability:** Can handle global sports event load
7. **User Experience:** Near-instant confirmations

## Migration from BNB L1

Already using BNB L1 validator? Migration is simple:

```typescript
// 1. Deploy contracts to opBNB (same contracts, no changes)
// 2. Bridge tokens to opBNB
// 3. Change SDK import
- import { BNBValidatorSDK } from '@spp/bnb-validator-sdk';
+ import { OpBNBValidatorSDK } from '@spp/opbnb-validator-sdk';

// 4. Update RPC URL and chain config
- rpcUrl: 'https://bsc-dataseed1.binance.org'
+ rpcUrl: 'https://opbnb-mainnet-rpc.bnbchain.org'

// 5. Lower gas price config
- maxGasPrice: parseUnits('5', 'gwei')
+ maxGasPrice: parseUnits('0.001', 'gwei')

// That's it! All other code remains identical
```

## License

MIT License - see LICENSE file for details
