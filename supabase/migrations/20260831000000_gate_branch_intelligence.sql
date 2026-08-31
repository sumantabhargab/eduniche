-- Gate Branch Intelligence
-- Stores parsed analysis data from local markdown files for all GATE branches.

BEGIN;

-- Branch-level intelligence (one row per paper)
CREATE TABLE IF NOT EXISTS gate_branch_intelligence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paper_id TEXT NOT NULL UNIQUE,
  paper_code TEXT NOT NULL,
  paper_name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  exam_pattern JSONB NOT NULL DEFAULT '{}'::jsonb,
  engineering_math_marks JSONB NOT NULL DEFAULT '{}'::jsonb,
  general_aptitude_marks INT NOT NULL DEFAULT 15,
  strategic_tips TEXT[] DEFAULT '{}',
  optional_sections JSONB DEFAULT NULL,
  subject_count INT NOT NULL DEFAULT 0,
  question_count INT NOT NULL DEFAULT 0,
  data_source TEXT DEFAULT 'markdown-ingestion',
  last_ingested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Subject-level weightage within each branch
CREATE TABLE IF NOT EXISTS gate_subject_intelligence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES gate_branch_intelligence(id) ON DELETE CASCADE,
  subject_name TEXT NOT NULL,
  avg_weightage NUMERIC(5,2) NOT NULL DEFAULT 0,
  priority TEXT NOT NULL DEFAULT 'low' CHECK (priority IN ('high', 'medium', 'low')),
  category TEXT NOT NULL DEFAULT 'scoring' CHECK (category IN ('must-master', 'important', 'scoring')),
  topics TEXT[] DEFAULT '{}',
  difficulty_breakdown JSONB NOT NULL DEFAULT '{"easy":34,"moderate":51,"difficult":15}'::jsonb,
  yearly_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(branch_id, subject_name)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_gate_branch_paper_id ON gate_branch_intelligence(paper_id);
CREATE INDEX IF NOT EXISTS idx_gate_subject_branch ON gate_subject_intelligence(branch_id);
CREATE INDEX IF NOT EXISTS idx_gate_subject_priority ON gate_subject_intelligence(priority);

-- RLS
ALTER TABLE gate_branch_intelligence ENABLE ROW LEVEL SECURITY;
ALTER TABLE gate_subject_intelligence ENABLE ROW LEVEL SECURITY;

-- Public read for branch intelligence (this is reference/analysis data, not private)
CREATE POLICY "Public read branch intelligence"
  ON gate_branch_intelligence FOR SELECT USING (true);

CREATE POLICY "Public read subject intelligence"
  ON gate_subject_intelligence FOR SELECT USING (true);

-- Only service role can insert/update/delete
CREATE POLICY "Service role manages branch intelligence"
  ON gate_branch_intelligence FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role manages subject intelligence"
  ON gate_subject_intelligence FOR ALL USING (auth.role() = 'service_role');

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_gate_intelligence_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_gate_branch_updated ON gate_branch_intelligence;
CREATE TRIGGER trigger_gate_branch_updated
  BEFORE UPDATE ON gate_branch_intelligence
  FOR EACH ROW EXECUTE FUNCTION update_gate_intelligence_timestamp();

DROP TRIGGER IF EXISTS trigger_gate_subject_updated ON gate_subject_intelligence;
CREATE TRIGGER trigger_gate_subject_updated
  BEFORE UPDATE ON gate_subject_intelligence
  FOR EACH ROW EXECUTE FUNCTION update_gate_intelligence_timestamp();

COMMIT;
