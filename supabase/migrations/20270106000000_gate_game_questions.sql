-- ============================================
-- GATE ARCADE — Game Questions Table
-- ============================================

BEGIN;

CREATE TABLE IF NOT EXISTS gate_game_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL DEFAULT '',
  option_b TEXT NOT NULL DEFAULT '',
  option_c TEXT NOT NULL DEFAULT '',
  option_d TEXT NOT NULL DEFAULT '',
  correct_option TEXT NOT NULL DEFAULT 'A' CHECK (correct_option IN ('A', 'B', 'C', 'D')),
  branch TEXT NOT NULL DEFAULT 'cse',
  topic TEXT DEFAULT '',
  difficulty TEXT NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_gate_game_questions_branch ON gate_game_questions(branch);
CREATE INDEX IF NOT EXISTS idx_gate_game_questions_status ON gate_game_questions(status);
CREATE INDEX IF NOT EXISTS idx_gate_game_questions_created_at ON gate_game_questions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gate_game_questions_branch_status ON gate_game_questions(branch, status);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_gate_game_questions_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_gate_game_questions_updated ON gate_game_questions;
CREATE TRIGGER trigger_gate_game_questions_updated
  BEFORE UPDATE ON gate_game_questions
  FOR EACH ROW EXECUTE FUNCTION update_gate_game_questions_timestamp();

-- RLS
ALTER TABLE gate_game_questions ENABLE ROW LEVEL SECURITY;

-- Public read: anyone can read active questions
CREATE POLICY "Public read active questions"
  ON gate_game_questions FOR SELECT
  USING (status = 'active');

-- Admin full access via service role (bypasses RLS)
CREATE POLICY "Service role manages questions"
  ON gate_game_questions FOR ALL
  USING (auth.role() = 'service_role');

COMMIT;
