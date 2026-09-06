-- ============================================
-- GATE Previous Year Questions (PYQ) System
-- Complete database schema for the EduNeuro PYQ Engine
-- ============================================

BEGIN;

-- ─── PYQ Branches ───────────────────────────────────────────────────────────
-- Canonical branch registry (extends the existing GATE paper config)

CREATE TABLE IF NOT EXISTS pyq_branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_code TEXT NOT NULL UNIQUE,       -- CS, EC, ME, etc.
  branch_name TEXT NOT NULL,              -- Computer Science and Information Technology
  display_name TEXT NOT NULL,             -- CSE
  exam TEXT NOT NULL DEFAULT 'GATE',
  active BOOLEAN NOT NULL DEFAULT true,
  subject_count INT NOT NULL DEFAULT 0,
  question_count INT NOT NULL DEFAULT 0,
  year_min INT,
  year_max INT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pyq_branches_code ON pyq_branches(branch_code);
CREATE INDEX IF NOT EXISTS idx_pyq_branches_active ON pyq_branches(active);

-- ─── PYQ Subjects ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS pyq_subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES pyq_branches(id) ON DELETE CASCADE,
  subject_name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  question_count INT NOT NULL DEFAULT 0,
  is_premium BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(branch_id, subject_name)
);

CREATE INDEX IF NOT EXISTS idx_pyq_subjects_branch ON pyq_subjects(branch_id);
CREATE INDEX IF NOT EXISTS idx_pyq_subjects_order ON pyq_subjects(branch_id, display_order);

-- ─── PYQ Topics ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS pyq_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES pyq_branches(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES pyq_subjects(id) ON DELETE CASCADE,
  topic_name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  question_count INT NOT NULL DEFAULT 0,
  is_premium BOOLEAN NOT NULL DEFAULT true,   -- Topics are PREMIUM by default
  frequency_score INT NOT NULL DEFAULT 0,     -- Historical frequency
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(branch_id, subject_id, topic_name)
);

CREATE INDEX IF NOT EXISTS idx_pyq_topics_subject ON pyq_topics(subject_id);
CREATE INDEX IF NOT EXISTS idx_pyq_topics_branch ON pyq_topics(branch_id);
CREATE INDEX IF NOT EXISTS idx_pyq_topics_premium ON pyq_topics(is_premium);

-- ─── PYQ Questions (core table) ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS pyq_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id TEXT NOT NULL UNIQUE,           -- e.g. "gate-cse-2024-s1-q17"
  branch_code TEXT NOT NULL,
  branch_name TEXT NOT NULL,
  exam TEXT NOT NULL DEFAULT 'GATE',
  year INT NOT NULL,
  session TEXT,                               -- "1", "2", etc.
  question_number TEXT,                       -- "17", "Q17", etc.
  subject_id UUID NOT NULL REFERENCES pyq_subjects(id),
  subject_name TEXT NOT NULL,
  topic_id UUID REFERENCES pyq_topics(id),
  topic_name TEXT,
  question_type TEXT NOT NULL DEFAULT 'MCQ',  -- MCQ, MSQ, NAT
  marks INT NOT NULL DEFAULT 2,
  negative_marks NUMERIC(3,1) NOT NULL DEFAULT 0.33,
  question_text TEXT NOT NULL,
  question_html TEXT,                         -- Rendered HTML with math
  options JSONB NOT NULL DEFAULT '[]'::jsonb,-- [{label:"A", text:"..."}, ...]
  correct_answer TEXT NOT NULL,
  answer_explanation TEXT,
  difficulty TEXT NOT NULL DEFAULT 'medium',  -- easy, medium, hard
  tags TEXT[] DEFAULT '{}',
  source_primary TEXT NOT NULL,               -- e.g. "GATE 2024 Official"
  source_url TEXT,
  source_type TEXT NOT NULL DEFAULT 'official', -- official, educational, community
  source_reference TEXT,
  answer_source TEXT NOT NULL DEFAULT 'official',
  answer_verified BOOLEAN NOT NULL DEFAULT false,
  verification_confidence NUMERIC(3,2) NOT NULL DEFAULT 0.0,
  quality_tier TEXT NOT NULL DEFAULT 'C',     -- A=verified, B=strong, C=needs_review
  topic_confidence NUMERIC(3,2) NOT NULL DEFAULT 0.0,
  is_duplicate BOOLEAN NOT NULL DEFAULT false,
  duplicate_of UUID REFERENCES pyq_questions(id),
  image_url TEXT,                             -- For diagram questions
  image_alt_text TEXT,
  content_hash TEXT,                          -- For deduplication
  normalized_hash TEXT,                       -- Normalized text hash
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pyq_questions_branch ON pyq_questions(branch_code);
CREATE INDEX IF NOT EXISTS idx_pyq_questions_branch_year ON pyq_questions(branch_code, year);
CREATE INDEX IF NOT EXISTS idx_pyq_questions_subject ON pyq_questions(subject_id);
CREATE INDEX IF NOT EXISTS idx_pyq_questions_topic ON pyq_questions(topic_id);
CREATE INDEX IF NOT EXISTS idx_pyq_questions_year ON pyq_questions(year);
CREATE INDEX IF NOT EXISTS idx_pyq_questions_type ON pyq_questions(question_type);
CREATE INDEX IF NOT EXISTS idx_pyq_questions_verified ON pyq_questions(answer_verified);
CREATE INDEX IF NOT EXISTS idx_pyq_questions_quality ON pyq_questions(quality_tier);
CREATE INDEX IF NOT EXISTS idx_pyq_questions_content_hash ON pyq_questions(content_hash);
CREATE INDEX IF NOT EXISTS idx_pyq_questions_question_id ON pyq_questions(question_id);
CREATE INDEX IF NOT EXISTS idx_pyq_questions_branch_year_type ON pyq_questions(branch_code, year, question_type);

-- ─── PYQ Attempts ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS pyq_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES pyq_questions(id) ON DELETE CASCADE,
  branch_code TEXT NOT NULL,
  selected_answer TEXT,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  time_spent_seconds INT NOT NULL DEFAULT 0,
  attempt_number INT NOT NULL DEFAULT 1,
  session_id TEXT,                            -- Groups attempts in a practice session
  practice_mode TEXT NOT NULL DEFAULT 'practice', -- practice, exam
  revealed_answer BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, question_id, attempt_number)
);

CREATE INDEX IF NOT EXISTS idx_pyq_attempts_user ON pyq_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_pyq_attempts_question ON pyq_attempts(question_id);
CREATE INDEX IF NOT EXISTS idx_pyq_attempts_user_branch ON pyq_attempts(user_id, branch_code);
CREATE INDEX IF NOT EXISTS idx_pyq_attempts_created ON pyq_attempts(created_at);

-- ─── PYQ Bookmarks ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS pyq_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES pyq_questions(id) ON DELETE CASCADE,
  branch_code TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_pyq_bookmarks_user ON pyq_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_pyq_bookmarks_question ON pyq_bookmarks(question_id);

-- ─── PYQ User Notes ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS pyq_user_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES pyq_questions(id) ON DELETE CASCADE,
  note TEXT NOT NULL DEFAULT '',
  is_private BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_pyq_user_notes_user ON pyq_user_notes(user_id);

-- ─── PYQ Reports ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS pyq_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES pyq_questions(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL,                 -- wrong_answer, ambiguous, ocr_error, etc.
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'open',       -- open, reviewed, resolved, dismissed
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_pyq_reports_status ON pyq_reports(status);

-- ─── PYQ Topic Stats (aggregates for analytics) ──────────────────────────────

CREATE TABLE IF NOT EXISTS pyq_topic_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_code TEXT NOT NULL,
  subject_id UUID REFERENCES pyq_subjects(id),
  topic_id UUID REFERENCES pyq_topics(id),
  year INT NOT NULL,
  question_count INT NOT NULL DEFAULT 0,
  total_marks INT NOT NULL DEFAULT 0,
  mcq_count INT NOT NULL DEFAULT 0,
  msq_count INT NOT NULL DEFAULT 0,
  nat_count INT NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(branch_code, topic_id, year)
);

CREATE INDEX IF NOT EXISTS idx_pyq_topic_stats_branch_year ON pyq_topic_stats(branch_code, year);
CREATE INDEX IF NOT EXISTS idx_pyq_topic_stats_topic ON pyq_topic_stats(topic_id);

-- ─── PYQ Year Stats (aggregates per branch per year) ────────────────────────

CREATE TABLE IF NOT EXISTS pyq_year_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_code TEXT NOT NULL,
  year INT NOT NULL,
  session TEXT,
  question_count INT NOT NULL DEFAULT 0,
  total_marks INT NOT NULL DEFAULT 0,
  verified_count INT NOT NULL DEFAULT 0,
  mcq_count INT NOT NULL DEFAULT 0,
  msq_count INT NOT NULL DEFAULT 0,
  nat_count INT NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(branch_code, year, session)
);

CREATE INDEX IF NOT EXISTS idx_pyq_year_stats_branch_year ON pyq_year_stats(branch_code, year);

-- ─── PYQ Source Registry ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS pyq_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_name TEXT NOT NULL,
  source_type TEXT NOT NULL,                  -- official, educational, community
  source_url TEXT NOT NULL,
  branch_code TEXT NOT NULL,
  year_from INT NOT NULL,
  year_to INT NOT NULL,
  question_count INT NOT NULL DEFAULT 0,
  access_status TEXT NOT NULL DEFAULT 'accessible', -- accessible, partial, unavailable
  last_accessed TIMESTAMPTZ,
  content_hash TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pyq_sources_type ON pyq_sources(source_type);
CREATE INDEX IF NOT EXISTS idx_pyq_sources_branch ON pyq_sources(branch_code);

-- ─── Triggers ───────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_pyq_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all PYQ tables
DROP TRIGGER IF EXISTS trigger_pyq_branches_updated ON pyq_branches;
CREATE TRIGGER trigger_pyq_branches_updated BEFORE UPDATE ON pyq_branches FOR EACH ROW EXECUTE FUNCTION update_pyq_timestamp();

DROP TRIGGER IF EXISTS trigger_pyq_subjects_updated ON pyq_subjects;
CREATE TRIGGER trigger_pyq_subjects_updated BEFORE UPDATE ON pyq_subjects FOR EACH ROW EXECUTE FUNCTION update_pyq_timestamp();

DROP TRIGGER IF EXISTS trigger_pyq_topics_updated ON pyq_topics;
CREATE TRIGGER trigger_pyq_topics_updated BEFORE UPDATE ON pyq_topics FOR EACH ROW EXECUTE FUNCTION update_pyq_timestamp();

DROP TRIGGER IF EXISTS trigger_pyq_questions_updated ON pyq_questions;
CREATE TRIGGER trigger_pyq_questions_updated BEFORE UPDATE ON pyq_questions FOR EACH ROW EXECUTE FUNCTION update_pyq_timestamp();

DROP TRIGGER IF EXISTS trigger_pyq_attempts_updated ON pyq_attempts;
CREATE TRIGGER trigger_pyq_attempts_updated BEFORE UPDATE ON pyq_attempts FOR EACH ROW EXECUTE FUNCTION update_pyq_timestamp();

DROP TRIGGER IF EXISTS trigger_pyq_bookmarks_updated ON pyq_bookmarks;
CREATE TRIGGER trigger_pyq_bookmarks_updated BEFORE UPDATE ON pyq_bookmarks FOR EACH ROW EXECUTE FUNCTION update_pyq_timestamp();

DROP TRIGGER IF EXISTS trigger_pyq_user_notes_updated ON pyq_user_notes;
CREATE TRIGGER trigger_pyq_user_notes_updated BEFORE UPDATE ON pyq_user_notes FOR EACH ROW EXECUTE FUNCTION update_pyq_timestamp();

DROP TRIGGER IF EXISTS trigger_pyq_reports_updated ON pyq_reports;
CREATE TRIGGER trigger_pyq_reports_updated BEFORE UPDATE ON pyq_reports FOR EACH ROW EXECUTE FUNCTION update_pyq_timestamp();

DROP TRIGGER IF EXISTS trigger_pyq_topic_stats_updated ON pyq_topic_stats;
CREATE TRIGGER trigger_pyq_topic_stats_updated BEFORE UPDATE ON pyq_topic_stats FOR EACH ROW EXECUTE FUNCTION update_pyq_timestamp();

DROP TRIGGER IF EXISTS trigger_pyq_year_stats_updated ON pyq_year_stats;
CREATE TRIGGER trigger_pyq_year_stats_updated BEFORE UPDATE ON pyq_year_stats FOR EACH ROW EXECUTE FUNCTION update_pyq_timestamp();

DROP TRIGGER IF EXISTS trigger_pyq_sources_updated ON pyq_sources;
CREATE TRIGGER trigger_pyq_sources_updated BEFORE UPDATE ON pyq_sources FOR EACH ROW EXECUTE FUNCTION update_pyq_timestamp();

COMMIT;
