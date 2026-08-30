-- ============================================
-- Leaderboard & Badges
-- ============================================

-- Add premium access tier to content_resources
ALTER TABLE content_resources
  ADD COLUMN IF NOT EXISTS access_tier TEXT NOT NULL DEFAULT 'free'
    CHECK (access_tier IN ('free', 'premium'));

-- Update RLS: public reads published, but premium requires subscription check
DROP POLICY IF EXISTS "public_read_published_resources" ON content_resources;
-- Public can see metadata but content access is controlled via API
CREATE POLICY "public_read_published_resources_meta"
  ON content_resources FOR SELECT
  USING (visibility = 'published');

-- User badges table
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_key TEXT NOT NULL,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  UNIQUE(user_id, badge_key)
);

CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_key ON user_badges(badge_key);

ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_read_own_badges" ON user_badges;
CREATE POLICY "users_read_own_badges"
  ON user_badges FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "public_read_badge_counts" ON user_badges;
-- Allow public read of badge counts (for leaderboard display)
CREATE POLICY "public_read_badge_counts"
  ON user_badges FOR SELECT
  USING (true);

GRANT ALL ON user_badges TO service_role;
GRANT SELECT, INSERT ON user_badges TO authenticated;

-- Badge definitions table (managed by admin/system)
CREATE TABLE IF NOT EXISTS badge_definitions (
  key TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  rarity TEXT NOT NULL DEFAULT 'common'
    CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),
  criteria JSONB NOT NULL,
  is_premium BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE badge_definitions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "badge_definitions_readable" ON badge_definitions;
CREATE POLICY "badge_definitions_readable"
  ON badge_definitions FOR SELECT
  USING (true);

GRANT ALL ON badge_definitions TO service_role;
GRANT SELECT ON badge_definitions TO authenticated, anon;

-- Seed badge definitions
INSERT INTO badge_definitions (key, name, description, icon, rarity, criteria, is_premium) VALUES
  ('first_session', 'First Step', 'Complete your first valid study session', '🌱', 'common', '{"type": "session_count", "threshold": 1}', true),
  ('consistent', 'Consistent', 'Maintain a 7-day study streak', '🔥', 'uncommon', '{"type": "streak", "threshold": 7}', true),
  ('scholar', 'Scholar', 'Reach 10 hours of total study time', '📚', 'uncommon', '{"type": "total_minutes", "threshold": 600}', true),
  ('dedicated', 'Dedicated', 'Reach 50 hours of total study time', '🧠', 'rare', '{"type": "total_minutes", "threshold": 3000}', true),
  ('hundred_club', 'Hundred Club', 'Reach 100 hours of total study time', '🏆', 'rare', '{"type": "total_minutes", "threshold": 6000}', true),
  ('deep_focus', 'Deep Focus', 'Complete a 5-hour single session', '⚡', 'epic', '{"type": "single_session_minutes", "threshold": 300}', true),
  ('elite_scholar', 'Elite Scholar', 'Reach the top 100 on the global leaderboard', '👑', 'legendary', '{"type": "leaderboard_rank", "threshold": 100}', true)
ON CONFLICT (key) DO NOTHING;
