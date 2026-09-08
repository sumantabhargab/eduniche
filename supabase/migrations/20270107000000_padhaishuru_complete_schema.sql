-- ============================================
-- PADHAISHURU.COM — Complete PostgreSQL Schema
-- Migration: 20270107000000
-- ============================================
-- This is an idempotent migration. It adds/updates tables,
-- columns, indexes, RLS, triggers, RPCs, views, partitioning
-- helpers, and retention functions.
-- ============================================

BEGIN;

-- ============================================================
-- EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ============================================================
-- 1. PROFILES (extends Supabase auth.users)
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'full_name') THEN
    ALTER TABLE profiles ADD COLUMN full_name TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'phone') THEN
    ALTER TABLE profiles ADD COLUMN phone TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'preferred_branch') THEN
    ALTER TABLE profiles ADD COLUMN preferred_branch TEXT DEFAULT 'CS';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'exam_year') THEN
    ALTER TABLE profiles ADD COLUMN exam_year INT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'current_streak') THEN
    ALTER TABLE profiles ADD COLUMN current_streak INT NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'longest_streak') THEN
    ALTER TABLE profiles ADD COLUMN longest_streak INT NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'total_study_minutes') THEN
    ALTER TABLE profiles ADD COLUMN total_study_minutes INT NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'total_questions_attempted') THEN
    ALTER TABLE profiles ADD COLUMN total_questions_attempted INT NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'last_active_at') THEN
    ALTER TABLE profiles ADD COLUMN last_active_at TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'plan') THEN
    ALTER TABLE profiles ADD COLUMN plan TEXT NOT NULL DEFAULT 'free'
      CHECK (plan IN ('free', 'weekly_premium', 'monthly_premium'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'created_at') THEN
    ALTER TABLE profiles ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'updated_at') THEN
    ALTER TABLE profiles ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  END IF;
END $$;

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('admin', 'student', 'owner'));

CREATE OR REPLACE FUNCTION update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_update_profiles_updated_at ON profiles;
CREATE TRIGGER trigger_update_profiles_updated_at
  BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_profiles_updated_at();

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_read_own_profile" ON profiles;
DROP POLICY IF EXISTS "users_update_own_profile" ON profiles;
DROP POLICY IF EXISTS "public_read_public_profile_fields" ON profiles;
DROP POLICY IF EXISTS "admin_update_profiles" ON profiles;

CREATE POLICY "users_read_own_profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_update_own_profile" ON profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "admin_update_profiles" ON profiles FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles p2 WHERE p2.id = auth.uid() AND p2.role = ANY (ARRAY['admin'::text, 'owner'::text]))) WITH CHECK (EXISTS (SELECT 1 FROM profiles p2 WHERE p2.id = auth.uid() AND p2.role = ANY (ARRAY['admin'::text, 'owner'::text])));
CREATE POLICY "public_read_public_profile_fields" ON profiles FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_plan ON profiles(plan);

GRANT ALL ON profiles TO service_role;
GRANT SELECT, UPDATE ON profiles TO authenticated;


-- ============================================================
-- 2. BRANCHES
-- ============================================================
CREATE TABLE IF NOT EXISTS branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_code TEXT NOT NULL UNIQUE,
  branch_name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  exam TEXT NOT NULL DEFAULT 'GATE',
  active BOOLEAN NOT NULL DEFAULT true,
  subject_count INT NOT NULL DEFAULT 0,
  question_count INT NOT NULL DEFAULT 0,
  year_min INT,
  year_max INT,
  description TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_branches_code ON branches(branch_code);
CREATE INDEX IF NOT EXISTS idx_branches_active ON branches(active);

ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_branches" ON branches FOR SELECT USING (true);
CREATE POLICY "service_manage_branches" ON branches FOR ALL USING (auth.role() = 'service_role');

INSERT INTO branches (branch_code, branch_name, display_name, subject_count, question_count, year_min, year_max)
SELECT branch_code, branch_name, display_name, subject_count, question_count, year_min, year_max
FROM pyq_branches ON CONFLICT (branch_code) DO NOTHING;


-- ============================================================
-- 3. SUBJECTS
-- ============================================================
CREATE TABLE IF NOT EXISTS subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  subject_name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  question_count INT NOT NULL DEFAULT 0,
  is_premium BOOLEAN NOT NULL DEFAULT false,
  description TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(branch_id, subject_name)
);

CREATE INDEX IF NOT EXISTS idx_subjects_branch ON subjects(branch_id);
CREATE INDEX IF NOT EXISTS idx_subjects_order ON subjects(branch_id, display_order);

ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_subjects" ON subjects FOR SELECT USING (true);
CREATE POLICY "service_manage_subjects" ON subjects FOR ALL USING (auth.role() = 'service_role');

INSERT INTO subjects (id, branch_id, subject_name, display_name, display_order, question_count, is_premium, metadata)
SELECT ps.id, b.id, ps.subject_name, ps.display_name, ps.display_order, ps.question_count, ps.is_premium, ps.metadata
FROM pyq_subjects ps
JOIN pyq_branches pb ON pb.id = ps.branch_id
JOIN branches b ON b.branch_code = pb.branch_code
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- 4. TOPICS
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pyq_topics' AND column_name = 'display_name') THEN
    ALTER TABLE pyq_topics ADD COLUMN display_name TEXT;
    UPDATE pyq_topics SET display_name = topic_name WHERE display_name IS NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pyq_topics' AND column_name = 'description') THEN
    ALTER TABLE pyq_topics ADD COLUMN description TEXT;
  END IF;
END $$;

ALTER TABLE pyq_topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_pyq_topics" ON pyq_topics FOR SELECT USING (true);
CREATE POLICY "service_manage_pyq_topics" ON pyq_topics FOR ALL USING (auth.role() = 'service_role');


-- ============================================================
-- 5. PAPERS
-- ============================================================
CREATE TABLE IF NOT EXISTS papers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paper_id TEXT NOT NULL UNIQUE,
  branch_code TEXT NOT NULL REFERENCES branches(branch_code),
  year INT NOT NULL,
  session TEXT,
  display_name TEXT NOT NULL,
  total_marks INT NOT NULL DEFAULT 100,
  duration_minutes INT NOT NULL DEFAULT 180,
  total_questions INT NOT NULL DEFAULT 65,
  mcq_1mark_count INT NOT NULL DEFAULT 0,
  mcq_2mark_count INT NOT NULL DEFAULT 0,
  msq_count INT NOT NULL DEFAULT 0,
  nat_count INT NOT NULL DEFAULT 0,
  general_aptitude_marks INT NOT NULL DEFAULT 15,
  engineering_math_marks INT NOT NULL DEFAULT 0,
  difficulty_rating NUMERIC(3,2) NOT NULL DEFAULT 0.0,
  cutoff_general NUMERIC(5,2),
  cutoff_obc NUMERIC(5,2),
  cutoff_sc_st NUMERIC(5,2),
  source_url TEXT,
  is_published BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_papers_branch_year ON papers(branch_code, year);
CREATE INDEX IF NOT EXISTS idx_papers_year ON papers(year);
CREATE INDEX IF NOT EXISTS idx_papers_branch ON papers(branch_code);

ALTER TABLE papers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_papers" ON papers FOR SELECT USING (is_published = true);
CREATE POLICY "service_manage_papers" ON papers FOR ALL USING (auth.role() = 'service_role');

DROP TRIGGER IF EXISTS trigger_papers_updated ON papers;
CREATE TRIGGER trigger_papers_updated BEFORE UPDATE ON papers FOR EACH ROW EXECUTE FUNCTION update_pyq_timestamp();


-- ============================================================
-- 6. QUESTIONS
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pyq_questions' AND column_name = 'paper_id') THEN
    ALTER TABLE pyq_questions ADD COLUMN paper_id TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pyq_questions' AND column_name = 'passage_text') THEN
    ALTER TABLE pyq_questions ADD COLUMN passage_text TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pyq_questions' AND column_name = 'subquestion_ids') THEN
    ALTER TABLE pyq_questions ADD COLUMN subquestion_ids TEXT[] DEFAULT '{}';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pyq_questions' AND column_name = 'parent_question_id') THEN
    ALTER TABLE pyq_questions ADD COLUMN parent_question_id UUID REFERENCES pyq_questions(id);
  END IF;
END $$;

ALTER TABLE pyq_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_questions" ON pyq_questions FOR SELECT USING (true);
CREATE POLICY "service_manage_questions" ON pyq_questions FOR ALL USING (auth.role() = 'service_role');


-- ============================================================
-- 7. USER QUESTION ATTEMPTS
-- ============================================================
CREATE TABLE IF NOT EXISTS user_question_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES pyq_questions(id) ON DELETE CASCADE,
  branch_code TEXT NOT NULL,
  selected_answer TEXT,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  time_spent_seconds INT NOT NULL DEFAULT 0,
  attempt_number INT NOT NULL DEFAULT 1,
  session_id TEXT,
  practice_mode TEXT NOT NULL DEFAULT 'practice',
  revealed_answer BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, question_id, attempt_number)
);

CREATE INDEX IF NOT EXISTS idx_user_question_attempts_user ON user_question_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_question_attempts_question ON user_question_attempts(question_id);
CREATE INDEX IF NOT EXISTS idx_user_question_attempts_user_branch ON user_question_attempts(user_id, branch_code);
CREATE INDEX IF NOT EXISTS idx_user_question_attempts_created ON user_question_attempts(created_at);

ALTER TABLE user_question_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_crud_own_attempts" ON user_question_attempts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "admin_read_all_attempts" ON user_question_attempts FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner')));

GRANT ALL ON user_question_attempts TO service_role;
GRANT SELECT, INSERT, UPDATE ON user_question_attempts TO authenticated;


-- ============================================================
-- 8. USER BOOKMARKS
-- ============================================================
ALTER TABLE pyq_bookmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_crud_own_bookmarks" ON pyq_bookmarks FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
GRANT ALL ON pyq_bookmarks TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON pyq_bookmarks TO authenticated;


-- ============================================================
-- 9. USER STUDY SESSIONS
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'study_sessions' AND column_name = 'ended_at') THEN
    ALTER TABLE study_sessions ADD COLUMN ended_at TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'study_sessions' AND column_name = 'duration_seconds') THEN
    ALTER TABLE study_sessions ADD COLUMN duration_seconds INT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'study_sessions' AND column_name = 'validation_status') THEN
    ALTER TABLE study_sessions ADD COLUMN validation_status TEXT NOT NULL DEFAULT 'pending' CHECK (validation_status IN ('pending', 'valid', 'invalid', 'flagged'));
  END IF;
END $$;

ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_crud_own_sessions" ON study_sessions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "admin_read_all_sessions" ON study_sessions FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner')));
GRANT ALL ON study_sessions TO service_role;
GRANT SELECT, INSERT, UPDATE ON study_sessions TO authenticated;


-- ============================================================
-- 10. USER DAILY STATS
-- ============================================================
CREATE TABLE IF NOT EXISTS user_daily_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_seconds INT NOT NULL DEFAULT 0,
  session_count INT NOT NULL DEFAULT 0,
  valid_session_count INT NOT NULL DEFAULT 0,
  questions_attempted INT NOT NULL DEFAULT 0,
  questions_correct INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_user_daily_stats_user_date ON user_daily_stats(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_user_daily_stats_date ON user_daily_stats(date);

ALTER TABLE user_daily_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_read_own_daily_stats" ON user_daily_stats FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "service_manage_daily_stats" ON user_daily_stats FOR ALL USING (auth.role() = 'service_role');

GRANT ALL ON user_daily_stats TO service_role;
GRANT SELECT ON user_daily_stats TO authenticated;

DROP TRIGGER IF EXISTS trigger_daily_stats_updated ON user_daily_stats;
CREATE TRIGGER trigger_daily_stats_updated BEFORE UPDATE ON user_daily_stats FOR EACH ROW EXECUTE FUNCTION update_user_progress_timestamp();


-- ============================================================
-- 11. USER STREAKS
-- ============================================================
CREATE TABLE IF NOT EXISTS user_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  streak_type TEXT NOT NULL DEFAULT 'daily_study'
    CHECK (streak_type IN ('daily_study', 'daily_questions', 'weekly_goal')),
  current_streak INT NOT NULL DEFAULT 0,
  longest_streak INT NOT NULL DEFAULT 0,
  last_active_date DATE,
  streak_start_date DATE,
  grace_used BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, streak_type)
);

CREATE INDEX IF NOT EXISTS idx_user_streaks_user ON user_streaks(user_id);

ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_read_own_streaks" ON user_streaks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "service_manage_streaks" ON user_streaks FOR ALL USING (auth.role() = 'service_role');

GRANT ALL ON user_streaks TO service_role;
GRANT SELECT ON user_streaks TO authenticated;

DROP TRIGGER IF EXISTS trigger_user_streaks_updated ON user_streaks;
CREATE TRIGGER trigger_user_streaks_updated BEFORE UPDATE ON user_streaks FOR EACH ROW EXECUTE FUNCTION update_user_progress_timestamp();


-- ============================================================
-- 12. AI CONVERSATIONS
-- ============================================================
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_crud_own_ai_conversations" ON ai_conversations FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_read_own_ai_messages" ON ai_messages FOR SELECT USING (EXISTS (SELECT 1 FROM ai_conversations WHERE id = conversation_id AND user_id = auth.uid()));
CREATE POLICY "users_insert_own_ai_messages" ON ai_messages FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM ai_conversations WHERE id = conversation_id AND user_id = auth.uid()));

GRANT ALL ON ai_conversations, ai_messages TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ai_conversations TO authenticated;
GRANT SELECT, INSERT ON ai_messages TO authenticated;


-- ============================================================
-- 13. AI MESSAGE USAGE
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'doubt_usage_tracking' AND column_name = 'tokens_used') THEN
    ALTER TABLE doubt_usage_tracking ADD COLUMN tokens_used INT NOT NULL DEFAULT 0;
  END IF;
END $$;

ALTER TABLE doubt_usage_tracking ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_read_own_doubt_usage" ON doubt_usage_tracking FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "service_insert_doubt_usage" ON doubt_usage_tracking FOR INSERT WITH CHECK (auth.role() = 'service_role');
GRANT ALL ON doubt_usage_tracking TO service_role;
GRANT SELECT, INSERT ON doubt_usage_tracking TO authenticated;


-- ============================================================
-- 14. SUBSCRIPTIONS
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_subscriptions' AND column_name = 'plan') THEN
    ALTER TABLE user_subscriptions ADD COLUMN plan TEXT NOT NULL DEFAULT 'monthly' CHECK (plan IN ('free', 'weekly', 'monthly'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_subscriptions' AND column_name = 'cancelled_at') THEN
    ALTER TABLE user_subscriptions ADD COLUMN cancelled_at TIMESTAMPTZ;
  END IF;
END $$;

ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_read_own_subscription" ON user_subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "admin_manage_subscriptions" ON user_subscriptions FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner')));
GRANT ALL ON user_subscriptions TO service_role;
GRANT SELECT, INSERT, UPDATE ON user_subscriptions TO authenticated;


-- ============================================================
-- 15. PAYMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES user_subscriptions(id) ON DELETE SET NULL,
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'authorized', 'captured', 'failed', 'refunded', 'partially_refunded')),
  provider TEXT NOT NULL DEFAULT 'razorpay',
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT UNIQUE,
  razorpay_signature TEXT,
  razorpay_subscription_id TEXT,
  payment_method TEXT,
  payment_method_details JSONB DEFAULT '{}',
  description TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  refund_amount NUMERIC(10,2) DEFAULT 0,
  refunded_at TIMESTAMPTZ,
  captured_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_subscription ON payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created ON payments(created_at DESC);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_read_own_payments" ON payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "admin_manage_payments" ON payments FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner')));
GRANT ALL ON payments TO service_role;
GRANT SELECT ON payments TO authenticated;

DROP TRIGGER IF EXISTS trigger_payments_updated ON payments;
CREATE TRIGGER trigger_payments_updated BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_pyq_timestamp();


-- ============================================================
-- 16. MOCK TESTS
-- ============================================================
CREATE TABLE IF NOT EXISTS mock_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_code TEXT NOT NULL UNIQUE,
  branch_code TEXT NOT NULL REFERENCES branches(branch_code),
  title TEXT NOT NULL,
  description TEXT,
  test_type TEXT NOT NULL DEFAULT 'full_mock'
    CHECK (test_type IN ('full_mock', 'subject_wise', 'topic_wise', 'chapter_wise')),
  paper_id TEXT REFERENCES papers(paper_id),
  total_marks INT NOT NULL DEFAULT 100,
  duration_minutes INT NOT NULL DEFAULT 180,
  total_questions INT NOT NULL DEFAULT 65,
  question_ids TEXT[] DEFAULT '{}',
  difficulty_mix JSONB NOT NULL DEFAULT '{"easy":30,"medium":50,"hard":20}'::jsonb,
  subject_distribution JSONB DEFAULT '{}',
  instructions TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  is_premium BOOLEAN NOT NULL DEFAULT false,
  max_attempts INT NOT NULL DEFAULT 3,
  available_from TIMESTAMPTZ,
  available_until TIMESTAMPTZ,
  show_solution_after BOOLEAN NOT NULL DEFAULT true,
  randomize_questions BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mock_tests_branch ON mock_tests(branch_code);
CREATE INDEX IF NOT EXISTS idx_mock_tests_published ON mock_tests(is_published);

ALTER TABLE mock_tests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_published_mock_tests" ON mock_tests FOR SELECT USING (is_published = true AND (available_from IS NULL OR available_from <= NOW()) AND (available_until IS NULL OR available_until >= NOW()) AND (is_premium = false OR EXISTS (SELECT 1 FROM user_subscriptions WHERE user_id = auth.uid() AND status = 'active' AND (expires_at IS NULL OR expires_at > NOW())) OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND plan = ANY (ARRAY['weekly_premium'::text, 'monthly_premium'::text]))));
CREATE POLICY "admin_manage_mock_tests" ON mock_tests FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner')));
GRANT ALL ON mock_tests TO service_role;
GRANT SELECT ON mock_tests TO authenticated;

DROP TRIGGER IF EXISTS trigger_mock_tests_updated ON mock_tests;
CREATE TRIGGER trigger_mock_tests_updated BEFORE UPDATE ON mock_tests FOR EACH ROW EXECUTE FUNCTION update_pyq_timestamp();


-- ============================================================
-- 17. TEST ATTEMPTS
-- ============================================================
CREATE TABLE IF NOT EXISTS test_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mock_test_id UUID NOT NULL REFERENCES mock_tests(id) ON DELETE CASCADE,
  attempt_number INT NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'in_progress'
    CHECK (status IN ('in_progress', 'completed', 'abandoned', 'timed_out')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  time_spent_seconds INT NOT NULL DEFAULT 0,
  total_score NUMERIC(6,2) NOT NULL DEFAULT 0,
  max_score NUMERIC(6,2) NOT NULL DEFAULT 100,
  correct_count INT NOT NULL DEFAULT 0,
  incorrect_count INT NOT NULL DEFAULT 0,
  unattempted_count INT NOT NULL DEFAULT 0,
  subject_breakdown JSONB NOT NULL DEFAULT '{}'::jsonb,
  answers JSONB NOT NULL DEFAULT '[]'::jsonb,
  reviewed_questions TEXT[] DEFAULT '{}',
  rank_percentile NUMERIC(5,2),
  submitted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, mock_test_id, attempt_number)
);

CREATE INDEX IF NOT EXISTS idx_test_attempts_user ON test_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_test_attempts_mock_test ON test_attempts(mock_test_id);
CREATE INDEX IF NOT EXISTS idx_test_attempts_user_status ON test_attempts(user_id, status);

ALTER TABLE test_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_crud_own_test_attempts" ON test_attempts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "admin_read_all_test_attempts" ON test_attempts FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner')));
GRANT ALL ON test_attempts TO service_role;
GRANT SELECT, INSERT, UPDATE ON test_attempts TO authenticated;

DROP TRIGGER IF EXISTS trigger_test_attempts_updated ON test_attempts;
CREATE TRIGGER trigger_test_attempts_updated BEFORE UPDATE ON test_attempts FOR EACH ROW EXECUTE FUNCTION update_user_progress_timestamp();


-- ============================================================
-- 18. FORMULAS
-- ============================================================
CREATE TABLE IF NOT EXISTS formulas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  formula_code TEXT NOT NULL UNIQUE,
  branch_code TEXT NOT NULL REFERENCES branches(branch_code),
  subject_id UUID REFERENCES subjects(id),
  topic_id UUID REFERENCES pyq_topics(id),
  title TEXT NOT NULL,
  latex TEXT NOT NULL,
  rendered_html TEXT,
  description TEXT,
  variables JSONB NOT NULL DEFAULT '[]'::jsonb,
  derivation TEXT,
  example_usage TEXT,
  tags TEXT[] DEFAULT '{}',
  difficulty TEXT NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  importance_score INT NOT NULL DEFAULT 50 CHECK (importance_score BETWEEN 0 AND 100),
  frequency_score INT NOT NULL DEFAULT 0,
  is_premium BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_formulas_branch ON formulas(branch_code);
CREATE INDEX IF NOT EXISTS idx_formulas_subject ON formulas(subject_id);
CREATE INDEX IF NOT EXISTS idx_formulas_topic ON formulas(topic_id);
CREATE INDEX IF NOT EXISTS idx_formulas_branch_premium ON formulas(branch_code, is_premium);

ALTER TABLE formulas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_free_formulas" ON formulas FOR SELECT USING (is_premium = false);
CREATE POLICY "premium_read_all_formulas" ON formulas FOR SELECT USING (is_premium = true AND (EXISTS (SELECT 1 FROM user_subscriptions WHERE user_id = auth.uid() AND status = 'active' AND (expires_at IS NULL OR expires_at > NOW())) OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND plan = ANY (ARRAY['weekly_premium'::text, 'monthly_premium'::text)))));
CREATE POLICY "service_manage_formulas" ON formulas FOR ALL USING (auth.role() = 'service_role');
GRANT ALL ON formulas TO service_role;
GRANT SELECT ON formulas TO authenticated;

DROP TRIGGER IF EXISTS trigger_formulas_updated ON formulas;
CREATE TRIGGER trigger_formulas_updated BEFORE UPDATE ON formulas FOR EACH ROW EXECUTE FUNCTION update_pyq_timestamp();


-- ============================================================
-- 19. FORMULA BOOKMARKS
-- ============================================================
CREATE TABLE IF NOT EXISTS formula_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  formula_id UUID NOT NULL REFERENCES formulas(id) ON DELETE CASCADE,
  note TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, formula_id)
);

CREATE INDEX IF NOT EXISTS idx_formula_bookmarks_user ON formula_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_formula_bookmarks_formula ON formula_bookmarks(formula_id);

ALTER TABLE formula_bookmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_crud_own_formula_bookmarks" ON formula_bookmarks FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
GRANT ALL ON formula_bookmarks TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON formula_bookmarks TO authenticated;


-- ============================================================
-- 20. CUTOFFS
-- ============================================================
CREATE TABLE IF NOT EXISTS cutoffs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_code TEXT NOT NULL REFERENCES branches(branch_code),
  year INT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general'
    CHECK (category IN ('general', 'obc_ncl', 'obc_ew', 'sc', 'st', 'pwd')),
  opening_rank INT,
  closing_rank INT,
  opening_score NUMERIC(5,2),
  closing_score NUMERIC(5,2),
  institute_type TEXT DEFAULT 'iit'
    CHECK (institute_type IN ('iit', 'nit', 'iiit', 'gfti', 'all')),
  institute_name TEXT,
  program_name TEXT,
  source_url TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cutoffs_branch_year ON cutoffs(branch_code, year);
CREATE INDEX IF NOT EXISTS idx_cutoffs_category ON cutoffs(category);
CREATE INDEX IF NOT EXISTS idx_cutoffs_year ON cutoffs(year);

ALTER TABLE cutoffs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_cutoffs" ON cutoffs FOR SELECT USING (true);
CREATE POLICY "service_manage_cutoffs" ON cutoffs FOR ALL USING (auth.role() = 'service_role');
GRANT ALL ON cutoffs TO service_role;
GRANT SELECT ON cutoffs TO authenticated, anon;

DROP TRIGGER IF EXISTS trigger_cutoffs_updated ON cutoffs;
CREATE TRIGGER trigger_cutoffs_updated BEFORE UPDATE ON cutoffs FOR EACH ROW EXECUTE FUNCTION update_pyq_timestamp();


-- ============================================================
-- 21. ANNOUNCEMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  announcement_type TEXT NOT NULL DEFAULT 'general'
    CHECK (announcement_type IN ('general', 'feature', 'maintenance', 'exam', 'scholarship')),
  target_audience TEXT NOT NULL DEFAULT 'all'
    CHECK (target_audience IN ('all', 'free', 'premium', 'specific_branch')),
  target_branches TEXT[] DEFAULT '{}',
  priority TEXT NOT NULL DEFAULT 'normal'
    CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  published_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_announcements_active ON announcements(is_active, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_announcements_priority ON announcements(priority DESC);

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_active_announcements" ON announcements FOR SELECT USING (is_active = true AND (published_at IS NULL OR published_at <= NOW()) AND (expires_at IS NULL OR expires_at >= NOW()));
CREATE POLICY "admin_manage_announcements" ON announcements FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner')));
GRANT ALL ON announcements TO service_role;
GRANT SELECT ON announcements TO authenticated, anon;

DROP TRIGGER IF EXISTS trigger_announcements_updated ON announcements;
CREATE TRIGGER trigger_announcements_updated BEFORE UPDATE ON announcements FOR EACH ROW EXECUTE FUNCTION update_pyq_timestamp();


-- ============================================================
-- 22. ANNOUNCEMENT READS
-- ============================================================
CREATE TABLE IF NOT EXISTS announcement_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(announcement_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_announcement_reads_user ON announcement_reads(user_id);
CREATE INDEX IF NOT EXISTS idx_announcement_reads_announcement ON announcement_reads(announcement_id);

ALTER TABLE announcement_reads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_read_own_announcement_reads" ON announcement_reads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "service_manage_announcement_reads" ON announcement_reads FOR ALL USING (auth.role() = 'service_role');
GRANT ALL ON announcement_reads TO service_role;
GRANT SELECT, INSERT ON announcement_reads TO authenticated;


-- ============================================================
-- 23. MENTORS
-- ============================================================
CREATE TABLE IF NOT EXISTS mentors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  photo_url TEXT,
  branch_code TEXT NOT NULL REFERENCES branches(branch_code),
  gate_score NUMERIC(5,2),
  gate_rank INT,
  gate_year INT,
  specialization TEXT,
  current_institute TEXT,
  current_role TEXT,
  bio TEXT NOT NULL DEFAULT '',
  expertise_areas TEXT[] DEFAULT '{}',
  teaching_style TEXT[] DEFAULT '{}',
  languages TEXT[] DEFAULT ARRAY['English', 'Hindi']::text[],
  hourly_rate NUMERIC(8,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'INR',
  rating_avg NUMERIC(3,2) NOT NULL DEFAULT 0.0,
  rating_count INT NOT NULL DEFAULT 0,
  students_mentored INT NOT NULL DEFAULT 0,
  availability_status TEXT NOT NULL DEFAULT 'available'
    CHECK (availability_status IN ('available', 'busy', 'unavailable')),
  is_verified BOOLEAN NOT NULL DEFAULT false,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  social_links JSONB NOT NULL DEFAULT '{}'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mentors_branch ON mentors(branch_code);
CREATE INDEX IF NOT EXISTS idx_mentors_availability ON mentors(availability_status);
CREATE INDEX IF NOT EXISTS idx_mentors_verified ON mentors(is_verified);
CREATE INDEX IF NOT EXISTS idx_mentors_rating ON mentors(rating_avg DESC);
CREATE INDEX IF NOT EXISTS idx_mentors_featured ON mentors(is_featured) WHERE is_featured = true;

ALTER TABLE mentors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_mentors" ON mentors FOR SELECT USING (is_verified = true);
CREATE POLICY "admin_manage_mentors" ON mentors FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner')));
GRANT ALL ON mentors TO service_role;
GRANT SELECT ON mentors TO authenticated, anon;

DROP TRIGGER IF EXISTS trigger_mentors_updated ON mentors;
CREATE TRIGGER trigger_mentors_updated BEFORE UPDATE ON mentors FOR EACH ROW EXECUTE FUNCTION update_pyq_timestamp();


-- ============================================================
-- 24. MENTORSHIP BOOKINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS mentorship_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id UUID NOT NULL REFERENCES mentors(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_type TEXT NOT NULL DEFAULT 'one_on_one'
    CHECK (session_type IN ('one_on_one', 'group', 'assessment')),
  topic TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INT NOT NULL DEFAULT 60,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'rescheduled')),
  payment_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (payment_status IN ('pending', 'paid', 'refunded', 'waived')),
  amount NUMERIC(10,2),
  currency TEXT NOT NULL DEFAULT 'INR',
  payment_id UUID REFERENCES payments(id),
  meeting_link TEXT,
  meeting_platform TEXT DEFAULT 'google_meet',
  notes TEXT,
  feedback TEXT,
  rating INT CHECK (rating BETWEEN 1 AND 5),
  cancelled_by UUID REFERENCES auth.users(id),
  cancellation_reason TEXT,
  rescheduled_from UUID REFERENCES mentorship_bookings(id),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mentorship_bookings_mentor ON mentorship_bookings(mentor_id);
CREATE INDEX IF NOT EXISTS idx_mentorship_bookings_user ON mentorship_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_mentorship_bookings_status ON mentorship_bookings(status);

ALTER TABLE mentorship_bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_read_own_bookings" ON mentorship_bookings FOR SELECT USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM mentors WHERE id = mentor_id AND user_id = auth.uid()));
CREATE POLICY "users_create_bookings" ON mentorship_bookings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_update_own_bookings" ON mentorship_bookings FOR UPDATE USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM mentors WHERE id = mentor_id AND user_id = auth.uid()));
CREATE POLICY "admin_manage_bookings" ON mentorship_bookings FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner')));
GRANT ALL ON mentorship_bookings TO service_role;
GRANT SELECT, INSERT, UPDATE ON mentorship_bookings TO authenticated;

DROP TRIGGER IF EXISTS trigger_mentorship_bookings_updated ON mentorship_bookings;
CREATE TRIGGER trigger_mentorship_bookings_updated BEFORE UPDATE ON mentorship_bookings FOR EACH ROW EXECUTE FUNCTION update_pyq_timestamp();


-- ============================================================
-- 25. CHAT ROOMS
-- ============================================================
CREATE TABLE IF NOT EXISTS chat_rooms (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  room_type TEXT NOT NULL DEFAULT 'global'
    CHECK (room_type IN ('global', 'branch', 'subject', 'study_group', 'mentorship')),
  branch_code TEXT REFERENCES branches(branch_code),
  subject_id UUID REFERENCES subjects(id),
  created_by UUID REFERENCES auth.users(id),
  is_public BOOLEAN NOT NULL DEFAULT true,
  is_moderated BOOLEAN NOT NULL DEFAULT true,
  max_members INT DEFAULT 0,
  slow_mode_seconds INT DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_rooms_type ON chat_rooms(room_type);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_public ON chat_rooms(is_public) WHERE is_public = true;

ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_public_chat_rooms" ON chat_rooms FOR SELECT USING (is_public = true);
CREATE POLICY "admin_manage_chat_rooms" ON chat_rooms FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner')));
GRANT ALL ON chat_rooms TO service_role;
GRANT SELECT ON chat_rooms TO authenticated, anon;

DROP TRIGGER IF EXISTS trigger_chat_rooms_updated ON chat_rooms;
CREATE TRIGGER trigger_chat_rooms_updated BEFORE UPDATE ON chat_rooms FOR EACH ROW EXECUTE FUNCTION update_pyq_timestamp();


-- ============================================================
-- 26. CHAT MESSAGES
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_messages' AND column_name = 'room_id') THEN
    ALTER TABLE chat_messages ADD COLUMN room_id TEXT REFERENCES chat_rooms(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_messages' AND column_name = 'is_pinned') THEN
    ALTER TABLE chat_messages ADD COLUMN is_pinned BOOLEAN NOT NULL DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_messages' AND column_name = 'reply_to') THEN
    ALTER TABLE chat_messages ADD COLUMN reply_to UUID REFERENCES chat_messages(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_messages' AND column_name = 'content_type') THEN
    ALTER TABLE chat_messages ADD COLUMN content_type TEXT NOT NULL DEFAULT 'text' CHECK (content_type IN ('text', 'image', 'file', 'formula'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_chat_messages_room_created ON chat_messages(room_id, created_at DESC);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_chat_messages" ON chat_messages FOR SELECT USING (deleted_at IS NULL);
CREATE POLICY "users_insert_own_messages" ON chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_update_own_messages" ON chat_messages FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "admin_delete_chat_messages" ON chat_messages FOR DELETE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner')));
GRANT ALL ON chat_messages TO service_role;
GRANT SELECT, INSERT, UPDATE ON chat_messages TO authenticated;


-- ============================================================
-- 27. VIRTUAL LIBRARY ROOMS
-- ============================================================
ALTER TABLE virtual_library_rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rooms_public_read" ON virtual_library_rooms FOR SELECT TO authenticated USING (true);
CREATE POLICY "service_manage_rooms" ON virtual_library_rooms FOR ALL TO service_role USING (true);
GRANT ALL ON virtual_library_rooms TO service_role;
GRANT SELECT ON virtual_library_rooms TO authenticated;


-- ============================================================
-- 28. VIRTUAL LIBRARY SESSIONS
-- ============================================================
ALTER TABLE virtual_library_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sessions_own_crud" ON virtual_library_sessions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
GRANT ALL ON virtual_library_sessions TO service_role;
GRANT SELECT, INSERT, UPDATE ON virtual_library_sessions TO authenticated;


-- ============================================================
-- 29. ACHIEVEMENTS (badge_definitions)
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'badge_definitions' AND column_name = 'points') THEN
    ALTER TABLE badge_definitions ADD COLUMN points INT NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'badge_definitions' AND column_name = 'hidden') THEN
    ALTER TABLE badge_definitions ADD COLUMN hidden BOOLEAN NOT NULL DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'badge_definitions' AND column_name = 'icon_url') THEN
    ALTER TABLE badge_definitions ADD COLUMN icon_url TEXT;
  END IF;
END $$;

ALTER TABLE badge_definitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_badge_definitions" ON badge_definitions FOR SELECT USING (true);
CREATE POLICY "admin_full_badge_definitions" ON badge_definitions FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner')));
GRANT ALL ON badge_definitions TO service_role;
GRANT SELECT ON badge_definitions TO authenticated, anon;


-- ============================================================
-- 30. USER ACHIEVEMENTS (user_badges)
-- ============================================================
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_read_all_badges" ON user_badges FOR SELECT USING (true);
CREATE POLICY "users_insert_own_badges" ON user_badges FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "admin_full_user_badges" ON user_badges FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner')));
GRANT ALL ON user_badges TO service_role;
GRANT SELECT, INSERT ON user_badges TO authenticated;


-- ============================================================
-- 31. LEADERBOARD ENTRIES
-- ============================================================
CREATE TABLE IF NOT EXISTS leaderboard_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  leaderboard_type TEXT NOT NULL DEFAULT 'weekly_study'
    CHECK (leaderboard_type IN ('weekly_study', 'monthly_study', 'all_time_study', 'weekly_questions', 'monthly_questions', 'all_time_questions', 'weekly_streak', 'referrals')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  score NUMERIC(10,2) NOT NULL DEFAULT 0,
  rank INT,
  percentile NUMERIC(5,2),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, leaderboard_type, period_start, period_end)
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_type_period ON leaderboard_entries(leaderboard_type, period_end DESC, rank);
CREATE INDEX IF NOT EXISTS idx_leaderboard_user ON leaderboard_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_score ON leaderboard_entries(leaderboard_type, score DESC);

ALTER TABLE leaderboard_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_leaderboard" ON leaderboard_entries FOR SELECT USING (true);
CREATE POLICY "service_manage_leaderboard" ON leaderboard_entries FOR ALL USING (auth.role() = 'service_role');
GRANT ALL ON leaderboard_entries TO service_role;
GRANT SELECT ON leaderboard_entries TO authenticated, anon;

DROP TRIGGER IF EXISTS trigger_leaderboard_entries_updated ON leaderboard_entries;
CREATE TRIGGER trigger_leaderboard_entries_updated BEFORE UPDATE ON leaderboard_entries FOR EACH ROW EXECUTE FUNCTION update_pyq_timestamp();


-- ============================================================
-- 32. REFERRALS
-- ============================================================
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'completed', 'rewarded', 'invalid')),
  reward_type TEXT NOT NULL DEFAULT 'none'
    CHECK (reward_type IN ('none', 'premium_days', 'cash', 'discount')),
  reward_value NUMERIC(10,2) DEFAULT 0,
  reward_given_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(referrer_id, referee_id)
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referee ON referrals(referee_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_read_own_referrals" ON referrals FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referee_id);
CREATE POLICY "service_manage_referrals" ON referrals FOR ALL USING (auth.role() = 'service_role');
GRANT ALL ON referrals TO service_role;
GRANT SELECT ON referrals TO authenticated;

DROP TRIGGER IF EXISTS trigger_referrals_updated ON referrals;
CREATE TRIGGER trigger_referrals_updated BEFORE UPDATE ON referrals FOR EACH ROW EXECUTE FUNCTION update_pyq_timestamp();


-- ============================================================
-- HELPER: USER QUESTION SETS (for organizing practice)
-- ============================================================
CREATE TABLE IF NOT EXISTS user_question_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  question_ids TEXT[] DEFAULT '{}',
  is_public BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_question_sets_user ON user_question_sets(user_id);
CREATE INDEX IF NOT EXISTS idx_user_question_sets_public ON user_question_sets(is_public) WHERE is_public = true;

ALTER TABLE user_question_sets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_crud_own_sets" ON user_question_sets FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "public_read_public_sets" ON user_question_sets FOR SELECT USING (is_public = true);
GRANT ALL ON user_question_sets TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_question_sets TO authenticated;

DROP TRIGGER IF EXISTS trigger_user_question_sets_updated ON user_question_sets;
CREATE TRIGGER trigger_user_question_sets_updated BEFORE UPDATE ON user_question_sets FOR EACH ROW EXECUTE FUNCTION update_pyq_timestamp();


-- ============================================================
-- RPC FUNCTIONS
-- ============================================================

-- has_active_subscription
CREATE OR REPLACE FUNCTION has_active_subscription(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_subscriptions
    WHERE user_id = p_user_id AND status = 'active'
      AND (expires_at IS NULL OR expires_at > NOW())
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;
GRANT EXECUTE ON FUNCTION has_active_subscription(UUID) TO authenticated, anon, service_role;


-- get_doubt_usage_today
CREATE OR REPLACE FUNCTION get_doubt_usage_today(p_user_id UUID, p_date DATE DEFAULT CURRENT_DATE)
RETURNS INTEGER AS $$
DECLARE msg_count INTEGER;
BEGIN
  SELECT COALESCE(message_count, 0) INTO msg_count
  FROM doubt_usage_tracking WHERE user_id = p_user_id AND date = p_date;
  RETURN COALESCE(msg_count, 0);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;
GRANT EXECUTE ON FUNCTION get_doubt_usage_today(UUID, DATE) TO authenticated, service_role;


-- increment_doubt_usage
CREATE OR REPLACE FUNCTION increment_doubt_usage(p_user_id UUID, p_date DATE DEFAULT CURRENT_DATE)
RETURNS INTEGER AS $$
DECLARE new_count INTEGER;
BEGIN
  INSERT INTO doubt_usage_tracking (user_id, date, message_count) VALUES (p_user_id, p_date, 1)
  ON CONFLICT (user_id, date) DO UPDATE SET message_count = doubt_usage_tracking.message_count + 1
  RETURNING message_count INTO new_count;
  RETURN new_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
GRANT EXECUTE ON FUNCTION increment_doubt_usage(UUID, DATE) TO service_role;


-- expire_subscriptions
CREATE OR REPLACE FUNCTION expire_subscriptions()
RETURNS INTEGER AS $$
DECLARE affected INTEGER;
BEGIN
  UPDATE user_subscriptions SET status = 'expired', updated_at = NOW()
  WHERE status = 'active' AND expires_at IS NOT NULL AND expires_at <= NOW();
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
GRANT EXECUTE ON FUNCTION expire_subscriptions() TO service_role;


-- get_user_daily_stats
CREATE OR REPLACE FUNCTION get_user_daily_stats(p_user_id UUID, p_timezone TEXT DEFAULT 'Asia/Kolkata')
RETURNS TABLE (date TEXT, total_seconds BIGINT, session_count BIGINT, streak INTEGER) AS $$
DECLARE v_today DATE; v_streak INTEGER := 0; v_check_date DATE;
BEGIN
  v_today := (NOW() AT TIME ZONE p_timezone)::DATE;
  FOR v_check_date IN SELECT DISTINCT (started_at AT TIME ZONE p_timezone)::DATE FROM study_sessions WHERE user_id = p_user_id AND validation_status = 'valid' AND started_at IS NOT NULL ORDER BY 1 DESC LOOP
    IF v_check_date = v_today OR v_check_date = v_today - (v_streak + 1) * INTERVAL '1 day' THEN
      v_streak := v_streak + 1;
    ELSIF v_check_date < v_today - (v_streak + 1) * INTERVAL '1 day' THEN
      EXIT;
    ELSE
      v_streak := v_streak + 1;
    END IF;
  END LOOP;
  RETURN QUERY SELECT (ds.day AT TIME ZONE p_timezone)::TEXT, COALESCE(SUM(ds.duration_seconds), 0)::BIGINT, COUNT(*)::BIGINT, v_streak FROM (SELECT (started_at AT TIME ZONE p_timezone)::DATE AS day, SUM(duration_seconds) AS duration_seconds, COUNT(*) AS cnt FROM study_sessions WHERE user_id = p_user_id AND validation_status = 'valid' AND (started_at AT TIME ZONE p_timezone)::DATE >= v_today - INTERVAL '30 days' GROUP BY (started_at AT TIME ZONE p_timezone)::DATE) ds GROUP BY ds.day ORDER BY ds.day DESC LIMIT 30;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;
GRANT EXECUTE ON FUNCTION get_user_daily_stats(UUID, TEXT) TO authenticated, anon;


-- get_branch_progress_summary
CREATE OR REPLACE FUNCTION get_branch_progress_summary(p_user_id UUID, p_branch_code TEXT)
RETURNS TABLE (total_questions BIGINT, attempted BIGINT, correct BIGINT, accuracy NUMERIC, bookmarked BIGINT, subject_breakdown JSONB) AS $$
DECLARE v_total BIGINT; v_attempted BIGINT; v_correct BIGINT; v_bookmarked BIGINT;
BEGIN
  SELECT COUNT(*) INTO v_total FROM pyq_questions WHERE branch_code = p_branch_code;
  SELECT COUNT(DISTINCT question_id) INTO v_attempted FROM pyq_attempts WHERE user_id = p_user_id AND branch_code = p_branch_code;
  SELECT COUNT(*) INTO v_correct FROM pyq_attempts WHERE user_id = p_user_id AND branch_code = p_branch_code AND is_correct = true;
  SELECT COUNT(*) INTO v_bookmarked FROM pyq_bookmarks WHERE user_id = p_user_id AND branch_code = p_branch_code;
  RETURN QUERY SELECT v_total, v_attempted, v_correct, CASE WHEN v_attempted > 0 THEN ROUND((v_correct::NUMERIC / v_attempted::NUMERIC) * 100, 2) ELSE 0 END, v_bookmarked, jsonb_build_object('total', v_total, 'attempted', v_attempted, 'correct', v_correct, 'accuracy', CASE WHEN v_attempted > 0 THEN ROUND((v_correct::NUMERIC / v_attempted::NUMERIC) * 100, 2) ELSE 0 END, 'bookmarked', v_bookmarked);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;
GRANT EXECUTE ON FUNCTION get_branch_progress_summary(UUID, TEXT) TO authenticated, anon;


-- update_user_streak
CREATE OR REPLACE FUNCTION update_user_streak(p_user_id UUID, p_date DATE DEFAULT CURRENT_DATE)
RETURNS VOID AS $$
DECLARE v_streak_row user_streaks%ROWTYPE; v_last_active DATE; v_new_streak INT; v_prev_streak INT;
BEGIN
  SELECT * INTO v_streak_row FROM user_streaks WHERE user_id = p_user_id AND streak_type = 'daily_study';
  IF NOT FOUND THEN
    INSERT INTO user_streaks (user_id, streak_type, current_streak, longest_streak, last_active_date, streak_start_date) VALUES (p_user_id, 'daily_study', 1, 1, p_date, p_date);
    RETURN;
  END IF;
  v_last_active := v_streak_row.last_active_date; v_prev_streak := v_streak_row.current_streak;
  IF v_last_active = p_date THEN RETURN;
  ELSIF v_last_active = p_date - INTERVAL '1 day' THEN v_new_streak := v_prev_streak + 1;
  ELSE v_new_streak := 1; END IF;
  UPDATE user_streaks SET current_streak = v_new_streak, longest_streak = GREATEST(v_new_streak, longest_streak), last_active_date = p_date, streak_start_date = CASE WHEN v_new_streak = 1 THEN p_date ELSE streak_start_date END, updated_at = NOW() WHERE user_id = p_user_id AND streak_type = 'daily_study';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
GRANT EXECUTE ON FUNCTION update_user_streak(UUID, DATE) TO service_role;


-- ============================================================
-- VIEWS
-- ============================================================

-- v_questions_full
CREATE OR REPLACE VIEW v_questions_full AS
SELECT q.id, q.question_id, q.branch_code, q.year, q.session, q.question_number, q.question_type, q.marks, q.negative_marks, q.question_text, q.question_html, q.options, q.correct_answer, q.answer_explanation, q.difficulty, q.tags, q.source_primary, q.source_type, q.answer_verified, q.quality_tier, q.image_url, s.subject_name, s.display_name AS subject_display, t.topic_name, t.display_name AS topic_display, p.display_name AS paper_display
FROM pyq_questions q JOIN pyq_subjects s ON s.id = q.subject_id LEFT JOIN pyq_topics t ON t.id = q.topic_id LEFT JOIN papers p ON p.paper_id = q.paper_id;
GRANT SELECT ON v_questions_full TO authenticated, anon, service_role;

-- v_branch_stats
CREATE OR REPLACE VIEW v_branch_stats AS
SELECT b.branch_code, b.branch_name, b.display_name, b.subject_count, b.question_count, b.year_min, b.year_max, COUNT(DISTINCT q.id) FILTER (WHERE q.answer_verified = true) AS verified_questions, COUNT(DISTINCT q.id) FILTER (WHERE q.quality_tier = 'A') AS tier_a_questions, COUNT(DISTINCT q.id) FILTER (WHERE q.quality_tier = 'B') AS tier_b_questions, COUNT(DISTINCT q.id) FILTER (WHERE q.quality_tier = 'C') AS tier_c_questions, COUNT(DISTINCT pa.user_id) FILTER (WHERE pa.is_correct = true) AS users_solved_correctly FROM branches b LEFT JOIN pyq_questions q ON q.branch_code = b.branch_code LEFT JOIN pyq_attempts pa ON pa.branch_code = b.branch_code AND pa.is_correct = true GROUP BY b.branch_code, b.branch_name, b.display_name, b.subject_count, b.question_count, b.year_min, b.year_max;
GRANT SELECT ON v_branch_stats TO authenticated, anon, service_role;

-- v_leaderboard
CREATE OR REPLACE VIEW v_leaderboard AS
SELECT le.user_id, p.username, p.avatar_url, le.leaderboard_type, le.period_start, le.period_end, le.score, le.rank, le.percentile, ROW_NUMBER() OVER (PARTITION BY le.leaderboard_type ORDER BY le.score DESC) AS computed_rank FROM leaderboard_entries le JOIN profiles p ON p.id = le.user_id;
GRANT SELECT ON v_leaderboard TO authenticated, anon, service_role;


-- ============================================================
-- PARTITIONING HELPERS
-- ============================================================
CREATE OR REPLACE FUNCTION create_monthly_partitions()
RETURNS VOID AS $$
DECLARE v_table TEXT; v_start DATE; v_end DATE; v_sql TEXT;
BEGIN
  FOR v_table IN SELECT unnest(ARRAY['pyq_attempts','user_question_attempts','study_sessions','chat_messages','ai_messages','test_attempts','virtual_library_messages']) LOOP
    v_start := DATE_TRUNC('month', NOW() + INTERVAL '1 month')::DATE;
    v_end := (v_start + INTERVAL '1 month')::DATE;
    v_sql := format('CREATE TABLE IF NOT EXISTS %I_%s PARTITION OF %I FOR VALUES FROM (''%s'') TO (''%s'')', v_table, TO_CHAR(v_start, 'YYYY_MM'), v_table, v_start, v_end);
    EXECUTE v_sql;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
GRANT EXECUTE ON FUNCTION create_monthly_partitions() TO service_role;


-- ============================================================
-- DATA RETENTION FUNCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION purge_old_deleted_messages()
RETURNS INTEGER AS $$
DECLARE v_count INTEGER;
BEGIN
  DELETE FROM chat_messages WHERE deleted_at IS NOT NULL AND deleted_at < NOW() - INTERVAL '90 days';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
GRANT EXECUTE ON FUNCTION purge_old_deleted_messages() TO service_role;

CREATE OR REPLACE FUNCTION purge_old_daily_stats()
RETURNS INTEGER AS $$
DECLARE v_count INTEGER;
BEGIN
  DELETE FROM user_daily_stats WHERE date < CURRENT_DATE - INTERVAL '1 year';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
GRANT EXECUTE ON FUNCTION purge_old_daily_stats() TO service_role;

CREATE TABLE IF NOT EXISTS study_sessions_archive (LIKE study_sessions INCLUDING ALL);
GRANT ALL ON study_sessions_archive TO service_role;


-- ============================================================
-- SERVICE ROLE GRANTS
-- ============================================================
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

COMMIT;
