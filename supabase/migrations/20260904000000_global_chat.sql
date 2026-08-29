-- ============================================
-- Global Chat (Premium Feature)
-- ============================================

CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'text',
  deleted_at TIMESTAMPTZ,
  edited_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Anyone can read non-deleted messages
DROP POLICY IF EXISTS "read_chat_messages" ON chat_messages;
CREATE POLICY "read_chat_messages"
  ON chat_messages FOR SELECT
  USING (deleted_at IS NULL);

-- Users can insert their own messages
DROP POLICY IF EXISTS "insert_own_chat_messages" ON chat_messages;
CREATE POLICY "insert_own_chat_messages"
  ON chat_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update own messages
DROP POLICY IF EXISTS "update_own_chat_messages" ON chat_messages;
CREATE POLICY "update_own_chat_messages"
  ON chat_messages FOR UPDATE
  USING (auth.uid() = user_id);

-- Admin can delete any message
DROP POLICY IF EXISTS "admin_delete_chat_messages" ON chat_messages;
CREATE POLICY "admin_delete_chat_messages"
  ON chat_messages FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner'))
  );

GRANT ALL ON chat_messages TO service_role;
GRANT SELECT, INSERT, UPDATE ON chat_messages TO authenticated;

-- Moderation log
CREATE TABLE IF NOT EXISTS moderation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES auth.users(id),
  target_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('mute', 'unmute', 'ban', 'unban', 'delete_message', 'warn')),
  reason TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_moderation_logs_admin ON moderation_logs(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_target ON moderation_logs(target_user_id);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_created ON moderation_logs(created_at DESC);

ALTER TABLE moderation_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_manage_moderation" ON moderation_logs;
CREATE POLICY "admin_manage_moderation"
  ON moderation_logs FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner'))
  );

GRANT ALL ON moderation_logs TO service_role;
GRANT SELECT ON moderation_logs TO authenticated;

-- Muted users table
CREATE TABLE IF NOT EXISTS muted_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  muted_by UUID NOT NULL REFERENCES auth.users(id),
  reason TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE muted_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_manage_mutes" ON muted_users;
CREATE POLICY "admin_manage_mutes"
  ON muted_users FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner'))
  );

DROP POLICY IF EXISTS "read_muted_status" ON muted_users;
CREATE POLICY "read_muted_status"
  ON muted_users FOR SELECT
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner')
  ));

GRANT ALL ON muted_users TO service_role;
GRANT SELECT, INSERT, DELETE ON muted_users TO authenticated;

-- Banned users table
CREATE TABLE IF NOT EXISTS banned_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  banned_by UUID NOT NULL REFERENCES auth.users(id),
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE banned_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_manage_bans" ON banned_users;
CREATE POLICY "admin_manage_bans"
  ON banned_users FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner'))
  );

GRANT ALL ON banned_users TO service_role;
GRANT SELECT, INSERT, DELETE ON banned_users TO authenticated;
