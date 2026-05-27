import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { supabase } from '../lib/supabase';
import { requireAuth } from '../middleware/auth';
import { mapPrediction } from '../lib/mappers';
import type { DbPrediction, DbMatch } from '../lib/mappers';
import { isGroupStage } from '../lib/rounds';

const predictionsRouter = new Hono();

const predictionSchema = z.object({
  matchId: z.string().uuid(),
  team1ScorePredicted: z.number().int().min(0),
  team2ScorePredicted: z.number().int().min(0),
  winnerPredicted: z.string().min(1),
  methodPredicted: z.enum(['regulation', 'extra_time', 'penalties']),
});

type EligibilityError = { error: string; status: number };
type EligibilitySuccess = { match: DbMatch };

async function validatePredictionEligibility(
  matchId: string,
  winnerPredicted: string
): Promise<EligibilityError | EligibilitySuccess> {
  const { data: match } = await supabase
    .from('matches')
    .select('*')
    .eq('id', matchId)
    .single<DbMatch>();
  if (!match) return { error: 'Match not found', status: 404 };
  if (match.status === 'completed') return { error: 'Match is already completed', status: 409 };
  if (match.manual_locked) return { error: 'Match is locked by admin', status: 409 };
  if (!match.team1_actual || !match.team2_actual)
    return { error: 'Teams are not yet confirmed for this match', status: 409 };
  // Server-side deadline check
  if (new Date() >= new Date(match.prediction_deadline))
    return { error: 'Prediction deadline has passed', status: 409 };
  // Winner validation: allow "Draw" for group stage
  if (isGroupStage(match.round)) {
    if (winnerPredicted !== match.team1_actual && winnerPredicted !== match.team2_actual && winnerPredicted !== 'Draw') {
      return {
        error: `Winner must be "${match.team1_actual}", "${match.team2_actual}", or "Draw"`,
        status: 422,
      };
    }
  } else {
    if (winnerPredicted !== match.team1_actual && winnerPredicted !== match.team2_actual) {
      return {
        error: `Winner must be "${match.team1_actual}" or "${match.team2_actual}"`,
        status: 422,
      };
    }
  }
  return { match };
}

predictionsRouter.get('/mine', requireAuth, async (c) => {
  const participantId = c.get('participantId');
  const { data, error } = await supabase
    .from('predictions')
    .select('*')
    .eq('participant_id', participantId);

  if (error) return c.json({ error: { message: 'Failed to load predictions' } }, 500);
  return c.json({ data: (data as DbPrediction[]).map(mapPrediction) });
});

predictionsRouter.post('/', requireAuth, zValidator('json', predictionSchema), async (c) => {
  const participantId = c.get('participantId');
  const body = c.req.valid('json');

  const result = await validatePredictionEligibility(body.matchId, body.winnerPredicted);
  if ('error' in result)
    return c.json({ error: { message: result.error } }, result.status as 404 | 409 | 422);

  const matched = result.match;
  const tied = body.team1ScorePredicted === body.team2ScorePredicted;

  if (isGroupStage(matched.round)) {
    if (body.methodPredicted !== 'regulation') {
      return c.json({ error: { message: 'Group stage matches are decided in regulation only' } }, 422);
    }
    if (tied && body.winnerPredicted !== 'Draw') {
      return c.json({ error: { message: 'Tied group stage scores must predict a Draw' } }, 422);
    }
    if (!tied) {
      const expectedWinner =
        body.team1ScorePredicted > body.team2ScorePredicted ? matched.team1_actual : matched.team2_actual;
      if (body.winnerPredicted !== expectedWinner) {
        return c.json({ error: { message: `With this score, winner must be "${expectedWinner}"` } }, 422);
      }
    }
  } else {
    if (body.winnerPredicted === 'Draw') {
      return c.json({ error: { message: 'Knockout matches must have a winner' } }, 422);
    }
    if (tied && body.methodPredicted !== 'penalties') {
      return c.json({ error: { message: 'Tied knockout scores must be decided by penalties' } }, 422);
    }
    if (!tied && body.methodPredicted === 'penalties') {
      return c.json({ error: { message: 'Penalties only applies when scores are tied' } }, 422);
    }
    if (!tied) {
      const expectedWinner =
        body.team1ScorePredicted > body.team2ScorePredicted ? matched.team1_actual : matched.team2_actual;
      if (body.winnerPredicted !== expectedWinner) {
        return c.json({ error: { message: `With this score, winner must be "${expectedWinner}"` } }, 422);
      }
    }
  }

  const { data: prediction, error } = await supabase
    .from('predictions')
    .insert({
      participant_id: participantId,
      match_id: body.matchId,
      team1_score_predicted: body.team1ScorePredicted,
      team2_score_predicted: body.team2ScorePredicted,
      winner_predicted: body.winnerPredicted,
      method_predicted: body.methodPredicted,
      submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single<DbPrediction>();

  if (error) {
    if (error.code === '23505') {
      return c.json(
        { error: { message: 'Prediction already exists. Use PUT to update.', code: 'DUPLICATE' } },
        409
      );
    }
    return c.json({ error: { message: 'Failed to save prediction' } }, 500);
  }

  return c.json({ data: mapPrediction(prediction!) }, 201);
});

predictionsRouter.put('/:id', requireAuth, zValidator('json', predictionSchema), async (c) => {
  const participantId = c.get('participantId');
  const predictionId = c.req.param('id');
  const body = c.req.valid('json');

  // Verify ownership
  const { data: existing } = await supabase
    .from('predictions')
    .select('participant_id')
    .eq('id', predictionId)
    .single();
  if (!existing) return c.json({ error: { message: 'Prediction not found' } }, 404);
  if (existing.participant_id !== participantId)
    return c.json({ error: { message: 'Forbidden' } }, 403);

  const result = await validatePredictionEligibility(body.matchId, body.winnerPredicted);
  if ('error' in result)
    return c.json({ error: { message: result.error } }, result.status as 404 | 409 | 422);

  const matched = result.match;
  const tied = body.team1ScorePredicted === body.team2ScorePredicted;

  if (isGroupStage(matched.round)) {
    if (body.methodPredicted !== 'regulation') {
      return c.json({ error: { message: 'Group stage matches are decided in regulation only' } }, 422);
    }
    if (tied && body.winnerPredicted !== 'Draw') {
      return c.json({ error: { message: 'Tied group stage scores must predict a Draw' } }, 422);
    }
    if (!tied) {
      const expectedWinner =
        body.team1ScorePredicted > body.team2ScorePredicted ? matched.team1_actual : matched.team2_actual;
      if (body.winnerPredicted !== expectedWinner) {
        return c.json({ error: { message: `With this score, winner must be "${expectedWinner}"` } }, 422);
      }
    }
  } else {
    if (body.winnerPredicted === 'Draw') {
      return c.json({ error: { message: 'Knockout matches must have a winner' } }, 422);
    }
    if (tied && body.methodPredicted !== 'penalties') {
      return c.json({ error: { message: 'Tied knockout scores must be decided by penalties' } }, 422);
    }
    if (!tied && body.methodPredicted === 'penalties') {
      return c.json({ error: { message: 'Penalties only applies when scores are tied' } }, 422);
    }
    if (!tied) {
      const expectedWinner =
        body.team1ScorePredicted > body.team2ScorePredicted ? matched.team1_actual : matched.team2_actual;
      if (body.winnerPredicted !== expectedWinner) {
        return c.json({ error: { message: `With this score, winner must be "${expectedWinner}"` } }, 422);
      }
    }
  }

  const { data: updated, error } = await supabase
    .from('predictions')
    .update({
      team1_score_predicted: body.team1ScorePredicted,
      team2_score_predicted: body.team2ScorePredicted,
      winner_predicted: body.winnerPredicted,
      method_predicted: body.methodPredicted,
      updated_at: new Date().toISOString(),
    })
    .eq('id', predictionId)
    .select()
    .single<DbPrediction>();

  if (error) return c.json({ error: { message: 'Failed to update prediction' } }, 500);
  return c.json({ data: mapPrediction(updated!) });
});

export { predictionsRouter };
