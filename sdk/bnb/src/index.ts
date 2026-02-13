/**
 * @spp/bnb-validator-sdk
 * BNB Smart Chain validator SDK for Sport Performance Protocol
 */

export { BNBValidatorSDK, BNBValidatorError } from './validator';

// Re-export types from @spp/types for convenience
export type {
  IValidatorSDK,
  ValidatorConfig,
  ChainInfo,
  TransactionResult,
  PerformanceParams,
  CricketPerformanceParams,
  BurnResult,
  MatchData,
  PerformanceData,
  Subscription,
  MatchEvent,
  BurnEvent,
  SportType,
  MatchStatus,
  RewardTier,
} from '@spp/types';
