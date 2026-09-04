-- ============================================
-- BRAND BILLBOARD / SPONSORED CREATIVE SYSTEM
-- ============================================

-- 1. Billboard slots table
CREATE TABLE IF NOT EXISTS billboard_slots (
  id TEXT PRIMARY KEY,
  friendly_name TEXT NOT NULL DEFAULT '',
  page TEXT NOT NULL DEFAULT '',
  placement TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Billboard creatives table
CREATE TABLE IF NOT EXISTS billboard_creatives (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slot_id TEXT NOT NULL REFERENCES billboard_slots(id) ON DELETE CASCADE,
  brand_name TEXT NOT NULL DEFAULT '',
  creative_url TEXT NOT NULL DEFAULT '',
  creative_type TEXT NOT NULL DEFAULT 'image/jpeg',
  destination_url TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  priority INTEGER NOT NULL DEFAULT 0,
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_billboard_creatives_slot
  ON billboard_creatives(slot_id, is_active);
CREATE INDEX IF NOT EXISTS idx_billboard_creatives_active_dates
  ON billboard_creatives(is_active, start_at, end_at) WHERE is_active = true;

-- 4. Updated-at trigger function + trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_billboard_creatives_updated ON billboard_creatives;
CREATE TRIGGER trigger_billboard_creatives_updated
  BEFORE UPDATE ON billboard_creatives
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. RLS policies
ALTER TABLE billboard_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE billboard_creatives ENABLE ROW LEVEL SECURITY;

-- Public: read active creatives (needed for rendering ads)
DROP POLICY IF EXISTS "public_read_active_creatives" ON billboard_creatives;
CREATE POLICY "public_read_active_creatives"
  ON billboard_creatives FOR SELECT
  USING (is_active = true);

-- Admin/owner: full access to both tables
DROP POLICY IF EXISTS "admin_full_billboard" ON billboard_slots;
DROP POLICY IF EXISTS "admin_full_billboard" ON billboard_creatives;
CREATE POLICY "admin_full_billboard_slots"
  ON billboard_slots FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner')));
CREATE POLICY "admin_full_billboard_creatives"
  ON billboard_creatives FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner')));

-- Service role: full access
DROP POLICY IF EXISTS "service_full_billboard_slots" ON billboard_slots;
DROP POLICY IF EXISTS "service_full_billboard_creatives" ON billboard_creatives;
CREATE POLICY "service_full_billboard_slots"
  ON billboard_slots FOR ALL
  USING (auth.role() = 'service_role');
CREATE POLICY "service_full_billboard_creatives"
  ON billboard_creatives FOR ALL
  USING (auth.role() = 'service_role');

-- 6. Default slots
INSERT INTO billboard_slots (id, friendly_name, page, placement, is_active) VALUES
  ('landing_main', 'Landing Page — Main Billboard', 'landing', 'below-hero', true),
  ('dashboard_featured', 'Dashboard — Featured Partner', 'dashboard', 'below-summary', true),
  ('learning_secondary', 'Learning — Secondary Billboard', 'learning', 'below-content', true),
  ('resources_featured', 'Resources — Featured Partner', 'resources', 'below-resources', true)
ON CONFLICT (id) DO NOTHING;
