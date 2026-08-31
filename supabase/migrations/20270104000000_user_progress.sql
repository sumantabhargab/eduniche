-- ============================================
-- User Progress & Diagnostic System
-- Tracks diagnostic results, topic performance, study plans, and doubt usage
-- ============================================

BEGIN;

-- ─── Diagnostic Results ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_diagnostic_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  paper_id TEXT NOT NULL,
  total_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL DEFAULT 10,
  correct_answers INTEGER NOT NULL DEFAULT 0,
  topic_scores JSONB NOT NULL DEFAULT '{}'::jsonb, -- { "Subject A": { correct: 2, total: 3 }, ... }
  question_ids TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_diagnostic_user_paper ON user_diagnostic_results(user_id, paper_id);
CREATE INDEX IF NOT EXISTS idx_diagnostic_user_created ON user_diagnostic_results(user_id, created_at DESC);

ALTER TABLE user_diagnostic_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_crud_own_diagnostic" ON user_diagnostic_results;
CREATE POLICY "users_crud_own_diagnostic"
  ON user_diagnostic_results FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── Topic Performance (rolling) ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_topic_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  paper_id TEXT NOT NULL,
  subject TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  correct INTEGER NOT NULL DEFAULT 0,
  accuracy NUMERIC(5,2) NOT NULL DEFAULT 0, -- percentage
  last_practiced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, paper_id, subject)
);

CREATE INDEX IF NOT EXISTS idx_topic_perf_user_paper ON user_topic_performance(user_id, paper_id);
CREATE INDEX IF NOT EXISTS idx_topic_perf_user_subject ON user_topic_performance(user_id, paper_id, subject);

ALTER TABLE user_topic_performance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_crud_own_topic_perf" ON user_topic_performance;
CREATE POLICY "users_crud_own_topic_perf"
  ON user_topic_performance FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── Study Plans ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_study_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  paper_id TEXT NOT NULL,
  diagnostic_result_id UUID REFERENCES user_diagnostic_results(id) ON DELETE SET NULL,
  title TEXT NOT NULL DEFAULT 'Your 7-Day Study Plan',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_study_plans_user ON user_study_plans(user_id, status);
CREATE INDEX IF NOT EXISTS idx_study_plans_user_paper ON user_study_plans(user_id, paper_id);

ALTER TABLE user_study_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_crud_own_plans" ON user_study_plans;
CREATE POLICY "users_crud_own_plans"
  ON user_study_plans FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── Study Plan Items ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_study_plan_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES user_study_plans(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL, -- 1-7
  subject TEXT NOT NULL,
  topic TEXT NOT NULL,
  task_type TEXT NOT NULL DEFAULT 'study' CHECK (task_type IN ('study', 'practice', 'review', 'test')),
  estimated_minutes INTEGER NOT NULL DEFAULT 30,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_plan_items_plan ON user_study_plan_items(plan_id, day_number);
CREATE UNIQUE INDEX IF NOT EXISTS idx_plan_items_unique ON user_study_plan_items(plan_id, day_number, subject, topic);

ALTER TABLE user_study_plan_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_crud_own_plan_items" ON user_study_plan_items;
CREATE POLICY "users_crud_own_plan_items"
  ON user_study_plan_items FOR ALL
  USING (
    plan_id IN (SELECT id FROM user_study_plans WHERE user_id = auth.uid())
  )
  WITH CHECK (
    plan_id IN (SELECT id FROM user_study_plans WHERE user_id = auth.uid())
  );

-- ─── Doubt Usage Tracking ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS doubt_usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  message_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_doubt_usage_user_date ON doubt_usage_tracking(user_id, date);

ALTER TABLE doubt_usage_tracking ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_read_own_doubt_usage" ON doubt_usage_tracking;
CREATE POLICY "users_read_own_doubt_usage"
  ON doubt_usage_tracking FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "service_insert_doubt_usage" ON doubt_usage_tracking;
CREATE POLICY "service_insert_doubt_usage"
  ON doubt_usage_tracking FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- ─── Updated-at triggers ───────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_user_progress_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_diagnostic_updated ON user_diagnostic_results;
CREATE TRIGGER trigger_diagnostic_updated
  BEFORE UPDATE ON user_diagnostic_results
  FOR EACH ROW EXECUTE FUNCTION update_user_progress_timestamp();

DROP TRIGGER IF EXISTS trigger_topic_perf_updated ON user_topic_performance;
CREATE TRIGGER trigger_topic_perf_updated
  BEFORE UPDATE ON user_topic_performance
  FOR EACH ROW EXECUTE FUNCTION update_user_progress_timestamp();

DROP TRIGGER IF EXISTS trigger_study_plan_updated ON user_study_plans;
CREATE TRIGGER trigger_study_plan_updated
  BEFORE UPDATE ON user_study_plans
  FOR EACH ROW EXECUTE FUNCTION update_user_progress_timestamp();

DROP TRIGGER IF EXISTS trigger_doubt_usage_updated ON doubt_usage_tracking;
CREATE TRIGGER trigger_doubt_usage_updated
  BEFORE UPDATE ON doubt_usage_tracking
  FOR EACH ROW EXECUTE FUNCTION update_user_progress_timestamp();

-- ─── RPC: Increment doubt usage (atomic) ──────────────────────────────────────

CREATE OR REPLACE FUNCTION increment_doubt_usage(p_user_id UUID, p_date DATE DEFAULT CURRENT_DATE)
RETURNS INTEGER AS $$
DECLARE
  new_count INTEGER;
BEGIN
  INSERT INTO doubt_usage_tracking (user_id, date, message_count)
  VALUES (p_user_id, p_date, 1)
  ON CONFLICT (user_id, date)
  DO UPDATE SET message_count = doubt_usage_tracking.message_count + 1
  RETURNING message_count INTO new_count;
  RETURN new_count;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION increment_doubt_usage(UUID, DATE) TO service_role;

-- ─── RPC: Get doubt usage for a user today ────────────────────────────────────

CREATE OR REPLACE FUNCTION get_doubt_usage_today(p_user_id UUID, p_date DATE DEFAULT CURRENT_DATE)
RETURNS INTEGER AS $$
DECLARE
  msg_count INTEGER;
BEGIN
  SELECT COALESCE(message_count, 0) INTO msg_count
  FROM doubt_usage_tracking
  WHERE user_id = p_user_id AND date = p_date;
  RETURN COALESCE(msg_count, 0);
END;
$$ LANGUAGE plpgsql STABLE;

GRANT EXECUTE ON FUNCTION get_doubt_usage_today(UUID, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_doubt_usage_today(UUID, DATE) TO service_role;

-- Service role bypasses all RLS
GRANT ALL ON user_diagnostic_results TO service_role;
GRANT ALL ON user_topic_performance TO service_role;
GRANT ALL ON user_study_plans TO service_role;
GRANT ALL ON user_study_plan_items TO service_role;
GRANT ALL ON doubt_usage_tracking TO service_role;

COMMIT;
