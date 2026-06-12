export type MatchMethod = 'regulation' | 'extra_time' | 'penalties';

export interface MatchRow {
  team1_score: number;
  team2_score: number;
  winner: string;
  method: MatchMethod;
}

export interface PredictionScoringInput {
  team1_score_predicted: number;
  team2_score_predicted: number;
  winner_predicted: string;
  method_predicted: MatchMethod;
}

export interface ScoringResult {
  points_awarded: number;
  correct_winner: boolean;
  exact_score: boolean;
  correct_goal_difference: boolean;
  correct_method: boolean;
}

export function scorePredicton(pred: PredictionScoringInput, match: MatchRow): ScoringResult {
  const correctWinner = pred.winner_predicted.trim().toLowerCase() === match.winner.trim().toLowerCase();
  if (!correctWinner) {
    return {
      points_awarded: 0,
      correct_winner: false,
      exact_score: false,
      correct_goal_difference: false,
      correct_method: false,
    };
  }
  let points = 3;
  const exactScore =
    pred.team1_score_predicted === match.team1_score &&
    pred.team2_score_predicted === match.team2_score;
  const correctGoalDifference =
    Math.abs(pred.team1_score_predicted - pred.team2_score_predicted) ===
    Math.abs(match.team1_score - match.team2_score);
  const correctMethod = pred.method_predicted.trim().toLowerCase() === match.method.trim().toLowerCase();
  if (correctGoalDifference) points += 1;
  if (exactScore) points += 3;
  if (correctMethod) points += 1;
  return {
    points_awarded: points,
    correct_winner: true,
    exact_score: exactScore,
    correct_goal_difference: correctGoalDifference,
    correct_method: correctMethod,
  };
}
