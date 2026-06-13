import { Hono } from 'hono';
import { supabase } from '../lib/supabase';

const leaderboardRouter = new Hono();

leaderboardRouter.get('/', async (c) => {
  const { data: participants, error: pError } = await supabase
    .from('participants')
    .select('id, display_name');

  if (pError || !participants) {
    return c.json({ error: { message: 'Failed to load leaderboard' } }, 500);
  }

  const allPredictions: any[] = [];
  let from = 0;
  const pageSize = 1000;
  while (true) {
    const { data: page } = await supabase
      .from('predictions')
      .select('participant_id, points_awarded, correct_winner, exact_score, correct_goal_difference, correct_method')
      .range(from, from + pageSize - 1);
    if (!page || page.length === 0) break;
    allPredictions.push(...page);
    if (page.length < pageSize) break;
    from += pageSize;
  }
  const predictions = allPredictions;

  type LeaderboardEntry = {
    participantId: string;
    displayName: string;
    totalPoints: number;
    correctWinners: number;
    exactScores: number;
    goalDifferenceBonuses: number;
    methodBonuses: number;
    predictionsCount: number;
  };

  const map = new Map<string, LeaderboardEntry>();

  for (const p of participants) {
    map.set(p.id, {
      participantId: p.id,
      displayName: p.display_name,
      totalPoints: 0,
      correctWinners: 0,
      exactScores: 0,
      goalDifferenceBonuses: 0,
      methodBonuses: 0,
      predictionsCount: 0,
    });
  }

  for (const pred of predictions ?? []) {
    const entry = map.get(pred.participant_id);
    if (!entry) continue;
    entry.predictionsCount += 1;
    entry.totalPoints += pred.points_awarded ?? 0;
    if (pred.correct_winner) entry.correctWinners += 1;
    if (pred.exact_score) entry.exactScores += 1;
    if (pred.correct_goal_difference) entry.goalDifferenceBonuses += 1;
    if (pred.correct_method && pred.correct_winner) entry.methodBonuses += 1;
  }

  const entries = Array.from(map.values()).sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    if (b.exactScores !== a.exactScores) return b.exactScores - a.exactScores;
    if (b.correctWinners !== a.correctWinners) return b.correctWinners - a.correctWinners;
    return a.displayName.localeCompare(b.displayName);
  });

  return c.json({ data: entries });
});

export { leaderboardRouter };
