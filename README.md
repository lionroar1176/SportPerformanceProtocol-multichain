# Sport Performance Protocol (SPP) - Multi-Chain Architecture v3.0

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Multi-Chain](https://img.shields.io/badge/Multi--Chain-Arbitrum%20%7C%20Solana%20%7C%20BNB%20%7C%20opBNB%20%7C%20Aptos-green)]()

## Overview

Sport Performance Protocol is a decentralized platform for verifiable sports performance data, tokenomics, and athlete NFTs. This repository contains the **Multi-Chain Architecture v3.0** implementation, supporting multiple blockchains for maximum reach and flexibility.

## Supported Blockchains

| Chain | Status | Language | Token Standard | Use Case |
|-------|--------|----------|----------------|----------|
| **Arbitrum Stylus** | ✅ Production | Rust/WASM | ERC-20 | High-performance computations |
| **Solana** | ✅ Production | Rust/Anchor | SPL Token | Ultra-fast transactions |
| **BNB Smart Chain** | ✅ NEW | Solidity | BEP-20 | Broad adoption, low fees |
| **opBNB** | ✅ NEW | Solidity | BEP-20 | L2 scaling, 100x lower gas |
| **Aptos** | ✅ NEW | Move | Fungible Asset | Sub-second finality |

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│            SPORT PERFORMANCE PROTOCOL                │
│              Multi-Chain Architecture v3.0           │
└─────────────────────────────────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │      NestJS Backend           │
        │  ┌─────────────────────────┐  │
        │  │  Cricket Scoring Engine │  │
        │  │  Health Sync (Wearables)│  │
        │  │  Commentary NLG         │  │
        │  └─────────────────────────┘  │
        │                               │
        │  ┌─────────────────────────┐  │
        │  │ Blockchain Abstraction  │  │
        │  │    Chain Registry       │  │
        │  └─────────────────────────┘  │
        └───────────────┬───────────────┘
                        │
        ┌───────────────┴───────────────┐
        │                               │
    ┌───▼───┐  ┌───────┐  ┌──────┐  ┌────────┐  ┌───────┐
    │Arbitrum│  │Solana │  │ BNB  │  │ opBNB  │  │ Aptos │
    │ Stylus │  │Mainnet│  │Chain │  │   L2   │  │Mainnet│
    └────────┘  └───────┘  └──────┘  └────────┘  └───────┘
```

## Repository Structure

```
SportPerformanceProtocol/
│
├── contracts/                      # Smart Contracts
│   ├── stylus/                    # ✅ Arbitrum Stylus (Rust/WASM)
│   ├── solana/                    # ✅ Solana (Rust/Anchor)
│   ├── bnb/                       # ✅ BNB Smart Chain (Solidity)
│   ├── opbnb/                     # ✅ opBNB L2 (Solidity)
│   └── aptos/                     # ✅ Aptos (Move)
│
├── sdk/                           # Validator SDKs
│   ├── types/                     # Shared TypeScript types
│   ├── arbitrum/                  # Arbitrum Validator SDK
│   ├── solana/                    # Solana Validator SDK
│   ├── bnb/                       # BNB Validator SDK
│   ├── opbnb/                     # opBNB Validator SDK
│   └── aptos/                     # Aptos Validator SDK
│
├── src/                           # NestJS Backend
│   ├── modules/
│   │   ├── blockchain/           # Multi-chain abstraction layer
│   │   │   ├── adapters/        # Chain-specific adapters
│   │   │   └── chain-registry.service.ts
│   │   ├── events/              # Cricket scoring engine
│   │   ├── wearables/           # Health sync module
│   │   └── commentary/          # NLG commentary
│   └── main.ts
│
├── docs/                         # Documentation
├── WHITEPAPER.md                # Protocol whitepaper
├── LICENSE                      # MIT & Apache 2.0
└── README.md                    # This file
```

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Rust 1.70+ (for Stylus contracts)
- Solidity 0.8.19+ (for BNB/opBNB contracts)
- Aptos CLI (for Aptos contracts)


### Deploying Smart Contracts

#### BNB Smart Chain

```bash
cd contracts/bnb
npm install
npx hardhat compile

# Deploy to testnet
npm run deploy:testnet

# Deploy to mainnet
npm run deploy:mainnet
```

#### opBNB

```bash
cd contracts/opbnb
npm install
npx hardhat compile
npm run deploy:testnet
```

#### Aptos

```bash
cd contracts/aptos
aptos move compile
aptos move publish --named-addresses spp_protocol=default
```

## Core Features

### 🏏 Cricket Scoring Engine

Real-time ball-by-ball scoring with automatic performance calculation:
- Run tracking and strike rates
- Bowling analysis (wickets, economy, maiden overs)
- Automatic tier assignment (Nifty Fifty, Gayle Storm, etc.)
- Partnership tracking

### 📱 Wearable Integration (Health Sync)

Connect athlete wearables for effort scoring:
- Apple HealthKit integration
- Google Fit support
- Heart rate, distance, calories burned
- Real-time performance metrics

### 🔥 Deflationary Tokenomics

Performance-based token burn and rewards:
- 8 reward tiers with different multipliers
- 10% burn rate on all rewards
- Effort score multiplier (from wearables)
- Cross-chain reward distribution

### 🎭 Dynamic Athlete NFTs

Computational NFTs that evolve with performance:
- Stats update from verified match data
- Leveling system based on achievements
- Cross-chain NFT support

### 🔐 Verifiable Data Points

On-chain proof-of-performance:
- Cryptographic match data hashing
- Oracle-verified performance recording
- Immutable match finalization
- Multi-signature validation

## Chain-Specific Details

### Arbitrum Stylus

**Advantages:**
- 75-85% gas reduction via WASM
- High-precision floating-point math in Rust
- Sub-second finality
- EVM-compatible

**Contracts:**
- `spp_token.rs` - ERC-20 token
- `performance_oracle.rs` - Match & performance data
- `deflatinary_burn.rs` - Burn engine
- `reward_tiers.rs` - Tier configuration
- `athlete_nft.rs` - Dynamic NFTs

**Documentation:** [contracts/stylus/README.md](contracts/stylus/README.md)

### BNB Smart Chain

**Advantages:**
- Low transaction fees (~$0.10)
- High throughput (300 TPS)
- Large user base
- BEP-20 standard

**Contracts:**
- `SPPToken.sol` - BEP-20 token with burn
- `PerformanceOracle.sol` - Match verification
- `DeflatinaryBurn.sol` - Reward distribution
- `RewardTiers.sol` - Configurable tiers

**Documentation:** [contracts/bnb/README.md](contracts/bnb/README.md)

### opBNB Layer 2

**Advantages:**
- 100x cheaper gas than BSC (~$0.001)
- 4,000+ TPS capacity
- 1-second block time
- Same Solidity contracts as BNB

**Use Case:** High-frequency operations (ball-by-ball scoring)

**Documentation:** [contracts/opbnb/README.md](contracts/opbnb/README.md)

### Aptos

**Advantages:**
- Sub-second finality (~500ms)
- Parallel execution engine
- Move language safety
- Fungible Asset standard

**Contracts:**
- `spp_token.move` - FA token
- `performance_oracle.move` - Match oracle
- `deflatinary_burn.move` - Burn mechanism
- `reward_tiers.move` - Tier config

**Documentation:** [contracts/aptos/README.md](contracts/aptos/README.md)

## Validator SDKs

All chains have dedicated TypeScript validator SDKs implementing a unified `IValidatorSDK` interface:

```typescript
import { BNBValidatorSDK } from '@spp/bnb-validator-sdk';

const sdk = new BNBValidatorSDK();
await sdk.initialize({
  rpcUrl: 'https://bsc-dataseed.binance.org/',
  privateKey: process.env.VALIDATOR_KEY,
  contractAddresses: {
    token: '0x...',
    oracle: '0x...',
    burnEngine: '0x...',
    rewardTiers: '0x...',
  },
});

// Register match
await sdk.registerMatch('MATCH_2026_001', 0); // 0 = Cricket

// Record performance
await sdk.recordCricketPerformance({
  matchId: 'MATCH_2026_001',
  player: '0x...',
  runs: 75,
  ballsFaced: 50,
  wickets: 2,
  oversBowled: 4,
  runsConceded: 28,
  maidenOvers: 1,
});
```

**SDK Documentation:**
- [BNB SDK](sdk/bnb/README.md)
- [opBNB SDK](sdk/opbnb/README.md)
- [Aptos SDK](sdk/aptos/README.md)
- [SDK Comparison](sdk/VALIDATOR_COMPARISON.md)

## Multi-Chain Strategy

### When to Use Each Chain

| Operation | Recommended Chain | Reason |
|-----------|------------------|--------|
| Ball-by-ball events | opBNB L2 | Ultra-low gas, high frequency |
| Match finalization | All chains | Immutable proof required |
| Token burns | BNB / opBNB | Cost-effective |
| NFT minting | Arbitrum Stylus | Complex computations |
| Wearable data | Backend only | Too frequent for blockchain |
| Historical queries | Any chain | Read operations are free |

### Failover Strategy

The `ChainRegistryService` provides automatic failover:

```typescript
// Primary: opBNB, Fallback: BNB, Tertiary: Arbitrum
await chainRegistry.registerChain(ChainType.OPBNB, configOpBNB);
await chainRegistry.registerChain(ChainType.BNB, configBNB);
await chainRegistry.registerChain(ChainType.ARBITRUM, configArbitrum);

// Automatically uses healthy chain
const adapter = await chainRegistry.getHealthyAdapter();
await adapter.registerMatch({ matchId: 'MATCH_001', sport: 0 });
```

## API Endpoints

### Match Management

```
POST   /api/matches              # Create new match
GET    /api/matches/:id          # Get match details
POST   /api/matches/:id/finalize # Finalize match
```

### Performance Tracking

```
POST   /api/performance          # Record performance
GET    /api/performance/:matchId/:player
POST   /api/cricket-scoring/ball # Record ball event
```

### Token Operations

```
POST   /api/tokens/burn          # Execute burn
GET    /api/tokens/balance/:address
GET    /api/tokens/stats         # Global stats
```

### Blockchain Operations

```
GET    /api/blockchain/chains    # Supported chains
GET    /api/blockchain/health    # Chain health status
POST   /api/blockchain/register  # Register match on-chain
```

## Testing

### Unit Tests

```bash
npm run test
```

### Integration Tests

```bash
npm run test:e2e
```

### Contract Tests

```bash
# BNB contracts
cd contracts/bnb
npx hardhat test

# Aptos contracts
cd contracts/aptos
aptos move test
```

## Security

- ✅ Webacy wallet risk screening integrated
- ✅ OpenZeppelin security patterns
- ✅ Multi-signature match finalization
- ✅ Rate limiting on API endpoints
- ✅ Input validation on all user data

## Gas Cost Comparison

| Operation | Arbitrum | BNB | opBNB | Aptos |
|-----------|----------|-----|-------|-------|
| Register Match | ~$0.05 | ~$0.10 | ~$0.001 | ~$0.003 |
| Record Performance | ~$0.08 | ~$0.15 | ~$0.002 | ~$0.005 |
| Execute Burn | ~$0.12 | ~$0.20 | ~$0.003 | ~$0.008 |
| NFT Mint | ~$0.15 | ~$0.25 | ~$0.004 | ~$0.010 |

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

This project is dual-licensed:
- [MIT License](LICENSE-MIT)
- [Apache 2.0 License](LICENSE-APACHE)

## Documentation

- [Multi-Chain Architecture](docs/ARCHITECTURE.md)
- [Validator Guide](docs/VALIDATOR_GUIDE.md)
- [Chain Integration Guide](docs/CHAIN_INTEGRATION.md)
- [API Reference](docs/API_REFERENCE.md)
- [Whitepaper](WHITEPAPER.md)

## Support

- GitHub Issues: [Issues](https://github.com/SportPerformanceProtocol/spp-protocol/issues)
- Discord: [Join Our Community](https://discord.gg/spp)
- Docs: [docs.sportperformanceprotocol.com](https://docs.sportperformanceprotocol.com)

## Roadmap

- [x] Arbitrum Stylus implementation
- [x] Solana integration
- [x] BNB Smart Chain deployment
- [x] opBNB L2 integration
- [x] Aptos Move contracts
- [x] Multi-chain validator SDKs
- [x] Chain registry with failover
- [ ] Polygon zkEVM integration (Q2 2026)
- [ ] Base L2 deployment (Q3 2026)
- [ ] Cross-chain bridge (Q4 2026)

---

Built with ❤️ by the Sport Performance Protocol team


SPP Oracle — Stylus-Native Trust Layer

This repository contains the Rust-based WASM implementation of the Sports Performance Protocol (SPP) Trust Layer, purpose-built for the Arbitrum Stylus execution environment.

Unlike traditional EVM-based oracles, the SPP Stylus Oracle leverages high-performance WASM computation to support complex, real-time Proof-of-Performance audits for sports and athlete data.

"Why" behind each language:

Technical Stack

Smart Contracts:[Rust](https://www.rust-lang.org/) (Arbitrum Stylus / WASM) — Chosen for sub-second verification speeds and 75%+ gas efficiency.

Oracle Middleware: [NestJS](https://nestjs.com/) / [TypeScript](https://www.typescriptlang.org/) — Ensures robust off-chain data ingestion and API security.

Client SDK: [TypeScript] — Facilitating "plug-and-play" integration for Arbitrum Orbit developers.


Technical Focus
🧠 Computational Identity (cNFTs)

We move beyond static metadata by introducing Computational NFTs (cNFTs). Athlete attributes are calculated natively in Rust using high-precision floating-point math—operations that are prohibitively expensive or impractical in Solidity.

⚡ WASM-Native Verification

Built with the stylus-sdk, the oracle performs:

Batch signature verification

Bitwise data processing

Real-time validation of sports performance events

All executed inside the Stylus WASM engine for maximum efficiency.

⛽ Gas Efficiency

By offloading heavy computation to WASM, the SPP Stylus Oracle targets a 75–85% reduction in gas costs for performance updates compared to standard EVM-only oracle implementations.

Project Architecture
🔐 Verification Engine

Core Rust logic responsible for validating signed performance packets sourced from:

IoT devices

Wearable APIs

Authorized data providers

📈 Dynamic Scoring Engine

On-chain athlete attribute leveling and scoring algorithms executed directly within the Stylus WASM runtime.

🔌 Developer API

A modular interface enabling other Arbitrum protocols to query verified sports data, including:

Fantasy Sports platforms

Sports Betting protocols

Scouting & Talent DAOs

