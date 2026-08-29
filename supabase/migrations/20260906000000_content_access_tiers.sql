-- ============================================
-- Add access_tier to content_resources
-- ============================================

-- Add access_tier column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_resources' AND column_name = 'access_tier'
  ) THEN
    ALTER TABLE content_resources
      ADD COLUMN access_tier TEXT NOT NULL DEFAULT 'free'
      CHECK (access_tier IN ('free', 'premium'));
  END IF;
END $$;

-- Update RLS: separate public (free) from premium
DROP POLICY IF EXISTS "public_read_published_resources_meta" ON content_resources;
DROP POLICY IF EXISTS "public_read_published_free" ON content_resources;
DROP POLICY IF EXISTS "authenticated_read_own_premium" ON content_resources;
DROP POLICY IF EXISTS "admin_full_resources" ON content_resources;

-- Public can read published FREE resources
CREATE POLICY "public_read_published_free"
  ON content_resources FOR SELECT
  USING (visibility = 'published' AND access_tier = 'free');

-- Authenticated users can read published FREE + their premium access
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

-- Grant access
-- ============================================
-- Breadcrumb RPC
-- ============================================

CREATE OR REPLACE FUNCTION get_folder_breadcrumbs(p_folder_id UUID)
RETURNS TABLE (id UUID, name TEXT, parent_id UUID, depth INTEGER) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE breadcrumbs AS (
    SELECT id, name, parent_id, depth, 0 AS level
    FROM content_folders
    WHERE id = p_folder_id

    UNION ALL

    SELECT f.id, f.name, f.parent_id, f.depth, b.level + 1
    FROM content_folders f
    INNER JOIN breadcrumbs b ON b.parent_id = f.id
  )
  SELECT id, name, parent_id, depth FROM breadcrumbs ORDER BY depth DESC;
END;
$$ LANGUAGE plpgsql STABLE;

GRANT EXECUTE ON FUNCTION get_folder_breadcrumbs(UUID) TO anon, authenticated, service_role;

