import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { supabase } from '../lib/supabase';
import { requireAdmin } from '../middleware/auth';
import { mapMatch } from '../lib/mappers';
import type { DbMatch, DbPrediction } from '../lib/mappers';
import { scorePredicton } from '../lib/scoring';
import { isGroupStage } from '../lib/rounds';

const adminRouter = new Hono();

// All admin routes require admin auth
adminRouter.use('*', requireAdmin);

const updateMatchSchema = z.object({
  team1Actual: z.string().optional(),
  team2Actual: z.string().optional(),
  matchDate: z.string().optional(),
  predictionDeadline: z.string().optional(),
  status: z.enum(['teams_pending', 'open', 'locked', 'completed']).optional(),
  manualLocked: z.boolean().optional(),
  team1Score: z.number().int().min(0).optional().nullable(),
  team2Score: z.number().int().min(0).optional().nullable(),
  winner: z.string().optional().nullable(),
  method: z.enum(['regulation', 'extra_time', 'penalties']).optional().nullable(),
});

adminRouter.get('/matches', async (c) => {
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .order('match_number');
  if (error) return c.json({ error: { message: 'Failed to load matches' } }, 500);
  return c.json({ data: (data as DbMatch[]).map(mapMatch) });
});

adminRouter.put('/matches/:id', zValidator('json', updateMatchSchema), async (c) => {
  const matchId = c.req.param('id');
  const body = c.req.valid('json');

  // Round-aware result validation when marking as completed
  if (body.status === 'completed' && body.team1Score !== undefined && body.team2Score !== undefined && body.winner && body.method) {
    const { data: currentMatch } = await supabase.from('matches').select('round').eq('id', matchId).single();
    if (currentMatch) {
      const tied = body.team1Score === body.team2Score;
      if (isGroupStage(currentMatch.round)) {
        if (body.method !== 'regulation') {
          return c.json({ error: { message: 'Group stage matches are decided in regulation only' } }, 422);
        }
        if (tied && body.winner !== 'Draw') {
          return c.json({ error: { message: 'Tied group stage scores must have Draw as winner' } }, 422);
        }
      } else {
        if (body.winner === 'Draw') {
          return c.json({ error: { message: 'Knockout matches cannot end in a Draw' } }, 422);
        }
        if (tied && body.method !== 'penalties') {
          return c.json({ error: { message: 'Tied knockout scores must be decided by penalties' } }, 422);
        }
        if (!tied && body.method === 'penalties') {
          return c.json({ error: { message: 'Penalties only when scores are tied' } }, 422);
        }
      }
    }
  }

  // Build update object (only include defined fields)
  const update: Record<string, unknown> = {};
  if (body.team1Actual !== undefined) update.team1_actual = body.team1Actual || null;
  if (body.team2Actual !== undefined) update.team2_actual = body.team2Actual || null;
  if (body.matchDate !== undefined) update.match_date = body.matchDate;
  if (body.predictionDeadline !== undefined) update.prediction_deadline = body.predictionDeadline;
  if (body.status !== undefined) update.status = body.status;
  if (body.manualLocked !== undefined) update.manual_locked = body.manualLocked;
  if (body.team1Score !== undefined) update.team1_score = body.team1Score;
  if (body.team2Score !== undefined) update.team2_score = body.team2Score;
  if (body.winner !== undefined) update.winner = body.winner || null;
  if (body.method !== undefined) update.method = body.method || null;

  const { data: match, error } = await supabase
    .from('matches')
    .update(update)
    .eq('id', matchId)
    .select()
    .single<DbMatch>();

  if (error || !match) return c.json({ error: { message: 'Failed to update match' } }, 500);

  // Auto-recalculate if result is complete and match is completed
  if (
    match.status === 'completed' &&
    match.team1_score !== null &&
    match.team2_score !== null &&
    match.winner &&
    match.method
  ) {
    await recalculateForMatch(match);
  }

  return c.json({ data: mapMatch(match) });
});

async function recalculateForMatch(match: DbMatch): Promise<void> {
  if (
    match.team1_score === null ||
    match.team2_score === null ||
    !match.winner ||
    !match.method
  ) {
    return;
  }

  const { data: predictions } = await supabase
    .from('predictions')
    .select('*')
    .eq('match_id', match.id);

  if (!predictions) return;

  for (const pred of predictions as DbPrediction[]) {
    const scored = scorePredicton(
      {
        team1_score_predicted: pred.team1_score_predicted,
        team2_score_predicted: pred.team2_score_predicted,
        winner_predicted: pred.winner_predicted,
        method_predicted: pred.method_predicted as 'regulation' | 'extra_time' | 'penalties',
      },
      {
        team1_score: match.team1_score!,
        team2_score: match.team2_score!,
        winner: match.winner!,
        method: match.method as 'regulation' | 'extra_time' | 'penalties',
      }
    );
    await supabase
      .from('predictions')
      .update({
        points_awarded: scored.points_awarded,
        correct_winner: scored.correct_winner,
        exact_score: scored.exact_score,
        correct_goal_difference: scored.correct_goal_difference,
        correct_method: scored.correct_method,
      })
      .eq('id', pred.id);
  }
}

adminRouter.post('/recalculate', async (c) => {
  const { data: completedMatches, error } = await supabase
    .from('matches')
    .select('*')
    .eq('status', 'completed');

  if (error || !completedMatches) {
    return c.json({ error: { message: 'Failed to load matches' } }, 500);
  }

  let total = 0;
  for (const match of completedMatches as DbMatch[]) {
    await recalculateForMatch(match);
    total++;
  }

  return c.json({ data: { recalculated: total } });
});

adminRouter.post('/recalculate/:matchId', async (c) => {
  const matchId = c.req.param('matchId');
  const { data: match, error } = await supabase
    .from('matches')
    .select('*')
    .eq('id', matchId)
    .single<DbMatch>();

  if (error || !match) return c.json({ error: { message: 'Match not found' } }, 404);
  if (match.status !== 'completed')
    return c.json({ error: { message: 'Match is not completed' } }, 409);

  await recalculateForMatch(match);
  return c.json({ data: { ok: true } });
});

export { adminRouter };
