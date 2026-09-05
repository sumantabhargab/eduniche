-- Gate Arcade Leaderboard
-- Stores high scores from the GATE Arcade game.

CREATE TABLE IF NOT EXISTS gate_arcade_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT,
  branch TEXT NOT NULL,
  score INTEGER NOT NULL,
  correct INTEGER NOT NULL,
  total INTEGER NOT NULL,
  accuracy TEXT,
  best_combo INTEGER,
  duration_seconds INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_arcade_scores_user ON gate_arcade_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_arcade_scores_branch ON gate_arcade_scores(branch);
CREATE INDEX IF NOT EXISTS idx_arcade_scores_score ON gate_arcade_scores(score DESC);

ALTER TABLE gate_arcade_scores ENABLE ROW LEVEL SECURITY;

-- Anyone can read public scores
DROP POLICY IF EXISTS "public_read_arcade_scores" ON gate_arcade_scores;
CREATE POLICY "public_read_arcade_scores"
  ON gate_arcade_scores FOR SELECT
  USING (true);

-- Users can insert their own scores
DROP POLICY IF EXISTS "users_insert_own_scores" ON gate_arcade_scores;
CREATE POLICY "users_insert_own_scores"
  ON gate_arcade_scores FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admin full access
DROP POLICY IF EXISTS "admin_full_arcade_scores" ON gate_arcade_scores;
CREATE POLICY "admin_full_arcade_scores"
  ON gate_arcade_scores FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner'))
  );

GRANT SELECT, INSERT ON gate_arcade_scores TO authenticated;
GRANT SELECT ON gate_arcade_scores TO anon;
