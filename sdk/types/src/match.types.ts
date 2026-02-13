/**
 * Match-related types for multi-chain protocol
 */

export enum SportType {
  CRICKET = 0,
  FOOTBALL = 1,
  BASKETBALL = 2,
  TENNIS = 3,
}

export enum MatchStatus {
  REGISTERED = 0,
  IN_PROGRESS = 1,
  FINALIZED = 2,
  CANCELLED = 3,
}

export interface MatchData {
  matchId: string;
  sport: SportType;
  status: MatchStatus;
  winner?: number;
  dataHash?: string;
  playerCount: number;
  registeredAt: number;
  finalizedAt?: number;
}

export interface MatchEvent {
  type: 'registered' | 'finalized' | 'cancelled';
  matchId: string;
  timestamp: number;
  blockNumber: number;
  txHash: string;
  data: Record<string, any>;
}
