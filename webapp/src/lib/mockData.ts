import { Match, Prediction, Participant } from './types';
import { initializeMatches, initializePredictions, saveParticipant } from './storage';

export const MOCK_MATCHES: Match[] = [
  {
    id: 'match-49',
    matchNumber: 49,
    round: 'Round of 16',
    team1Source: 'Winner Group A',
    team2Source: 'Runner-up Group B',
    team1Actual: undefined,
    team2Actual: undefined,
    matchDate: '2026-06-28T15:00:00-04:00',
    predictionDeadline: '2099-12-31T23:59:00-05:00',
    status: 'teams_pending',
    manualLocked: false,
  },
  {
    id: 'match-50',
    matchNumber: 50,
    round: 'Round of 16',
    team1Source: 'Best 3rd C/D/E/F',
    team2Source: 'Winner Group C',
    team1Actual: undefined,
    team2Actual: undefined,
    matchDate: '2026-06-28T19:00:00-04:00',
    predictionDeadline: '2099-12-31T23:59:00-05:00',
    status: 'teams_pending',
    manualLocked: false,
  },
  {
    id: 'match-51',
    matchNumber: 51,
    round: 'Round of 16',
    team1Source: 'Winner Group D',
    team2Source: 'Runner-up Group E',
    team1Actual: 'Spain',
    team2Actual: 'Germany',
    matchDate: '2026-07-10T15:00:00-04:00',
    predictionDeadline: '2099-12-31T23:59:00-05:00',
    status: 'open',
    manualLocked: false,
  },
  {
    id: 'match-52',
    matchNumber: 52,
    round: 'Round of 16',
    team1Source: 'Winner Group E',
    team2Source: 'Runner-up Group F',
    team1Actual: 'Brazil',
    team2Actual: 'England',
    matchDate: '2026-07-11T15:00:00-04:00',
    predictionDeadline: '2099-12-31T23:59:00-05:00',
    status: 'open',
    manualLocked: false,
  },
  {
    id: 'match-53',
    matchNumber: 53,
    round: 'Quarter-final',
    team1Source: 'Winner Match 49',
    team2Source: 'Winner Match 51',
    team1Actual: 'Portugal',
    team2Actual: 'Morocco',
    matchDate: '2026-07-03T15:00:00-04:00',
    predictionDeadline: '2026-06-01T23:59:00-05:00',
    status: 'locked',
    manualLocked: false,
  },
  {
    id: 'match-54',
    matchNumber: 54,
    round: 'Quarter-final',
    team1Source: 'Winner Match 50',
    team2Source: 'Winner Match 52',
    team1Actual: 'Argentina',
    team2Actual: 'France',
    matchDate: '2026-07-04T15:00:00-04:00',
    predictionDeadline: '2026-06-01T23:59:00-05:00',
    status: 'completed',
    manualLocked: false,
    team1Score: 2,
    team2Score: 1,
    winner: 'Argentina',
    method: 'regulation',
  },
  {
    id: 'match-55',
    matchNumber: 55,
    round: 'Semi-final',
    team1Source: 'Winner Match 53',
    team2Source: 'Winner Match 54',
    team1Actual: undefined,
    team2Actual: undefined,
    matchDate: '2026-07-14T19:00:00-04:00',
    predictionDeadline: '2099-12-31T23:59:00-05:00',
    status: 'teams_pending',
    manualLocked: false,
  },
  {
    id: 'match-64',
    matchNumber: 64,
    round: 'Final',
    team1Source: 'Winner Semi-final 1',
    team2Source: 'Winner Semi-final 2',
    team1Actual: undefined,
    team2Actual: undefined,
    matchDate: '2026-07-19T15:00:00-04:00',
    predictionDeadline: '2099-12-31T23:59:00-05:00',
    status: 'teams_pending',
    manualLocked: false,
  },
];

const SAMPLE_PARTICIPANT_1: Participant = {
  id: 'participant-demo-1',
  fullName: 'Carlos Mendoza',
  displayName: 'CarlosM',
  email: 'carlos@example.com',
  city: 'Buenos Aires',
  country: 'Argentina',
  favoriteTeam: 'Argentina',
  createdAt: '2026-05-01T10:00:00.000Z',
};

const SAMPLE_PARTICIPANT_2: Participant = {
  id: 'participant-demo-2',
  fullName: 'Sophie Lambert',
  displayName: 'SophieL',
  email: 'sophie@example.com',
  city: 'Paris',
  country: 'France',
  favoriteTeam: 'France',
  createdAt: '2026-05-02T09:00:00.000Z',
};

const SAMPLE_PARTICIPANT_3: Participant = {
  id: 'participant-demo-3',
  fullName: 'Marcus Johnson',
  displayName: 'MarcusJ',
  email: 'marcus@example.com',
  city: 'London',
  country: 'England',
  favoriteTeam: 'England',
  createdAt: '2026-05-03T11:00:00.000Z',
};

// Completed match: Argentina 2-1 France (regulation)
// Participant 1: Predicted Argentina 2-1 (regulation) — winner(3)+goalDiff(1)+exactScore(3)+method(1) = 8
// Participant 2: Predicted France 1-2 — wrong winner = 0
// Participant 3: Predicted Argentina 1-0 (regulation) — winner(3)+goalDiff(1)+method(1) = 5

export const SAMPLE_PREDICTIONS: Prediction[] = [
  {
    id: 'pred-demo-1',
    participantId: 'participant-demo-1',
    matchId: 'match-54',
    team1ScorePredicted: 2,
    team2ScorePredicted: 1,
    winnerPredicted: 'Argentina',
    methodPredicted: 'regulation',
    pointsAwarded: 8,
    correctWinner: true,
    exactScore: true,
    correctGoalDifference: true,
    correctMethod: true,
    submittedAt: '2026-05-20T14:00:00.000Z',
    updatedAt: '2026-05-20T14:00:00.000Z',
  },
  {
    id: 'pred-demo-2',
    participantId: 'participant-demo-2',
    matchId: 'match-54',
    team1ScorePredicted: 1,
    team2ScorePredicted: 2,
    winnerPredicted: 'France',
    methodPredicted: 'regulation',
    pointsAwarded: 0,
    correctWinner: false,
    exactScore: false,
    correctGoalDifference: false,
    correctMethod: false,
    submittedAt: '2026-05-20T15:00:00.000Z',
    updatedAt: '2026-05-20T15:00:00.000Z',
  },
  {
    id: 'pred-demo-3',
    participantId: 'participant-demo-3',
    matchId: 'match-54',
    team1ScorePredicted: 1,
    team2ScorePredicted: 0,
    winnerPredicted: 'Argentina',
    methodPredicted: 'regulation',
    pointsAwarded: 5,
    correctWinner: true,
    exactScore: false,
    correctGoalDifference: true,
    correctMethod: true,
    submittedAt: '2026-05-21T08:00:00.000Z',
    updatedAt: '2026-05-21T08:00:00.000Z',
  },
  // Open match predictions for match-51 (Spain vs Germany)
  {
    id: 'pred-demo-4',
    participantId: 'participant-demo-1',
    matchId: 'match-51',
    team1ScorePredicted: 2,
    team2ScorePredicted: 1,
    winnerPredicted: 'Spain',
    methodPredicted: 'regulation',
    submittedAt: '2026-05-22T10:00:00.000Z',
    updatedAt: '2026-05-22T10:00:00.000Z',
  },
  {
    id: 'pred-demo-5',
    participantId: 'participant-demo-3',
    matchId: 'match-52',
    team1ScorePredicted: 1,
    team2ScorePredicted: 2,
    winnerPredicted: 'England',
    methodPredicted: 'regulation',
    submittedAt: '2026-05-22T11:00:00.000Z',
    updatedAt: '2026-05-22T11:00:00.000Z',
  },
];

export function initializeMockData(): void {
  initializeMatches(MOCK_MATCHES);
  initializePredictions(SAMPLE_PREDICTIONS);

  // Seed demo participants (won't duplicate since saveParticipant upserts by id)
  const existingRaw = localStorage.getItem('barefoot_participants');
  const existing: Participant[] = existingRaw ? JSON.parse(existingRaw) : [];
  const existingIds = new Set(existing.map((p) => p.id));

  if (!existingIds.has(SAMPLE_PARTICIPANT_1.id)) {
    saveParticipant(SAMPLE_PARTICIPANT_1);
  }
  if (!existingIds.has(SAMPLE_PARTICIPANT_2.id)) {
    saveParticipant(SAMPLE_PARTICIPANT_2);
  }
  if (!existingIds.has(SAMPLE_PARTICIPANT_3.id)) {
    saveParticipant(SAMPLE_PARTICIPANT_3);
  }
}
