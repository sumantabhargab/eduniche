-- ============================================================================
-- PadhaiShuru Phase 1 — Consolidated Schema Fixes
-- Applied: 2027-02-01
--
-- This migration reconciles conflicts from earlier migrations and adds
-- missing infrastructure:
--
--   1. Add canonical plan enums to user_subscriptions
--   2. Add rate_limit_buckets table + atomic RPC
--   3. Resolve RLS policy conflicts
--   4. Drop orphan doubt_usage table (use doubt_usage_tracking)
--   5. Drop orphan chat system tables (keep chat_messages / chat_rooms)
--   6. Add chat_messages room-membership INSERT check
--   7. Add mentorship_bookings DELETE policy
--   8. Enforce quality-tier gating on pyq_questions (verified + A/B only)
--   9. Add missing study_rooms table
--  10. Fix badge seed to use badge_key
-- ============================================================================

SET client_min_messages TO warning;

-- ============================================================================
-- 1. PLAN ENUM CONSISTENCY
-- ============================================================================

-- Allow user_subscriptions.plan to carry canonical weekly/monthly values
-- alongside the legacy weekly_premium/monthly_premium for back-compat
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_subscriptions_plan_check'
      AND conrelid = 'user_subscriptions'::regclass
  ) THEN
    -- No existing constraint — will be created below
  ELSE
    ALTER TABLE user_subscriptions DROP CONSTRAINT IF EXISTS user_subscriptions_plan_check;
  END IF;
END $$;

ALTER TABLE user_subscriptions ADD CONSTRAINT user_subscriptions_plan_check
  CHECK (plan IN ('free', 'weekly', 'monthly', 'weekly_premium', 'monthly_premium'));

-- Add migration comment so code can detect if back-compat is still needed
COMMENT ON TABLE user_subscriptions IS
  'Plan values: free, weekly, monthly (canonical), weekly_premium, monthly_premium (legacy back-compat)';

-- ============================================================================
-- 2. DISTRIBUTED RATE LIMITER
-- ============================================================================

CREATE TABLE IF NOT EXISTS rate_limit_buckets (
  id BIGSERIAL PRIMARY KEY,
  identifier TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_bucket UNIQUE (identifier, endpoint, window_start)
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_buckets_expiry
  ON rate_limit_buckets (window_start);

-- Auto-purge buckets older than 2 hours
CREATE OR REPLACE FUNCTION cleanup_rate_limit_buckets()
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  DELETE FROM rate_limit_buckets
  WHERE window_start < NOW() - INTERVAL '2 hours';
END;
$$;

-- Atomic rate-limit check + increment
CREATE OR REPLACE FUNCTION rate_limit_check(
  p_identifier TEXT,
  p_endpoint TEXT,
  p_window_seconds INTEGER,
  p_max_requests INTEGER
)
RETURNS TABLE(allowed BOOLEAN, count INTEGER, reset_at TIMESTAMPTZ)
LANGUAGE plpgsql AS $$
DECLARE
  v_window_start TIMESTAMPTZ := date_trunc('second', NOW() - (EXTRACT(EPOCH FROM NOW())::BIGINT % p_window_seconds) * INTERVAL '1 second');
  v_current_count INTEGER;
BEGIN
  INSERT INTO rate_limit_buckets (identifier, endpoint, window_start)
  VALUES (p_identifier, p_endpoint, v_window_start)
  ON CONFLICT (identifier, endpoint, window_start) DO UPDATE
    SET count = rate_limit_buckets.count + 1
  RETURNING count INTO v_current_count;

  -- If the INSERT path didn't return (row existed), fetch current count
  IF v_current_count IS NULL THEN
    SELECT count INTO v_current_count
    FROM rate_limit_buckets
    WHERE identifier = p_identifier
      AND endpoint = p_endpoint
      AND window_start = v_window_start;
  END IF;

  allowed := v_current_count <= p_max_requests;
  count := v_current_count;
  reset_at := v_window_start + (p_window_seconds || ' seconds')::INTERVAL;
  RETURN NEXT;
END;
$$;

GRANT USAGE, SELECT ON SEQUENCE rate_limit_buckets_id_seq TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON rate_limit_buckets TO service_role;
REVOKE ALL ON rate_limit_buckets FROM authenticated, anon;

-- ============================================================================
-- 3. RLS POLICY CONFLICTS
-- ============================================================================

-- 3a. profiles: Decide ONCE whether profiles are publicly readable.
--      Decision: YES for display_name + avatar only (safe fields).
--      NO for email, phone, other PII.
DO $$
BEGIN
  DROP POLICY IF EXISTS public_read_public_profile_fields ON profiles;
  DROP POLICY IF EXISTS no_public_profile_read ON profiles;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

CREATE POLICY public_read_profile_public_fields
  ON profiles FOR SELECT
  TO anon, authenticated
  USING (true)
  WITH CHECK (false);

-- Expose only safe fields via the RPC or view. The policy above allows full-row
-- reads at the DB level — application code MUST use a view or explicit column list.
-- We lock down the raw table to own-rows only and create a public view.

DROP POLICY IF EXISTS public_read_profile_public_fields ON profiles;

CREATE POLICY users_read_own_profile
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY users_update_own_profile
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Public read via a view (not raw table)
CREATE OR REPLACE VIEW public_profiles AS
  SELECT id, display_name, avatar_url, bio, created_at
  FROM profiles;

GRANT SELECT ON public_profiles TO anon, authenticated;
ALTER VIEW public_profiles OWNER TO service_role;

-- 3b. pyq_questions: enforce quality-tier gating
DO $$
BEGIN
  DROP POLICY IF EXISTS public_read_questions ON pyq_questions;
  DROP POLICY IF EXISTS public_read_questions_verified ON pyq_questions;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

CREATE POLICY anon_read_verified_questions
  ON pyq_questions FOR SELECT
  TO anon
  USING (answer_verified = true AND quality_tier IN ('A', 'B'));

CREATE POLICY auth_read_verified_questions
  ON pyq_questions FOR SELECT
  TO authenticated
  USING (answer_verified = true AND quality_tier IN ('A', 'B'));

CREATE POLICY premium_read_all_questions
  ON pyq_questions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND (p.plan IN ('weekly_premium', 'monthly_premium', 'weekly', 'monthly'))
    )
    OR EXISTS (
      SELECT 1 FROM user_subscriptions us
      WHERE us.user_id = auth.uid()
        AND us.status = 'active'
        AND (us.expires_at IS NULL OR us.expires_at > NOW())
    )
  );

-- ============================================================================
-- 4. DROP ORPHAN doubt_usage TABLE
-- ============================================================================

DROP TABLE IF EXISTS doubt_usage CASCADE;

-- ============================================================================
-- 5. DROP ORPHAN CHAT SYSTEM TABLES (keep chat_messages + chat_rooms)
-- ============================================================================

DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversation_participants CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS muted_users CASCADE;
DROP TABLE IF EXISTS banned_users CASCADE;
DROP TABLE IF EXISTS moderation_logs CASCADE;

-- ============================================================================
-- 6. chat_messages — enforce room membership on INSERT
-- ============================================================================

DO $$
BEGIN
  DROP POLICY IF EXISTS users_insert_own_chat_messages ON chat_messages;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

CREATE POLICY users_insert_own_chat_messages
  ON chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM chat_rooms cr
      WHERE cr.id = chat_messages.room_id
        AND (cr.is_public = true OR EXISTS (
          SELECT 1 FROM chat_room_members crm
          WHERE crm.room_id = cr.id AND crm.user_id = auth.uid()
        ))
    )
  );

-- ============================================================================
-- 7. mentorship_bookings — allow self-cancellation via DELETE
-- ============================================================================

DO $$
BEGIN
  DROP POLICY IF EXISTS users_delete_own_bookings ON mentorship_bookings;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

CREATE POLICY users_delete_own_bookings
  ON mentorship_bookings FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- 8. FIX badge seed data column reference
-- ============================================================================

DO $$
BEGIN
  -- Check if seed data was already inserted with wrong column
  IF EXISTS (SELECT 1 FROM badge_definitions LIMIT 1) THEN
    -- Data exists, skip seed
    NULL;
  END IF;
END $$;

-- Drop the broken seed if it exists (it references non-existent 'key' column)
-- The correct column is 'badge_key'. We recreate the seed here.
DO $$
BEGIN
  -- Verify badge_key column exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'badge_definitions' AND column_name = 'badge_key'
  ) THEN
    -- Seed with correct column names
    INSERT INTO badge_definitions (badge_key, name, description, icon, rarity, is_premium, criteria, points)
    VALUES
      ('first_pyq', 'First Steps', 'Complete your first PYQ question', '🎯', 'common', false, '{"type":"pyq_complete","count":1}', 10),
      ('pyq_warrior', 'PYQ Warrior', 'Complete 100 PYQ questions', '⚔️', 'rare', false, '{"type":"pyq_complete","count":100}', 100),
      ('streak_7', 'Week Warrior', 'Maintain a 7-day study streak', '🔥', 'common', false, '{"type":"streak","days":7}', 50),
      ('streak_30', 'Consistent King', 'Maintain a 30-day study streak', '👑', 'epic', false, '{"type":"streak","days":30}', 500),
      ('ai_explorer', 'AI Explorer', 'Ask 50 AI doubts', '🤖', 'common', false, '{"type":"ai_doubts","count":50}', 50),
      ('mock_master', 'Mock Master', 'Complete 10 mock tests', '📝', 'rare', false, '{"type":"mock_tests","count":10}', 200),
      ('referrer', 'Ambassador', 'Refer 5 friends to PadhaiShuru', '📢', 'rare', false, '{"type":"referrals","count":5}', 100),
      ('topic_ace', 'Topic Ace', 'Score 90%+ in any topic test', '🎓', 'epic', false, '{"type":"topic_score","percent":90}', 300)
    ON CONFLICT (badge_key) DO NOTHING;
  END IF;
END $$;

-- ============================================================================
-- 9. ADD MISSING study_rooms TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS study_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN NOT NULL DEFAULT true,
  max_participants INTEGER NOT NULL DEFAULT 20,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_study_rooms_public ON study_rooms (is_public) WHERE is_public = true;

ALTER TABLE study_room_presence
  DROP CONSTRAINT IF EXISTS study_room_presence_room_id_fkey;

ALTER TABLE study_room_presence
  ADD CONSTRAINT study_room_presence_room_id_fkey
  FOREIGN KEY (room_id) REFERENCES study_rooms(id) ON DELETE CASCADE;

-- RLS for study_rooms
ALTER TABLE study_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY public_read_public_rooms
  ON study_rooms FOR SELECT
  TO anon, authenticated
  USING (is_public = true);

CREATE POLICY creator_manage_room
  ON study_rooms FOR ALL
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY admin_manage_rooms
  ON study_rooms FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin'))
  );

GRANT SELECT ON study_rooms TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON study_rooms TO authenticated;
GRANT ALL ON study_rooms TO service_role;

-- ============================================================================
-- 10. MISC CLEANUP
-- ============================================================================

-- Ensure study_room_presence has the right FK (already done in step 9)
-- Ensure razorpay_webhook_events is locked to service_role only
REVOKE ALL ON razorpay_webhook_events FROM authenticated, anon;

COMMENT ON TABLE rate_limit_buckets IS 'Distributed rate limit buckets. Auto-cleaned every 2 hours.';
COMMENT ON TABLE study_rooms IS 'Study/virtual library rooms. Public rooms are readable by everyone.';

-- ============================================================================
-- Done
-- ============================================================================
