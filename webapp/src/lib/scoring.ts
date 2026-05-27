import { Match, Prediction } from './types';

export function getMatchStatus(match: Match, now: Date): Match['status'] {
  if (match.status === 'completed') return 'completed';
  if (match.manualLocked) return 'locked';
  if (!match.team1Actual || !match.team2Actual) return 'teams_pending';
  if (now >= new Date(match.predictionDeadline)) return 'locked';
  return 'open';
}

export function calculateMatchPredictionScore(prediction: Prediction, match: Match): Prediction {
  if (
    match.team1Score === undefined ||
    match.team2Score === undefined ||
    !match.winner ||
    !match.method
  ) {
    return prediction;
  }

  const correctWinner = prediction.winnerPredicted === match.winner;

  if (!correctWinner) {
    return {
      ...prediction,
      correctWinner: false,
      exactScore: false,
      correctGoalDifference: false,
      correctMethod: false,
      pointsAwarded: 0,
    };
  }

  let points = 3; // base for correct winner

  const exactScore =
    prediction.team1ScorePredicted === match.team1Score &&
    prediction.team2ScorePredicted === match.team2Score;

  const correctGoalDifference =
    Math.abs(prediction.team1ScorePredicted - prediction.team2ScorePredicted) ===
    Math.abs(match.team1Score - match.team2Score);

  const correctMethod = prediction.methodPredicted === match.method;

  // Goal difference bonus always applies when winner is correct and goal diffs match
  // (this includes exact scores — exact score implies correct goal difference)
  if (correctGoalDifference) {
    points += 1;
  }

  if (exactScore) {
    points += 3;
  }

  if (correctMethod) {
    points += 1;
  }

  return {
    ...prediction,
    correctWinner: true,
    exactScore,
    correctGoalDifference,
    correctMethod,
    pointsAwarded: points,
  };
}
