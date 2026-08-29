-- ============================================
-- Study Sessions & Statistics
-- ============================================

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;

CREATE TABLE IF NOT EXISTS study_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  room_id TEXT,
  branch_id TEXT,
  subject_id TEXT,
  topic TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  validation_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (validation_status IN ('pending', 'valid', 'invalid', 'flagged')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_study_sessions_user_id ON study_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_started_at ON study_sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_study_sessions_user_started ON study_sessions(user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_study_sessions_validation ON study_sessions(validation_status);

ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_crud_own_sessions" ON study_sessions;
CREATE POLICY "users_crud_own_sessions"
  ON study_sessions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can read their own stats
DROP POLICY IF EXISTS "users_read_own_sessions" ON study_sessions;
CREATE POLICY "users_read_own_sessions"
  ON study_sessions FOR SELECT
  USING (auth.uid() = user_id);

-- Admin can read all sessions
DROP POLICY IF EXISTS "admin_read_all_sessions" ON study_sessions;
CREATE POLICY "admin_read_all_sessions"
  ON study_sessions FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

GRANT ALL ON study_sessions TO service_role;
GRANT SELECT, INSERT, UPDATE ON study_sessions TO authenticated;

-- RPC: Compute daily stats for a user
CREATE OR REPLACE FUNCTION get_user_daily_stats(p_user_id UUID, p_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE (
  total_seconds INTEGER,
  session_count INTEGER,
  streak_days INTEGER,
  longest_streak INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH daily AS (
    SELECT
      COALESCE(SUM(duration_seconds), 0) AS total_seconds,
      COUNT(*) FILTER (WHERE validation_status = 'valid') AS session_count
    FROM study_sessions
    WHERE user_id = p_user_id
      AND DATE(started_at AT TIME ZONE COALESCE(
        (SELECT timezone FROM profiles WHERE id = p_user_id),
        'Asia/Kolkata'
      )) = p_date
      AND validation_status = 'valid'
  ),
  streak AS (
    SELECT COUNT(DISTINCT DATE(started_at AT TIME ZONE COALESCE(
      (SELECT timezone FROM profiles WHERE id = p_user_id),
      'Asia/Kolkata'
    ))) AS streak_days
    FROM study_sessions
    WHERE user_id = p_user_id
      AND validation_status = 'valid'
      AND started_at >= (p_date - INTERVAL '1 year')
      AND DATE(started_at AT TIME ZONE COALESCE(
        (SELECT timezone FROM profiles WHERE id = p_user_id),
        'Asia/Kolkata'
      )) <= p_date
  )
  SELECT d.total_seconds, d.session_count, COALESCE(s.streak_days, 0), COALESCE(s.streak_days, 0)
  FROM daily d, streak s;
END;
$$ LANGUAGE plpgsql STABLE;

GRANT EXECUTE ON FUNCTION get_user_daily_stats(UUID, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_daily_stats(UUID, DATE) TO service_role;
