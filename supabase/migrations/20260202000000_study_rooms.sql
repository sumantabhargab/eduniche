-- ============================================
-- Study Rooms — virtual library rooms
-- ============================================

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;

CREATE TABLE IF NOT EXISTS study_rooms (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  branch_id TEXT NOT NULL DEFAULT 'all',
  mode TEXT NOT NULL DEFAULT 'focus' CHECK (mode IN ('focus', 'discussion', 'video')),
  max_participants INTEGER NOT NULL DEFAULT 50,
  is_open BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_study_rooms_branch ON study_rooms(branch_id);
CREATE INDEX IF NOT EXISTS idx_study_rooms_is_open ON study_rooms(is_open);

-- Seed default rooms (idempotent)
INSERT INTO study_rooms (id, name, description, branch_id, mode, max_participants, is_open, created_at)
VALUES
  ('main-library', 'Main Library Hall', 'Open study space for all branches. Quiet focus mode.', 'all', 'focus', 50, true, NOW()),
  ('cse-focus', 'CSE Focus Room', 'Dedicated CSE study space — Algorithms, DBMS, TOC and more.', 'cse', 'focus', 25, true, NOW()),
  ('cse-discussion', 'CSE Discussion Lounge', 'Discuss problems, share solutions, and clear doubts together.', 'cse', 'discussion', 20, true, NOW()),
  ('ece-focus', 'ECE Focus Room', 'Focused study for ECE aspirants — Networks, Signals, Control Systems.', 'ece', 'focus', 25, true, NOW()),
  ('me-focus', 'ME Focus Room', 'Mechanical Engineering study space — SOM, TOM, Thermodynamics.', 'me', 'focus', 25, true, NOW()),
  ('ce-focus', 'CE Focus Room', 'Civil Engineering study space — Structures, Geotech, Environment.', 'ce', 'focus', 25, true, NOW()),
  ('ee-focus', 'EE Focus Room', 'Electrical Engineering — Machines, Power Systems, Control.', 'ee', 'focus', 25, true, NOW()),
  ('general-discussion', 'General Discussion', 'Cross-branch chat. Talk about preparation strategies, motivation, and more.', 'all', 'discussion', 40, true, NOW())
ON CONFLICT (id) DO NOTHING;

-- Presence tracking (lightweight)
CREATE TABLE IF NOT EXISTS study_room_presence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id TEXT NOT NULL REFERENCES study_rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  participant_label TEXT,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_study_room_presence_room ON study_room_presence(room_id);
CREATE INDEX IF NOT EXISTS idx_study_room_presence_user ON study_room_presence(user_id);

-- RLS
ALTER TABLE study_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_room_presence ENABLE ROW LEVEL SECURITY;

-- Anyone can read open rooms
DROP POLICY IF EXISTS "read_open_rooms" ON study_rooms;
CREATE POLICY "read_open_rooms"
  ON study_rooms FOR SELECT
  USING (is_open = true);

-- Auth users can insert their own presence
DROP POLICY IF EXISTS "users_own_presence" ON study_room_presence;
CREATE POLICY "users_own_presence"
  ON study_room_presence FOR ALL
  USING (auth.uid() = user_id OR user_id IS NULL)
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Users can read presence for any room (to see who's there)
DROP POLICY IF EXISTS "read_presence" ON study_room_presence;
CREATE POLICY "read_presence"
  ON study_room_presence FOR SELECT
  USING (true);

GRANT ALL ON study_rooms TO service_role;
GRANT ALL ON study_room_presence TO service_role;
GRANT SELECT ON study_rooms TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON study_room_presence TO authenticated;
