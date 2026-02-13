/**
 * Performance-related types for multi-chain protocol
 */

export enum RewardTier {
  NIFTY_FIFTY = 0,
  GAYLE_STORM = 1,
  FIVE_WICKET_HAUL = 2,
  HAT_TRICK = 3,
  MAIDEN_MASTER = 4,
  RUN_MACHINE = 5,
  GOLDEN_ARM = 6,
  ALL_ROUNDER = 7,
}

export interface PerformanceParams {
  matchId: string;
  player: string;
  performanceScore: number;
  effortScore: number;
  rewardTier: RewardTier;
}

export interface CricketPerformanceParams {
  matchId: string;
  player: string;
  runs: number;
  ballsFaced: number;
  wickets: number;
  oversBowled: number;
  runsConceded: number;
  maidenOvers: number;
}

export interface PerformanceData {
  matchId: string;
  player: string;
  performanceScore: number;
  effortScore: number;
  rewardTier: RewardTier;
  timestamp: number;
  verified: boolean;
}

export interface CricketPerformanceData extends PerformanceData {
  runs: number;
  ballsFaced: number;
  wickets: number;
  oversBowled: number;
  runsConceded: number;
  maidenOvers: number;
  strikeRate: number;
  economy: number;
}
