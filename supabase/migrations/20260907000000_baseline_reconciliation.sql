-- ============================================
-- BASELINE RECONCILIATION MIGRATION
-- Fixes conflicts between remote manual setup
-- and local migration definitions.
-- ============================================

-- ─── 1. Add missing columns to profiles ──────────────────────────────────────

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS username TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS daily_goal_minutes INTEGER NOT NULL DEFAULT 120,
  ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata';

-- ─── 2. Add missing 'owner' role to profiles CHECK constraint ─────────────────
-- The global chat migration references role IN ('admin', 'owner') but the
-- CHECK only allows ('admin', 'student'). We add 'owner' to unblock it.

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('admin', 'student', 'owner'));

-- ─── 3. Add access_tier to content_resources ──────────────────────────────────

ALTER TABLE content_resources
  ADD COLUMN IF NOT EXISTS access_tier TEXT NOT NULL DEFAULT 'free'
    CHECK (access_tier IN ('free', 'premium'));

-- ─── 4. Replace RLS policies on profiles ─────────────────────────────────────
-- Drop any existing policies and recreate with the correct set.

DROP POLICY IF EXISTS "Users read own profile" ON profiles;
DROP POLICY IF EXISTS "Users update own profile" ON profiles;
DROP POLICY IF EXISTS "users_read_own_profile" ON profiles;
DROP POLICY IF EXISTS "users_update_own_profile" ON profiles;
DROP POLICY IF EXISTS "public_read_public_profile_fields" ON profiles;

-- Users can read their own full profile
CREATE POLICY "users_read_own_profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "users_update_own_profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Public can read basic profile fields (for chat display, leaderboard, etc.)
CREATE POLICY "public_read_public_profile_fields"
  ON profiles FOR SELECT
  USING (true);

-- ─── 5. Replace RLS policies on content_resources ─────────────────────────────
-- Drop existing public read policy, replace with access_tier-aware policies.

DROP POLICY IF EXISTS "Public read published resources" ON content_resources;
DROP POLICY IF EXISTS "public_read_published_resources" ON content_resources;
DROP POLICY IF EXISTS "public_read_published_resources_meta" ON content_resources;
DROP POLICY IF EXISTS "public_read_published_free" ON content_resources;
DROP POLICY IF EXISTS "authenticated_read_own_premium" ON content_resources;
DROP POLICY IF EXISTS "admin_full_resources" ON content_resources;

-- Public can read published FREE resources
CREATE POLICY "public_read_published_free"
  ON content_resources FOR SELECT
  USING (visibility = 'published' AND access_tier = 'free');

-- Authenticated users can read published FREE + premium (if subscribed)
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

-- Admin full access
CREATE POLICY "admin_full_resources"
  ON content_resources FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner'))
  );

-- ─── 6. Verify trigger exists on content_folders ──────────────────────────────

DROP TRIGGER IF EXISTS trigger_update_folder_path ON content_folders;
CREATE TRIGGER trigger_update_folder_path
  BEFORE INSERT OR UPDATE OF parent_id ON content_folders
  FOR EACH ROW EXECUTE FUNCTION update_folder_path();
