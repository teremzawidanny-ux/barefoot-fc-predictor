import { Hono } from 'hono';
import { supabase } from '../lib/supabase';
import { mapMatch } from '../lib/mappers';
import type { DbMatch } from '../lib/mappers';

const matchesRouter = new Hono();

matchesRouter.get('/', async (c) => {
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .order('match_number', { ascending: true });

  if (error) {
    return c.json({ error: { message: 'Failed to load matches' } }, 500);
  }

  return c.json({ data: (data as DbMatch[]).map(mapMatch) });
});

export { matchesRouter };
