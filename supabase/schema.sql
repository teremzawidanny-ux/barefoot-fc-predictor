-- ============================================================
-- Barefoot FC World Cup Match Predictor -- Supabase Schema
-- Paste this into the Supabase SQL Editor and run
-- ============================================================

-- Participants
CREATE TABLE IF NOT EXISTS participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  city TEXT,
  country TEXT,
  favorite_team TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT participants_display_name_unique UNIQUE (display_name),
  CONSTRAINT participants_email_unique UNIQUE (email)
);

-- Matches
CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_number INTEGER NOT NULL UNIQUE,
  round TEXT NOT NULL CHECK (round IN ('Group Stage', 'Round of 32', 'Round of 16', 'Quarter-final', 'Semi-final', 'Third Place', 'Final')),
  group_name TEXT,
  team1_source TEXT NOT NULL,
  team2_source TEXT NOT NULL,
  team1_actual TEXT,
  team2_actual TEXT,
  match_date TIMESTAMPTZ NOT NULL,
  prediction_deadline TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'teams_pending' CHECK (status IN ('teams_pending', 'open', 'locked', 'completed')),
  manual_locked BOOLEAN NOT NULL DEFAULT FALSE,
  team1_score INTEGER CHECK (team1_score >= 0),
  team2_score INTEGER CHECK (team2_score >= 0),
  winner TEXT,
  method TEXT CHECK (method IN ('regulation', 'extra_time', 'penalties')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Predictions
CREATE TABLE IF NOT EXISTS predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  team1_score_predicted INTEGER NOT NULL CHECK (team1_score_predicted >= 0),
  team2_score_predicted INTEGER NOT NULL CHECK (team2_score_predicted >= 0),
  winner_predicted TEXT NOT NULL,
  method_predicted TEXT NOT NULL CHECK (method_predicted IN ('regulation', 'extra_time', 'penalties')),
  points_awarded INTEGER,
  correct_winner BOOLEAN,
  exact_score BOOLEAN,
  correct_goal_difference BOOLEAN,
  correct_method BOOLEAN,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT predictions_participant_match_unique UNIQUE (participant_id, match_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_predictions_participant_id ON predictions(participant_id);
CREATE INDEX IF NOT EXISTS idx_predictions_match_id ON predictions(match_id);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_match_number ON matches(match_number);

-- Row Level Security (backend uses service role which bypasses RLS)
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;

-- Public read access (safe -- no private fields exposed, backend filters anyway)
CREATE POLICY "participants_public_read" ON participants FOR SELECT USING (true);
CREATE POLICY "matches_public_read" ON matches FOR SELECT USING (true);
CREATE POLICY "predictions_public_read" ON predictions FOR SELECT USING (true);

-- Service role (used by backend) bypasses RLS by default -- no extra policies needed
