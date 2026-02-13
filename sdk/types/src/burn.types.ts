/**
 * Burn and reward types for multi-chain protocol
 */

import { RewardTier } from './performance.types';

export interface BurnResult {
  txHash: string;
  burnAmount: bigint;
  rewardAmount: bigint;
  tier: RewardTier;
  player: string;
  matchId: string;
  timestamp: number;
}

export interface BurnEvent {
  type: 'burn_executed' | 'reward_claimed';
  matchId: string;
  player: string;
  amount: bigint;
  timestamp: number;
  blockNumber: number;
  txHash: string;
}

export interface TierConfig {
  tier: RewardTier;
  multiplier: number;
  baseReward: bigint;
  minimumScore: number;
}

export interface BurnStats {
  totalBurned: bigint;
  totalRewards: bigint;
  burnRate: number;
  playerCount: number;
}
