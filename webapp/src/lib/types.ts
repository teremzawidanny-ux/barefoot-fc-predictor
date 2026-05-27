export type MatchStatus = 'teams_pending' | 'open' | 'locked' | 'completed';
export type MatchMethod = 'regulation' | 'extra_time' | 'penalties';
export type MatchRound = 'Group Stage' | 'Round of 32' | 'Round of 16' | 'Quarter-final' | 'Semi-final' | 'Third Place' | 'Final';

export interface Participant {
  id: string;
  fullName: string;
  displayName: string;
  email: string;
  phone?: string;
  city?: string;
  country?: string;
  favoriteTeam?: string;
  createdAt: string;
}

export interface Match {
  id: string;
  matchNumber: number;
  round: MatchRound;
  team1Source: string;
  team2Source: string;
  team1Actual?: string;
  team2Actual?: string;
  matchDate: string;
  predictionDeadline: string;
  status: MatchStatus;
  manualLocked: boolean;
  team1Score?: number;
  team2Score?: number;
  winner?: string;
  method?: MatchMethod;
  groupName?: string;
}

export interface Prediction {
  id: string;
  participantId: string;
  matchId: string;
  team1ScorePredicted: number;
  team2ScorePredicted: number;
  winnerPredicted: string;
  methodPredicted: MatchMethod;
  pointsAwarded?: number;
  correctWinner?: boolean;
  exactScore?: boolean;
  correctGoalDifference?: boolean;
  correctMethod?: boolean;
  submittedAt: string;
  updatedAt: string;
}

export interface LeaderboardEntry {
  participantId: string;
  displayName: string;
  totalPoints: number;
  correctWinners: number;
  exactScores: number;
  goalDifferenceBonuses: number;
  methodBonuses: number;
  predictionsCount: number;
}
