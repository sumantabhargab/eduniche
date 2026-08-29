-- ============================================
-- AI Doubt Engine — Conversation Persistence
-- ============================================

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;

-- ─── AI Conversations ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT,
  topic TEXT,
  branch TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_created_at ON ai_conversations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_created ON ai_conversations(user_id, created_at DESC);

-- ─── AI Messages ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation_id ON ai_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation_created ON ai_messages(conversation_id, created_at ASC);

-- ─── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;

-- Users can CRUD their own conversations
DROP POLICY IF EXISTS "users_crud_own_conversations" ON ai_conversations;
CREATE POLICY "users_crud_own_conversations"
  ON ai_conversations FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can read their own messages
DROP POLICY IF EXISTS "users_read_own_messages" ON ai_messages;
CREATE POLICY "users_read_own_messages"
  ON ai_messages FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM ai_conversations WHERE user_id = auth.uid()
    )
  );

-- Users can insert messages into their own conversations
DROP POLICY IF EXISTS "users_insert_own_messages" ON ai_messages;
CREATE POLICY "users_insert_own_messages"
  ON ai_messages FOR INSERT
  WITH CHECK (
    conversation_id IN (
      SELECT id FROM ai_conversations WHERE user_id = auth.uid()
    )
  );

-- Service role bypasses all RLS
GRANT ALL ON ai_conversations TO service_role;
GRANT ALL ON ai_messages TO service_role;
GRANT SELECT, INSERT ON ai_conversations TO authenticated;
GRANT SELECT ON ai_messages TO authenticated;
