/**
 * @spp/opbnb-validator-sdk
 * opBNB Layer 2 validator SDK for Sport Performance Protocol
 */

export { OpBNBValidatorSDK, OpBNBValidator } from './validator';

// Re-export BNB validator error codes (compatible with opBNB)
export { BNBValidatorError as OpBNBValidatorError } from '@spp/bnb-validator-sdk';

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
