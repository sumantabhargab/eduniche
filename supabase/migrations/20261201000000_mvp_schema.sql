-- ============================================
-- MVP SCHEMA — Missing tables, columns, RPCs
-- This migration brings the remote database
-- from its current state to the full MVP schema.
-- All statements are idempotent (IF NOT EXISTS,
-- DROP IF EXISTS, OR REPLACE, ON CONFLICT DO NOTHING).
-- ============================================

-- ─── Extensions ──────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ─── Profiles: Add missing columns ──────────────────────────────────────────

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS username TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS daily_goal_minutes INTEGER NOT NULL DEFAULT 120,
  ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata';

-- Fix role CHECK to include 'owner' (referenced by global chat admin policies)
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('admin', 'student', 'owner'));

-- updated_at trigger function
CREATE OR REPLACE FUNCTION update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

DROP TRIGGER IF EXISTS trigger_update_profiles_updated_at ON profiles;
CREATE TRIGGER trigger_update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_profiles_updated_at();

-- ─── Profiles: Replace RLS policies ─────────────────────────────────────────

DROP POLICY IF EXISTS "Users read own profile" ON profiles;
DROP POLICY IF EXISTS "Users update own profile" ON profiles;
DROP POLICY IF EXISTS "users_read_own_profile" ON profiles;
DROP POLICY IF EXISTS "users_update_own_profile" ON profiles;
DROP POLICY IF EXISTS "public_read_public_profile_fields" ON profiles;

CREATE POLICY "users_read_own_profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "users_update_own_profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Public can read public profile fields (chat display, leaderboard, etc.)
CREATE POLICY "public_read_public_profile_fields"
  ON profiles FOR SELECT
  USING (true);

-- ─── Content Resources: Add access_tier ─────────────────────────────────────

ALTER TABLE content_resources
  ADD COLUMN IF NOT EXISTS access_tier TEXT NOT NULL DEFAULT 'free'
    CHECK (access_tier IN ('free', 'premium'));

-- Replace read policies with tier-aware policies
DROP POLICY IF EXISTS "Public read published resources" ON content_resources;
DROP POLICY IF EXISTS "public_read_published_resources" ON content_resources;
DROP POLICY IF EXISTS "public_read_published_resources_meta" ON content_resources;
DROP POLICY IF EXISTS "public_read_published_free" ON content_resources;
DROP POLICY IF EXISTS "authenticated_read_own_premium" ON content_resources;
DROP POLICY IF EXISTS "admin_full_resources" ON content_resources;

CREATE POLICY "public_read_published_free"
  ON content_resources FOR SELECT
  USING (visibility = 'published' AND access_tier = 'free');

CREATE POLICY "authenticated_read_own_premium"
  ON content_resources FOR SELECT
  USING (
    visibility = 'published'
    AND (
      access_tier = 'free'
      OR EXISTS (
        SELECT 1 FROM user_subscriptions
        WHERE user_id = auth.uid()
          AND status = 'active'
          AND (expires_at IS NULL OR expires_at > NOW())
      )
    )
  );

CREATE POLICY "admin_full_resources"
  ON content_resources FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner'))
  );

-- ─── Study Sessions ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS study_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  room_id TEXT,
  branch_id TEXT,
  subject_id TEXT,
  topic TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  validation_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (validation_status IN ('pending', 'valid', 'invalid', 'flagged')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_study_sessions_user ON study_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_status ON study_sessions(validation_status);
CREATE INDEX IF NOT EXISTS idx_study_sessions_started ON study_sessions(started_at);
CREATE INDEX IF NOT EXISTS idx_study_sessions_user_status ON study_sessions(user_id, validation_status);

ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_crud_own_sessions" ON study_sessions;
DROP POLICY IF EXISTS "admin_read_all_sessions" ON study_sessions;

CREATE POLICY "users_crud_own_sessions"
  ON study_sessions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "admin_read_all_sessions"
  ON study_sessions FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner'))
  );

GRANT ALL ON study_sessions TO service_role;
GRANT SELECT, INSERT, UPDATE ON study_sessions TO authenticated;

-- ─── User Subscriptions ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'monthly' CHECK (plan IN ('monthly', 'weekly')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
  provider TEXT NOT NULL DEFAULT 'razorpay',
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT UNIQUE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_subscriptions_user_active
  ON user_subscriptions(user_id)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);

ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_read_own_subscription" ON user_subscriptions;
DROP POLICY IF EXISTS "admin_full_subscriptions" ON user_subscriptions;

CREATE POLICY "users_read_own_subscription"
  ON user_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "admin_full_subscriptions"
  ON user_subscriptions FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner'))
  );

GRANT ALL ON user_subscriptions TO service_role;
GRANT SELECT, INSERT ON user_subscriptions TO authenticated;

-- ─── RPC: has_active_subscription() ─────────────────────────────────────────

CREATE OR REPLACE FUNCTION has_active_subscription(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_subscriptions
    WHERE user_id = p_user_id
      AND status = 'active'
      AND (expires_at IS NULL OR expires_at > NOW())
  );
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

GRANT EXECUTE ON FUNCTION has_active_subscription(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION has_active_subscription(UUID) TO anon;

-- ─── RPC: expire_subscriptions() ────────────────────────────────────────────

CREATE OR REPLACE FUNCTION expire_subscriptions()
RETURNS INTEGER AS $$
DECLARE
  affected INTEGER;
BEGIN
  UPDATE user_subscriptions
  SET status = 'expired', updated_at = NOW()
  WHERE status = 'active'
    AND expires_at IS NOT NULL
    AND expires_at <= NOW();

  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

GRANT EXECUTE ON FUNCTION expire_subscriptions() TO service_role;

-- ─── RPC: get_user_daily_stats() ────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_user_daily_stats(p_user_id UUID, p_timezone TEXT DEFAULT 'Asia/Kolkata')
RETURNS TABLE (
  date TEXT,
  total_seconds BIGINT,
  session_count BIGINT,
  streak INTEGER
) AS $$
DECLARE
  v_today DATE;
  v_streak INTEGER := 0;
  v_check_date DATE;
BEGIN
  v_today := (NOW() AT TIME ZONE p_timezone)::DATE;

  -- Calculate streak: count consecutive days with sessions going back from today
  FOR v_check_date IN
    SELECT DISTINCT (started_at AT TIME ZONE p_timezone)::DATE
    FROM study_sessions
    WHERE user_id = p_user_id
      AND validation_status = 'valid'
      AND started_at IS NOT NULL
    ORDER BY 1 DESC
  LOOP
    IF v_check_date = v_today OR v_check_date = v_today - (v_streak + 1) * INTERVAL '1 day' THEN
      v_streak := v_streak + 1;
    ELSIF v_check_date < v_today - (v_streak + 1) * INTERVAL '1 day' THEN
      EXIT;
    ELSE
      v_streak := v_streak + 1;
    END IF;
  END LOOP;

  RETURN QUERY
  SELECT
    (ds.day AT TIME ZONE p_timezone)::TEXT,
    COALESCE(SUM(ds.duration_seconds), 0)::BIGINT,
    COUNT(*)::BIGINT,
    v_streak
  FROM (
    SELECT
      (started_at AT TIME ZONE p_timezone)::DATE AS day,
      SUM(duration_seconds) AS duration_seconds,
      COUNT(*) AS cnt
    FROM study_sessions
    WHERE user_id = p_user_id
      AND validation_status = 'valid'
      AND (started_at AT TIME ZONE p_timezone)::DATE >= v_today - INTERVAL '30 days'
    GROUP BY (started_at AT TIME ZONE p_timezone)::DATE
  ) ds
  GROUP BY ds.day
  ORDER BY ds.day DESC
  LIMIT 30;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

GRANT EXECUTE ON FUNCTION get_user_daily_stats(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_daily_stats(UUID, TEXT) TO anon;

-- ─── Badges ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS badge_definitions (
  badge_key TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  rarity TEXT NOT NULL DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  is_premium BOOLEAN NOT NULL DEFAULT false,
  criteria JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_key TEXT NOT NULL REFERENCES badge_definitions(badge_key),
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, badge_key)
);

CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id);

ALTER TABLE badge_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_badge_definitions" ON badge_definitions;
DROP POLICY IF EXISTS "admin_full_badge_definitions" ON badge_definitions;
DROP POLICY IF EXISTS "users_read_own_badges" ON user_badges;
DROP POLICY IF EXISTS "users_read_all_badges" ON user_badges;
DROP POLICY IF EXISTS "admin_full_user_badges" ON user_badges;

CREATE POLICY "public_read_badge_definitions" ON badge_definitions FOR SELECT USING (true);
CREATE POLICY "admin_full_badge_definitions" ON badge_definitions FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner')));

CREATE POLICY "users_read_all_badges" ON user_badges FOR SELECT USING (true);
CREATE POLICY "users_insert_own_badges" ON user_badges FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "admin_full_user_badges" ON user_badges FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner')));

GRANT ALL ON badge_definitions TO service_role;
GRANT SELECT ON badge_definitions TO authenticated, anon;
GRANT ALL ON user_badges TO service_role;
GRANT SELECT, INSERT ON user_badges TO authenticated;

-- Seed badge definitions
INSERT INTO badge_definitions (badge_key, name, description, icon, rarity, criteria) VALUES
  ('first_session', 'First Steps', 'Completed your first study session', '🎯', 'common', '{"sessions_required": 1}')
ON CONFLICT (badge_key) DO NOTHING;

INSERT INTO badge_definitions (badge_key, name, description, icon, rarity, criteria) VALUES
  ('consistent', 'Consistent', 'Studied for 3 consecutive days', '🔥', 'rare', '{"streak_required": 3}')
ON CONFLICT (badge_key) DO NOTHING;

INSERT INTO badge_definitions (badge_key, name, description, icon, rarity, criteria) VALUES
  ('scholar', 'Scholar', 'Accumulated 10 minutes of study time', '📚', 'common', '{"minutes_required": 10}')
ON CONFLICT (badge_key) DO NOTHING;

INSERT INTO badge_definitions (badge_key, name, description, icon, rarity, criteria) VALUES
  ('dedicated', 'Dedicated', 'Accumulated 50 minutes of study time', '💪', 'rare', '{"minutes_required": 50}')
ON CONFLICT (badge_key) DO NOTHING;

INSERT INTO badge_definitions (badge_key, name, description, icon, rarity, criteria) VALUES
  ('hundred_club', 'Hundred Club', 'Accumulated 100 minutes of study time', '💯', 'epic', '{"minutes_required": 100}')
ON CONFLICT (badge_key) DO NOTHING;

INSERT INTO badge_definitions (badge_key, name, description, icon, rarity, criteria) VALUES
  ('deep_focus', 'Deep Focus', 'Completed a single session of 5+ hours', '🧠', 'epic', '{"single_session_minutes": 300}')
ON CONFLICT (badge_key) DO NOTHING;

INSERT INTO badge_definitions (badge_key, name, description, icon, rarity, criteria) VALUES
  ('elite_scholar', 'Elite Scholar', 'Accumulated 500 minutes of study time', '🏆', 'legendary', '{"minutes_required": 500}')
ON CONFLICT (badge_key) DO NOTHING;

-- ─── Global Chat ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'text' CHECK (content_type IN ('text', 'image', 'file')),
  reply_to UUID REFERENCES chat_messages(id) ON DELETE SET NULL,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  deleted_at TIMESTAMPTZ,
  edited_at TIMESTAMPTZ,
  send_state TEXT NOT NULL DEFAULT 'sent' CHECK (send_state IN ('sending', 'sent', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_deleted ON chat_messages(deleted_at);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_chat_messages" ON chat_messages;
DROP POLICY IF EXISTS "users_insert_own_messages" ON chat_messages;
DROP POLICY IF EXISTS "users_update_own_messages" ON chat_messages;
DROP POLICY IF EXISTS "admin_delete_chat_messages" ON chat_messages;

CREATE POLICY "public_read_chat_messages"
  ON chat_messages FOR SELECT
  USING (deleted_at IS NULL);

CREATE POLICY "users_insert_own_messages"
  ON chat_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_update_own_messages"
  ON chat_messages FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "admin_delete_chat_messages"
  ON chat_messages FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner'))
  );

GRANT ALL ON chat_messages TO service_role;
GRANT SELECT, INSERT, UPDATE ON chat_messages TO authenticated;

-- Muted users
CREATE TABLE IF NOT EXISTS muted_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  muted_by UUID NOT NULL REFERENCES auth.users(id),
  reason TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE muted_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_read_own_mute" ON muted_users;
DROP POLICY IF EXISTS "admin_full_muted_users" ON muted_users;

CREATE POLICY "users_read_own_mute"
  ON muted_users FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "admin_full_muted_users"
  ON muted_users FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner'))
  );

GRANT ALL ON muted_users TO service_role;
GRANT SELECT ON muted_users TO authenticated;

-- Banned users
CREATE TABLE IF NOT EXISTS banned_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  banned_by UUID NOT NULL REFERENCES auth.users(id),
  reason TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE banned_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_read_own_ban" ON banned_users;
DROP POLICY IF EXISTS "admin_full_banned_users" ON banned_users;

CREATE POLICY "users_read_own_ban"
  ON banned_users FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "admin_full_banned_users"
  ON banned_users FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner'))
  );

GRANT ALL ON banned_users TO service_role;
GRANT SELECT ON banned_users TO authenticated;

-- Moderation logs
CREATE TABLE IF NOT EXISTS moderation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  moderator_id UUID NOT NULL REFERENCES auth.users(id),
  target_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('mute', 'unmute', 'ban', 'unban', 'delete_message', 'warn', 'pin', 'unpin')),
  message_id UUID REFERENCES chat_messages(id) ON DELETE CASCADE,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_moderation_logs_target ON moderation_logs(target_user_id);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_moderator ON moderation_logs(moderator_id);

ALTER TABLE moderation_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_full_moderation_logs" ON moderation_logs;

CREATE POLICY "admin_full_moderation_logs"
  ON moderation_logs FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner'))
  );

GRANT ALL ON moderation_logs TO service_role;
GRANT SELECT, INSERT ON moderation_logs TO authenticated;

-- ─── AI Doubt Engine ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_conversations_user ON ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation ON ai_messages(conversation_id, created_at);

ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_crud_own_ai_conversations" ON ai_conversations;
DROP POLICY IF EXISTS "users_read_own_ai_messages" ON ai_messages;

CREATE POLICY "users_crud_own_ai_conversations"
  ON ai_conversations FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_read_own_ai_messages"
  ON ai_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM ai_conversations
      WHERE id = conversation_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "users_insert_own_ai_messages"
  ON ai_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM ai_conversations
      WHERE id = conversation_id AND user_id = auth.uid()
    )
  );

GRANT ALL ON ai_conversations TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ai_conversations TO authenticated;
GRANT ALL ON ai_messages TO service_role;
GRANT SELECT, INSERT ON ai_messages TO authenticated;

-- ─── Study Rooms: Presence table ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS study_room_presence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id TEXT NOT NULL REFERENCES study_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(room_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_study_room_presence_room ON study_room_presence(room_id);
CREATE INDEX IF NOT EXISTS idx_study_room_presence_user ON study_room_presence(user_id);

ALTER TABLE study_room_presence ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_manage_own_presence" ON study_room_presence;
DROP POLICY IF EXISTS "public_read_open_room_presence" ON study_room_presence;

CREATE POLICY "users_manage_own_presence"
  ON study_room_presence FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "public_read_open_room_presence"
  ON study_room_presence FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM study_rooms WHERE id = room_id AND is_open = true)
  );

GRANT ALL ON study_room_presence TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON study_room_presence TO authenticated;

-- ─── RPC: get_folder_breadcrumbs() ──────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_folder_breadcrumbs(p_folder_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  parent_id UUID,
  path TEXT,
  depth INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE breadcrumb AS (
    SELECT id, name, parent_id, path, depth
    FROM content_folders
    WHERE id = p_folder_id

    UNION ALL

    SELECT cf.id, cf.name, cf.parent_id, cf.path, cf.depth
    FROM content_folders cf
    INNER JOIN breadcrumb b ON cf.id = b.parent_id
  )
  SELECT * FROM breadcrumb ORDER BY depth ASC;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

GRANT EXECUTE ON FUNCTION get_folder_breadcrumbs(UUID) TO anon, authenticated, service_role;

-- ─── Storage: Chat media bucket ─────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-media', 'chat-media', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "authenticated_upload_chat_media" ON storage.objects;
DROP POLICY IF EXISTS "public_read_chat_media" ON storage.objects;
DROP POLICY IF EXISTS "users_update_own_chat_media" ON storage.objects;
DROP POLICY IF EXISTS "users_delete_own_chat_media" ON storage.objects;

CREATE POLICY "authenticated_upload_chat_media"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'chat-media'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "public_read_chat_media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'chat-media');

CREATE POLICY "users_update_own_chat_media"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'chat-media'
    AND auth.uid() = owner_id
  );

CREATE POLICY "users_delete_own_chat_media"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'chat-media'
    AND auth.uid() = owner_id
  );

GRANT ALL ON storage.objects TO service_role;

-- ─── Fix: Ensure study_rooms has correct columns ────────────────────────────

-- Add columns that might be missing from manual setup
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'study_rooms' AND column_name = 'mode') THEN
    ALTER TABLE study_rooms ADD COLUMN mode TEXT NOT NULL DEFAULT 'focus' CHECK (mode IN ('focus', 'discussion'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'study_rooms' AND column_name = 'max_participants') THEN
    ALTER TABLE study_rooms ADD COLUMN max_participants INTEGER NOT NULL DEFAULT 10;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'study_rooms' AND column_name = 'is_open') THEN
    ALTER TABLE study_rooms ADD COLUMN is_open BOOLEAN NOT NULL DEFAULT true;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'study_rooms' AND column_name = 'seed') THEN
    ALTER TABLE study_rooms ADD COLUMN seed TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'study_rooms' AND column_name = 'created_at') THEN
    ALTER TABLE study_rooms ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- Ensure RLS on study_rooms
ALTER TABLE study_rooms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_open_rooms" ON study_rooms;
DROP POLICY IF EXISTS "admin_full_rooms" ON study_rooms;

CREATE POLICY "public_read_open_rooms"
  ON study_rooms FOR SELECT
  USING (is_open = true);

CREATE POLICY "admin_full_rooms"
  ON study_rooms FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner'))
  );

GRANT ALL ON study_rooms TO service_role;
GRANT SELECT ON study_rooms TO anon, authenticated;
