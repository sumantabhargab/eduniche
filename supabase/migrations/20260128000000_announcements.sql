-- ============================================
-- ANNOUNCEMENTS & NOTIFICATIONS MIGRATION
-- ============================================

-- ─── Announcements table ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL DEFAULT 'general'
    CHECK (type IN ('general', 'library', 'exam', 'mock_test', 'maintenance', 'important')),
  priority TEXT NOT NULL DEFAULT 'normal'
    CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'archived')),
  target_type TEXT NOT NULL DEFAULT 'all'
    CHECK (target_type IN ('all', 'branch')),
  target_value TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  published_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Indexes ──────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_announcements_status
  ON announcements(status);

CREATE INDEX IF NOT EXISTS idx_announcements_type
  ON announcements(type);

CREATE INDEX IF NOT EXISTS idx_announcements_priority
  ON announcements(priority);

CREATE INDEX IF NOT EXISTS idx_announcements_target
  ON announcements(target_type, target_value);

CREATE INDEX IF NOT EXISTS idx_announcements_created_at
  ON announcements(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_announcements_published_at
  ON announcements(published_at DESC);

CREATE INDEX IF NOT EXISTS idx_announcements_created_by
  ON announcements(created_by);

-- ─── Announcement reads table ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS announcement_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_announcement_read UNIQUE (announcement_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_announcement_reads_user
  ON announcement_reads(user_id);

CREATE INDEX IF NOT EXISTS idx_announcement_reads_announcement
  ON announcement_reads(announcement_id);

CREATE INDEX IF NOT EXISTS idx_announcement_reads_composite
  ON announcement_reads(user_id, announcement_id);

-- ─── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_reads ENABLE ROW LEVEL SECURITY;

-- Admin: full access to announcements
DROP POLICY IF EXISTS "admin_announcements" ON announcements;
CREATE POLICY "admin_announcements"
  ON announcements FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Authenticated users: read published, non-expired announcements targeted to them
DROP POLICY IF EXISTS "users_read_announcements" ON announcements;
CREATE POLICY "users_read_announcements"
  ON announcements FOR SELECT
  USING (
    status = 'published'
    AND (expires_at IS NULL OR expires_at > NOW())
    AND (
      target_type = 'all'
      OR (
        target_type = 'branch'
        AND EXISTS (
          SELECT 1 FROM profiles
          WHERE id = auth.uid() AND branch = announcements.target_value
        )
      )
    )
  );

-- Users: insert their own read records
DROP POLICY IF EXISTS "users_insert_reads" ON announcement_reads;
CREATE POLICY "users_insert_reads"
  ON announcement_reads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users: read their own read records
DROP POLICY IF EXISTS "users_read_own_reads" ON announcement_reads;
CREATE POLICY "users_read_own_reads"
  ON announcement_reads FOR SELECT
  USING (auth.uid() = user_id);

-- Users: delete their own read records
DROP POLICY IF EXISTS "users_delete_own_reads" ON announcement_reads;
CREATE POLICY "users_delete_own_reads"
  ON announcement_reads FOR DELETE
  USING (auth.uid() = user_id);

-- ─── Grants ───────────────────────────────────────────────────────────────────

GRANT ALL ON announcements TO service_role;
GRANT ALL ON announcement_reads TO service_role;
GRANT SELECT ON announcements TO anon, authenticated;
GRANT INSERT, SELECT, DELETE ON announcement_reads TO authenticated;
