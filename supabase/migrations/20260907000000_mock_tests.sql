-- ============================================
-- Mock Tests Premium Library
-- Premium mock test PDF library for EduNeuro
-- ============================================

BEGIN;

-- ─── Mock Tests metadata table ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS mock_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch TEXT NOT NULL,
  branch_code TEXT NOT NULL,
  branch_name TEXT NOT NULL,
  mock_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_size BIGINT NOT NULL DEFAULT 0,
  mime_type TEXT NOT NULL DEFAULT 'application/pdf',
  original_filename TEXT NOT NULL,
  question_count INTEGER NOT NULL DEFAULT 0,
  maximum_marks INTEGER NOT NULL DEFAULT 0,
  duration_minutes INTEGER NOT NULL DEFAULT 0,
  subject_distribution JSONB NOT NULL DEFAULT '[]'::jsonb,
  difficulty_distribution JSONB NOT NULL DEFAULT '{"easy":25,"moderate":50,"hard":25}'::jsonb,
  generation_basis TEXT NOT NULL DEFAULT 'previous_year_question_analysis',
  access_tier TEXT NOT NULL DEFAULT 'premium' CHECK (access_tier IN ('free', 'premium')),
  visibility TEXT NOT NULL DEFAULT 'published' CHECK (visibility IN ('draft', 'published', 'archived')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(branch, mock_number)
);

CREATE INDEX IF NOT EXISTS idx_mock_tests_branch ON mock_tests(branch);
CREATE INDEX IF NOT EXISTS idx_mock_tests_branch_mock ON mock_tests(branch, mock_number);
CREATE INDEX IF NOT EXISTS idx_mock_tests_access_tier ON mock_tests(access_tier);
CREATE INDEX IF NOT EXISTS idx_mock_tests_visibility ON mock_tests(visibility);

-- ─── RLS Policies ───────────────────────────────────────────────────────────

ALTER TABLE mock_tests ENABLE ROW LEVEL SECURITY;

-- Public can see published mock tests (metadata only — PDF serving is separately gated)
DROP POLICY IF EXISTS "Public read published mock tests meta" ON mock_tests;
CREATE POLICY "Public read published mock tests meta"
  ON mock_tests FOR SELECT
  USING (visibility = 'published');

-- Authenticated premium users can read everything about published mock tests
DROP POLICY IF EXISTS "Premium read mock tests" ON mock_tests;
CREATE POLICY "Premium read mock tests"
  ON mock_tests FOR SELECT
  USING (
    visibility = 'published'
    AND EXISTS (
      SELECT 1 FROM user_subscriptions
      WHERE user_id = auth.uid()
        AND status = 'active'
        AND (expires_at IS NULL OR expires_at > NOW())
    )
  );

-- Admin full access
DROP POLICY IF EXISTS "Admin full mock tests" ON mock_tests;
CREATE POLICY "Admin full mock tests"
  ON mock_tests FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner'))
  );

-- ─── Grant access ───────────────────────────────────────────────────────────

GRANT SELECT ON mock_tests TO anon, authenticated;
GRANT ALL ON mock_tests TO service_role;

-- ─── Trigger for updated_at ─────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_mock_tests_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_mock_tests_updated ON mock_tests;
CREATE TRIGGER trigger_mock_tests_updated
  BEFORE UPDATE ON mock_tests
  FOR EACH ROW EXECUTE FUNCTION update_mock_tests_timestamp();

COMMIT;
