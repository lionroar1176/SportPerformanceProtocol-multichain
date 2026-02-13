# @spp/aptos-validator-sdk

Aptos blockchain validator SDK for Sport Performance Protocol.

## Installation

```bash
npm install @spp/aptos-validator-sdk
```

## Quick Start

```typescript
import { AptosValidatorSDK } from '@spp/aptos-validator-sdk';

const sdk = new AptosValidatorSDK();
await sdk.initialize({
  rpcUrl: 'https://fullnode.devnet.aptoslabs.com/v1',
  network: 'devnet',
  privateKey: process.env.VALIDATOR_PRIVATE_KEY,
  contractAddresses: {
    token: '0x...::spp_protocol',
    oracle: '0x...::spp_protocol',
    burnEngine: '0x...::spp_protocol',
    rewardTiers: '0x...::spp_protocol',
  },
});
```

## Validator Requirements

### Minimum Stake
10,000 SPP tokens

### Hardware Requirements
- 4 CPU cores
- 8GB RAM
- 100GB SSD
- 100 Mbps network

### Uptime Requirement
99.5% required

## Transaction Submission

### Register a Match

```typescript
const result = await sdk.registerMatch('MATCH_2026_001', 0); // 0 = Cricket
console.log('TX Hash:', result.txHash);
console.log('Status:', result.status);
```

### Finalize Match

```typescript
const dataHash = 'data_hash_string'; // Hash of match data
const result = await sdk.finalizeMatch('MATCH_2026_001', 1, dataHash);
```

### Record Cricket Performance

```typescript
const result = await sdk.recordCricketPerformance({
  matchId: 'MATCH_2026_001',
  player: '0x1234...', // Aptos address
  runs: 75,
  ballsFaced: 50,
  wickets: 2,
  oversBowled: 4,
  runsConceded: 28,
  maidenOvers: 1,
});
```

### Execute Burn and Claim Rewards

```typescript
const burnResult = await sdk.executeBurn('MATCH_2026_001', '0x1234...');
console.log('Burn Amount:', burnResult.burnAmount.toString());
console.log('Reward Amount:', burnResult.rewardAmount.toString());
```

## Query Functions

### Get Match Data

```typescript
const match = await sdk.getMatch('MATCH_2026_001');
if (match) {
  console.log('Sport:', match.sport);
  console.log('Status:', match.status);
  console.log('Winner:', match.winner);
}
```

### Get Performance Data

```typescript
const perf = await sdk.getPerformance('MATCH_2026_001', '0x1234...');
if (perf) {
  console.log('Performance Score:', perf.performanceScore);
  console.log('Effort Score:', perf.effortScore);
  console.log('Reward Tier:', perf.rewardTier);
}
```

### Get Token Balance

```typescript
const balance = await sdk.getTokenBalance('0x1234...');
console.log('Balance:', balance.toString(), 'SPP');
```

## Event Listening

```typescript
const subscription = sdk.subscribeToMatchEvents((event) => {
  console.log('Match event:', event.type, event.matchId);
});

// Later...
subscription.unsubscribe();
```

## Verification

### Verify Match Data

```typescript
const isValid = await sdk.verifyMatchData('MATCH_2026_001', expectedHash);
console.log('Match data valid:', isValid);
```

### Verify Performance

```typescript
const isValid = await sdk.verifyPerformance('MATCH_2026_001', '0x1234...', 80);
console.log('Performance valid:', isValid);
```

## Error Handling

```typescript
try {
  const result = await sdk.registerMatch('MATCH_001', 0);
  if (result.status === 'failed') {
    console.error('Transaction failed:', result.error);
  }
} catch (error) {
  console.error('SDK error:', error);
}
```

## Aptos-Specific Considerations

### Account Initialization

Aptos uses Ed25519 private keys. To create an account:

```typescript
import { Account, Ed25519PrivateKey } from '@aptos-labs/ts-sdk';

const privateKey = new Ed25519PrivateKey(yourPrivateKeyHex);
const account = Account.fromPrivateKey({ privateKey });
```

### Transaction Fees

Transactions on Aptos require APT for gas fees. Ensure your account has sufficient APT balance.

### Networks

- **Mainnet**: Production deployment
- **Testnet**: Testing with faucet tokens
- **Devnet**: Development with frequent resets

## Chain Information

```typescript
const info = sdk.getChainInfo();
console.log('Chain:', info.name);
console.log('Native Currency:', info.nativeCurrency);
console.log('Block Explorer:', info.blockExplorer);
```

## License

MIT

## Support

For issues and questions:
- GitHub Issues: https://github.com/SportPerformanceProtocol/spp-protocol/issues
- Documentation: https://docs.sportperformanceprotocol.com
