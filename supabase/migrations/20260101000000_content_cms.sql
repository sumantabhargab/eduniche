-- ============================================
-- CONTENT CMS MIGRATION
-- Adds admin profiles, content folders,
-- content resources, and storage setup.
-- ============================================

-- ─── Enable required extensions ──────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ─── Profiles table ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('admin', 'student')),
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own profile" ON profiles;
CREATE POLICY "Users read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users update own profile" ON profiles;
CREATE POLICY "Users update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

GRANT ALL ON profiles TO service_role;
GRANT SELECT, UPDATE ON profiles TO authenticated;

-- ─── Content Folders ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS content_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  parent_id UUID REFERENCES content_folders(id) ON DELETE CASCADE,
  path TEXT NOT NULL DEFAULT '',
  depth INTEGER NOT NULL DEFAULT 0,
  branch TEXT,
  subject TEXT,
  resource_type TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  CONSTRAINT valid_parent CHECK (parent_id IS NULL OR depth > 0)
);

CREATE INDEX IF NOT EXISTS idx_content_folders_parent ON content_folders(parent_id);
CREATE INDEX IF NOT EXISTS idx_content_folders_path ON content_folders(path);
CREATE INDEX IF NOT EXISTS idx_content_folders_branch ON content_folders(branch);
CREATE INDEX IF NOT EXISTS idx_content_folders_subject ON content_folders(subject);
CREATE INDEX IF NOT EXISTS idx_content_folders_type ON content_folders(resource_type);
CREATE INDEX IF NOT EXISTS idx_content_folders_created_by ON content_folders(created_by);

-- ─── Content Resources ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS content_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size BIGINT NOT NULL DEFAULT 0,
  storage_path TEXT NOT NULL,
  folder_id UUID NOT NULL REFERENCES content_folders(id) ON DELETE CASCADE,
  branch TEXT,
  subject TEXT,
  resource_type TEXT,
  visibility TEXT NOT NULL DEFAULT 'draft' CHECK (visibility IN ('draft', 'published', 'archived')),
  tags TEXT[] DEFAULT '{}',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  uploaded_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_content_resources_folder ON content_resources(folder_id);
CREATE INDEX IF NOT EXISTS idx_content_resources_branch ON content_resources(branch);
CREATE INDEX IF NOT EXISTS idx_content_resources_subject ON content_resources(subject);
CREATE INDEX IF NOT EXISTS idx_content_resources_type ON content_resources(resource_type);
CREATE INDEX IF NOT EXISTS idx_content_resources_visibility ON content_resources(visibility);
CREATE INDEX IF NOT EXISTS idx_content_resources_name_trgm ON content_resources USING gin (name gin_trgm_ops);

-- ─── Triggers for path maintenance ───────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_folder_path()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.parent_id IS NULL THEN
      NEW.path := '/' || NEW.id::text;
      NEW.depth := 0;
    ELSE
      SELECT path || '/' || NEW.id::text, depth + 1
      INTO NEW.path, NEW.depth
      FROM content_folders WHERE id = NEW.parent_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' AND NEW.parent_id != OLD.parent_id THEN
    IF NEW.parent_id IS NULL THEN
      NEW.path := '/' || NEW.id::text;
      NEW.depth := 0;
    ELSE
      SELECT path || '/' || NEW.id::text, depth + 1
      INTO NEW.path, NEW.depth
      FROM content_folders WHERE id = NEW.parent_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_folder_path ON content_folders;
CREATE TRIGGER trigger_update_folder_path
  BEFORE INSERT OR UPDATE OF parent_id ON content_folders
  FOR EACH ROW EXECUTE FUNCTION update_folder_path();

-- ─── RLS Policies ─────────────────────────────────────────────────────────────

ALTER TABLE content_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_resources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin full folders" ON content_folders;
CREATE POLICY "Admin full folders" ON content_folders FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Admin full resources" ON content_resources;
CREATE POLICY "Admin full resources" ON content_resources FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Public read published resources" ON content_resources;
CREATE POLICY "Public read published resources"
  ON content_resources FOR SELECT
  USING (visibility = 'published');

GRANT SELECT ON content_folders TO anon, authenticated;
GRANT SELECT ON content_resources TO anon;
GRANT ALL ON content_folders TO service_role;
GRANT ALL ON content_resources TO service_role;

-- ─── Storage bucket ──────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public)
VALUES ('eduniche-content', 'eduniche-content', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Admin upload" ON storage.objects;
CREATE POLICY "Admin upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'eduniche-content' AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Admin read" ON storage.objects;
CREATE POLICY "Admin read"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'eduniche-content' AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Admin update" ON storage.objects;
CREATE POLICY "Admin update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'eduniche-content' AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Admin delete" ON storage.objects;
CREATE POLICY "Admin delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'eduniche-content' AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

GRANT ALL ON storage.objects TO service_role;
