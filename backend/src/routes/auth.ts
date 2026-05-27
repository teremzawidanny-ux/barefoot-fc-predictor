import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { supabase } from '../lib/supabase';
import { signToken, isAdminEmail } from '../lib/jwt';
import { requireAuth } from '../middleware/auth';
import { mapParticipant } from '../lib/mappers';
import type { DbParticipant } from '../lib/mappers';

const authRouter = new Hono();

const joinSchema = z.object({
  fullName: z.string().min(2),
  displayName: z.string().min(2).max(20),
  email: z.string().email(),
  phone: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  favoriteTeam: z.string().optional(),
});

authRouter.post('/join', zValidator('json', joinSchema), async (c) => {
  const body = c.req.valid('json');

  // Check display name uniqueness
  const { data: existing } = await supabase
    .from('participants')
    .select('id')
    .ilike('display_name', body.displayName)
    .single();
  if (existing) {
    return c.json({ error: { message: 'Display name already taken', code: 'DISPLAY_NAME_TAKEN' } }, 409);
  }

  // Check email uniqueness
  const { data: existingEmail } = await supabase
    .from('participants')
    .select('id')
    .ilike('email', body.email)
    .single();
  if (existingEmail) {
    return c.json({ error: { message: 'Email already registered', code: 'EMAIL_TAKEN' } }, 409);
  }

  const { data: participant, error } = await supabase
    .from('participants')
    .insert({
      full_name: body.fullName,
      display_name: body.displayName,
      email: body.email.toLowerCase(),
      phone: body.phone ?? null,
      city: body.city ?? null,
      country: body.country ?? null,
      favorite_team: body.favoriteTeam ?? null,
    })
    .select()
    .single<DbParticipant>();

  if (error || !participant) {
    return c.json({ error: { message: 'Failed to create participant', code: 'CREATE_FAILED' } }, 500);
  }

  const token = await signToken({
    participantId: participant.id,
    email: participant.email,
    displayName: participant.display_name,
    isAdmin: isAdminEmail(participant.email),
  });

  const isAdmin = isAdminEmail(participant.email);
  return c.json({ data: { participant: mapParticipant(participant), token, isAdmin } }, 201);
});

authRouter.post('/login', zValidator('json', z.object({ email: z.string().email() })), async (c) => {
  const { email } = c.req.valid('json');

  const { data: participant } = await supabase
    .from('participants')
    .select()
    .ilike('email', email)
    .single<DbParticipant>();

  if (!participant) {
    return c.json({ error: { message: 'No account found with that email', code: 'NOT_FOUND' } }, 404);
  }

  const token = await signToken({
    participantId: participant.id,
    email: participant.email,
    displayName: participant.display_name,
    isAdmin: isAdminEmail(participant.email),
  });

  return c.json({ data: { participant: mapParticipant(participant), token, isAdmin: isAdminEmail(participant.email) } });
});

authRouter.get('/me', requireAuth, async (c) => {
  const participantId = c.get('participantId');
  const { data: participant } = await supabase
    .from('participants')
    .select()
    .eq('id', participantId)
    .single<DbParticipant>();

  if (!participant) {
    return c.json({ error: { message: 'Participant not found', code: 'NOT_FOUND' } }, 404);
  }

  return c.json({ data: { participant: mapParticipant(participant), isAdmin: c.get('isAdmin') } });
});

export { authRouter };
