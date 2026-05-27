-- ============================================================
-- Phase 3 Migration: Add Group Stage & Round of 32 support
-- Run this FIRST in Supabase SQL Editor (before real_schedule_seed.sql)
-- ============================================================

-- 1. Update round CHECK constraint to include new rounds
ALTER TABLE matches DROP CONSTRAINT IF EXISTS matches_round_check;
ALTER TABLE matches ADD CONSTRAINT matches_round_check
  CHECK (round IN ('Group Stage', 'Round of 32', 'Round of 16', 'Quarter-final', 'Semi-final', 'Third Place', 'Final'));

-- 2. Add group_name column for group stage labeling (nullable, only set for group matches)
ALTER TABLE matches ADD COLUMN IF NOT EXISTS group_name TEXT;

-- No schema change needed for winner — it is TEXT with no CHECK, so "Draw" works already.
-- No schema change needed for method — CHECK already allows 'regulation'.
-- No schema change needed for predictions.winner_predicted — TEXT NOT NULL, no CHECK.
-- No schema change needed for predictions.method_predicted — CHECK already allows 'regulation'.
