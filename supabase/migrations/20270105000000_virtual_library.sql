-- ============================================
-- Virtual Library Multiplayer System
-- Rooms, presence, chat, sessions
-- ============================================

BEGIN;

-- ─── Rooms ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS virtual_library_rooms (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  icon TEXT DEFAULT '📚',
  max_occupancy INTEGER NOT NULL DEFAULT 50,
  allows_voice BOOLEAN NOT NULL DEFAULT true,
  allows_video BOOLEAN NOT NULL DEFAULT false,
  allows_chat BOOLEAN NOT NULL DEFAULT true,
  is_quiet_zone BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO virtual_library_rooms (id, name, description, icon, max_occupancy, allows_voice, allows_video, allows_chat, is_quiet_zone, sort_order) VALUES
  ('main', 'Main Reading Hall', 'Open study area with desks, bookshelves, and natural light.', '📖', 40, true, false, true, false, 1),
  ('quiet', 'Quiet Zone', 'Silent study space. Voice and video disabled by default.', '🤫', 25, false, false, true, true, 2),
  ('group', 'Group Study', 'Tables for collaborative study. Voice enabled by default.', '👥', 12, true, false, true, false, 3),
  ('discussion', 'Discussion Room', 'Active discussion space. Voice, video, and chat available.', '💬', 8, true, true, true, false, 4),
  ('booth', 'Private Booth', 'Individual study booth. Completely private.', '🔒', 1, false, false, false, false, 5)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE virtual_library_rooms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rooms_public_read" ON virtual_library_rooms;
CREATE POLICY "rooms_public_read"
  ON virtual_library_rooms FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "service_manage_rooms" ON virtual_library_rooms;
CREATE POLICY "service_manage_rooms"
  ON virtual_library_rooms FOR ALL
  TO service_role
  USING (true);

-- ─── Presence ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS virtual_library_presence (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  room_id TEXT NOT NULL REFERENCES virtual_library_rooms(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT '',
  avatar_color TEXT NOT NULL DEFAULT '#4F6EF7',
  avatar_style INTEGER NOT NULL DEFAULT 0,
  position_x REAL NOT NULL DEFAULT 0,
  position_y REAL NOT NULL DEFAULT 0,
  target_x REAL NOT NULL DEFAULT 0,
  target_y REAL NOT NULL DEFAULT 0,
  direction REAL NOT NULL DEFAULT 0,
  is_moving BOOLEAN NOT NULL DEFAULT false,
  is_studying BOOLEAN NOT NULL DEFAULT false,
  study_subject TEXT DEFAULT '',
  mic_enabled BOOLEAN NOT NULL DEFAULT false,
  camera_enabled BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'online' CHECK (status IN ('online', 'away', 'busy')),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  entered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_presence_room ON virtual_library_presence(room_id, last_seen_at DESC);
CREATE INDEX IF NOT EXISTS idx_presence_user ON virtual_library_presence(user_id);

ALTER TABLE virtual_library_presence ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "presence_public_read" ON virtual_library_presence;
CREATE POLICY "presence_public_read"
  ON virtual_library_presence FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "users_upsert_own_presence" ON virtual_library_presence;
CREATE POLICY "users_upsert_own_presence"
  ON virtual_library_presence FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_update_own_presence" ON virtual_library_presence;
CREATE POLICY "users_update_own_presence"
  ON virtual_library_presence FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_delete_own_presence" ON virtual_library_presence;
CREATE POLICY "users_delete_own_presence"
  ON virtual_library_presence FOR DELETE
  USING (auth.uid() = user_id);

-- ─── Chat Messages ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS virtual_library_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id TEXT NOT NULL REFERENCES virtual_library_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  message_type TEXT NOT NULL DEFAULT 'chat' CHECK (message_type IN ('chat', 'system', 'reaction')),
  reply_to UUID REFERENCES virtual_library_messages(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vl_messages_room_created ON virtual_library_messages(room_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vl_messages_user ON virtual_library_messages(user_id, created_at DESC);

ALTER TABLE virtual_library_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "messages_room_read" ON virtual_library_messages;
CREATE POLICY "messages_room_read"
  ON virtual_library_messages FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "users_insert_own_messages" ON virtual_library_messages;
CREATE POLICY "users_insert_own_messages"
  ON virtual_library_messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_update_own_messages" ON virtual_library_messages;
CREATE POLICY "users_update_own_messages"
  ON virtual_library_messages FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_delete_own_messages" ON virtual_library_messages;
CREATE POLICY "users_delete_own_messages"
  ON virtual_library_messages FOR DELETE
  USING (auth.uid() = user_id);

-- ─── Study Sessions ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS virtual_library_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  room_id TEXT NOT NULL REFERENCES virtual_library_rooms(id) ON DELETE CASCADE,
  subject TEXT DEFAULT '',
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vl_sessions_user ON virtual_library_sessions(user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_vl_sessions_room ON virtual_library_sessions(room_id, started_at DESC);

ALTER TABLE virtual_library_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sessions_own_crud" ON virtual_library_sessions;
CREATE POLICY "sessions_own_crud"
  ON virtual_library_sessions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── Report / Moderation ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS virtual_library_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  room_id TEXT REFERENCES virtual_library_rooms(id) ON DELETE SET NULL,
  reason TEXT NOT NULL DEFAULT '',
  details TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'reviewed', 'resolved', 'dismissed')),
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vl_reports_status ON virtual_library_reports(status, created_at DESC);

ALTER TABLE virtual_library_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_create_reports" ON virtual_library_reports;
CREATE POLICY "users_create_reports"
  ON virtual_library_reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "service_manage_reports" ON virtual_library_reports;
CREATE POLICY "service_manage_reports"
  ON virtual_library_reports FOR ALL
  TO service_role
  USING (true);

-- ─── Updated-at trigger ────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_vl_presence_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  NEW.last_seen_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_vl_presence_updated ON virtual_library_presence;
CREATE TRIGGER trigger_vl_presence_updated
  BEFORE UPDATE ON virtual_library_presence
  FOR EACH ROW EXECUTE FUNCTION update_vl_presence_timestamp();

-- ─── Auto-cleanup stale presence ───────────────────────────────────────────────

CREATE OR REPLACE FUNCTION cleanup_stale_vl_presence()
RETURNS void AS $$
BEGIN
  DELETE FROM virtual_library_presence
  WHERE last_seen_at < NOW() - INTERVAL '5 minutes';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── Grant service_role full access ────────────────────────────────────────────

GRANT ALL ON virtual_library_rooms TO service_role;
GRANT ALL ON virtual_library_presence TO service_role;
GRANT ALL ON virtual_library_messages TO service_role;
GRANT ALL ON virtual_library_sessions TO service_role;
GRANT ALL ON virtual_library_reports TO service_role;

COMMIT;
