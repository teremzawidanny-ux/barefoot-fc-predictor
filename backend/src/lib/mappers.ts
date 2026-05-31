// DB row types (what Supabase returns)
export interface DbParticipant {
  id: string;
  full_name: string;
  display_name: string;
  email: string;
  password_hash: string | null;
  phone: string | null;
  city: string | null;
  country: string | null;
  favorite_team: string | null;
  created_at: string;
}

export interface DbMatch {
  id: string;
  match_number: number;
  round: string;
  team1_source: string;
  team2_source: string;
  team1_actual: string | null;
  team2_actual: string | null;
  match_date: string;
  prediction_deadline: string;
  status: string;
  manual_locked: boolean;
  team1_score: number | null;
  team2_score: number | null;
  winner: string | null;
  method: string | null;
  group_name: string | null;
}

export interface DbPrediction {
  id: string;
  participant_id: string;
  match_id: string;
  team1_score_predicted: number;
  team2_score_predicted: number;
  winner_predicted: string;
  method_predicted: string;
  points_awarded: number | null;
  correct_winner: boolean | null;
  exact_score: boolean | null;
  correct_goal_difference: boolean | null;
  correct_method: boolean | null;
  submitted_at: string;
  updated_at: string;
}

export function mapParticipant(row: DbParticipant) {
  return {
    id: row.id,
    fullName: row.full_name,
    displayName: row.display_name,
    email: row.email,
    phone: row.phone ?? undefined,
    city: row.city ?? undefined,
    country: row.country ?? undefined,
    favoriteTeam: row.favorite_team ?? undefined,
    createdAt: row.created_at,
  };
}

export function mapMatch(row: DbMatch) {
  return {
    id: row.id,
    matchNumber: row.match_number,
    round: row.round as any,
    team1Source: row.team1_source,
    team2Source: row.team2_source,
    team1Actual: row.team1_actual ?? undefined,
    team2Actual: row.team2_actual ?? undefined,
    matchDate: row.match_date,
    predictionDeadline: row.prediction_deadline,
    status: row.status as any,
    manualLocked: row.manual_locked,
    team1Score: row.team1_score ?? undefined,
    team2Score: row.team2_score ?? undefined,
    winner: row.winner ?? undefined,
    method: row.method as any ?? undefined,
    groupName: row.group_name ?? undefined,
  };
}

export function mapPrediction(row: DbPrediction) {
  return {
    id: row.id,
    participantId: row.participant_id,
    matchId: row.match_id,
    team1ScorePredicted: row.team1_score_predicted,
    team2ScorePredicted: row.team2_score_predicted,
    winnerPredicted: row.winner_predicted,
    methodPredicted: row.method_predicted as any,
    pointsAwarded: row.points_awarded ?? undefined,
    correctWinner: row.correct_winner ?? undefined,
    exactScore: row.exact_score ?? undefined,
    correctGoalDifference: row.correct_goal_difference ?? undefined,
    correctMethod: row.correct_method ?? undefined,
    submittedAt: row.submitted_at,
    updatedAt: row.updated_at,
  };
}
