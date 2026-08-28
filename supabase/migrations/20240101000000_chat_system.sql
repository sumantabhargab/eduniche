-- ============================================================================
-- Chat System Migration
-- Creates conversations, conversation_participants, messages tables
-- with RLS policies and helper RPC functions.
-- ============================================================================

-- Enable pgcrypto for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;

-- ============================================================================
-- TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_message_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  subject text
);

CREATE TABLE IF NOT EXISTS conversation_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT now(),
  last_read_at timestamptz,
  UNIQUE (conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  content_type text NOT NULL DEFAULT 'text',
  created_at timestamptz NOT NULL DEFAULT now(),
  edited_at timestamptz,
  deleted_at timestamptz,
  send_state text NOT NULL DEFAULT 'sent'
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_conversations_created_by ON conversations(created_by);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON conversations(last_message_at DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id ON conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation_id ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_unique ON conversation_participants(conversation_id, user_id);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created_at ON messages(conversation_id, created_at DESC);

-- ============================================================================
-- RLS ENABLE
-- ============================================================================

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CONVERSATIONS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their conversations" ON conversations;
CREATE POLICY "Users can view their conversations" ON conversations
  FOR SELECT
  USING (
    id IN (
      SELECT conversation_id FROM conversation_participants
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
CREATE POLICY "Users can create conversations" ON conversations
  FOR INSERT
  WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "Admins can update conversations" ON conversations;
CREATE POLICY "Admins can update conversations" ON conversations
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- CONVERSATION_PARTICIPANTS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can view participants of their conversations" ON conversation_participants;
CREATE POLICY "Users can view participants of their conversations" ON conversation_participants
  FOR SELECT
  USING (
    conversation_id IN (
      SELECT conversation_id FROM conversation_participants
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can join conversations" ON conversation_participants;
CREATE POLICY "Users can join conversations" ON conversation_participants
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND conversation_id IN (
      SELECT conversation_id FROM conversation_participants
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update own read status" ON conversation_participants;
CREATE POLICY "Users can update own read status" ON conversation_participants
  FOR UPDATE
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all participants" ON conversation_participants;
CREATE POLICY "Admins can view all participants" ON conversation_participants
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can join any conversation" ON conversation_participants;
CREATE POLICY "Admins can join any conversation" ON conversation_participants
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- MESSAGES POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
CREATE POLICY "Users can view messages in their conversations" ON messages
  FOR SELECT
  USING (
    conversation_id IN (
      SELECT conversation_id FROM conversation_participants
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert messages in their conversations" ON messages;
CREATE POLICY "Users can insert messages in their conversations" ON messages
  FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND conversation_id IN (
      SELECT conversation_id FROM conversation_participants
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update own messages" ON messages;
CREATE POLICY "Users can update own messages" ON messages
  FOR UPDATE
  USING (sender_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own messages" ON messages;
CREATE POLICY "Users can delete own messages" ON messages
  FOR DELETE
  USING (sender_id = auth.uid());

-- ============================================================================
-- RPC FUNCTIONS
-- ============================================================================

-- chat_create_conversation
-- Atomically creates a conversation + adds the initiator as a participant.
DROP FUNCTION IF EXISTS chat_create_conversation(uuid, text);
CREATE OR REPLACE FUNCTION chat_create_conversation(
  p_initiator_id uuid,
  p_subject text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_conv_id uuid;
BEGIN
  INSERT INTO conversations (created_by, status, subject)
  VALUES (p_initiator_id, 'open', p_subject)
  RETURNING id INTO v_conv_id;

  INSERT INTO conversation_participants (conversation_id, user_id)
  VALUES (v_conv_id, p_initiator_id);

  RETURN v_conv_id;
END;
$$;

-- chat_send_message
-- Atomically inserts a message and updates the conversation's last_message_at.
DROP FUNCTION IF EXISTS chat_send_message(uuid, uuid, text, text, text);
CREATE OR REPLACE FUNCTION chat_send_message(
  p_conversation_id uuid,
  p_sender_id uuid,
  p_content text,
  p_content_type text DEFAULT 'text',
  p_send_state text DEFAULT 'sent'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_msg_id uuid;
BEGIN
  INSERT INTO messages (conversation_id, sender_id, content, content_type, send_state)
  VALUES (p_conversation_id, p_sender_id, p_content, p_content_type, p_send_state)
  RETURNING id INTO v_msg_id;

  UPDATE conversations
  SET last_message_at = now(), updated_at = now()
  WHERE id = p_conversation_id;

  RETURN v_msg_id;
END;
$$;
