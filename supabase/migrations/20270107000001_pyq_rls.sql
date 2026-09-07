-- ============================================
-- PYQ System RLS Policies
-- ============================================

BEGIN;

-- ─── PYQ Branches ───────────────────────────────────────────────────────────
-- Public read for active branches
ALTER TABLE pyq_branches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read active branches" ON pyq_branches;
DROP POLICY IF EXISTS "Public read active branches" ON pyq_branches;
CREATE POLICY "Public read active branches" ON pyq_branches FOR SELECT USING (active = true);

-- Admin/service role manages
DROP POLICY IF EXISTS "Admin manages branches" ON pyq_branches;
DROP POLICY IF EXISTS "Admin manages branches" ON pyq_branches;
CREATE POLICY "Admin manages branches" ON pyq_branches FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner'))
);

GRANT SELECT ON pyq_branches TO anon, authenticated;
GRANT ALL ON pyq_branches TO service_role;

-- ─── PYQ Subjects ───────────────────────────────────────────────────────────
ALTER TABLE pyq_subjects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read subjects" ON pyq_subjects;
DROP POLICY IF EXISTS "Public read subjects" ON pyq_subjects;
CREATE POLICY "Public read subjects" ON pyq_subjects FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin manages subjects" ON pyq_subjects;
DROP POLICY IF EXISTS "Admin manages subjects" ON pyq_subjects;
CREATE POLICY "Admin manages subjects" ON pyq_subjects FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner'))
);

GRANT SELECT ON pyq_subjects TO anon, authenticated;
GRANT ALL ON pyq_subjects TO service_role;

-- ─── PYQ Topics ─────────────────────────────────────────────────────────────
-- Public can see topics, but premium enforcement happens via is_premium flag
-- Topics themselves are visible — the premium gate is in the API layer
ALTER TABLE pyq_topics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read topics" ON pyq_topics;
DROP POLICY IF EXISTS "Public read topics" ON pyq_topics;
CREATE POLICY "Public read topics" ON pyq_topics FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin manages topics" ON pyq_topics;
DROP POLICY IF EXISTS "Admin manages topics" ON pyq_topics;
CREATE POLICY "Admin manages topics" ON pyq_topics FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner'))
);

GRANT SELECT ON pyq_topics TO anon, authenticated;
GRANT ALL ON pyq_topics TO service_role;

-- ─── PYQ Questions ──────────────────────────────────────────────────────────
-- Public can read published/verified questions
ALTER TABLE pyq_questions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read questions" ON pyq_questions;
DROP POLICY IF EXISTS "Public read questions" ON pyq_questions;
CREATE POLICY "Public read questions" ON pyq_questions FOR SELECT USING (
  quality_tier IN ('A', 'B') AND answer_verified = true
);

-- Authenticated premium users can read ALL questions (including topic-filterable ones)
-- This is needed so premium users can query by topic
DROP POLICY IF EXISTS "Premium read all questions" ON pyq_questions;
DROP POLICY IF EXISTS "Premium read all questions" ON pyq_questions;
CREATE POLICY "Premium read all questions" ON pyq_questions FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_subscriptions
    WHERE user_id = auth.uid()
      AND status = 'active'
      AND (expires_at IS NULL OR expires_at > NOW())
  )
);

-- Admin manages questions
DROP POLICY IF EXISTS "Admin manages questions" ON pyq_questions;
DROP POLICY IF EXISTS "Admin manages questions" ON pyq_questions;
CREATE POLICY "Admin manages questions" ON pyq_questions FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner'))
);

GRANT SELECT ON pyq_questions TO anon, authenticated;
GRANT ALL ON pyq_questions TO service_role;

-- ─── PYQ Attempts ───────────────────────────────────────────────────────────
-- Users can read/write their own attempts
ALTER TABLE pyq_attempts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users read own attempts" ON pyq_attempts;
DROP POLICY IF EXISTS "Users read own attempts" ON pyq_attempts;
CREATE POLICY "Users read own attempts" ON pyq_attempts FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own attempts" ON pyq_attempts;
DROP POLICY IF EXISTS "Users insert own attempts" ON pyq_attempts;
CREATE POLICY "Users insert own attempts" ON pyq_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own attempts" ON pyq_attempts;
DROP POLICY IF EXISTS "Users update own attempts" ON pyq_attempts;
CREATE POLICY "Users update own attempts" ON pyq_attempts FOR UPDATE USING (auth.uid() = user_id);

-- Admin can read all
DROP POLICY IF EXISTS "Admin read all attempts" ON pyq_attempts;
DROP POLICY IF EXISTS "Admin read all attempts" ON pyq_attempts;
CREATE POLICY "Admin read all attempts" ON pyq_attempts FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner'))
);

GRANT SELECT, INSERT, UPDATE ON pyq_attempts TO authenticated;
GRANT ALL ON pyq_attempts TO service_role;

-- ─── PYQ Bookmarks ──────────────────────────────────────────────────────────
ALTER TABLE pyq_bookmarks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own bookmarks" ON pyq_bookmarks;
DROP POLICY IF EXISTS "Users manage own bookmarks" ON pyq_bookmarks;
CREATE POLICY "Users manage own bookmarks" ON pyq_bookmarks FOR ALL USING (auth.uid() = user_id);

GRANT SELECT, INSERT, DELETE ON pyq_bookmarks TO authenticated;
GRANT ALL ON pyq_bookmarks TO service_role;

-- ─── PYQ User Notes ─────────────────────────────────────────────────────────
ALTER TABLE pyq_user_notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own notes" ON pyq_user_notes;
DROP POLICY IF EXISTS "Users manage own notes" ON pyq_user_notes;
CREATE POLICY "Users manage own notes" ON pyq_user_notes FOR ALL USING (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON pyq_user_notes TO authenticated;
GRANT ALL ON pyq_user_notes TO service_role;

-- ─── PYQ Reports ────────────────────────────────────────────────────────────
-- Users can create reports, read their own
ALTER TABLE pyq_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users create reports" ON pyq_reports;
DROP POLICY IF EXISTS "Users create reports" ON pyq_reports;
CREATE POLICY "Users create reports" ON pyq_reports FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users read own reports" ON pyq_reports;
DROP POLICY IF EXISTS "Users read own reports" ON pyq_reports;
CREATE POLICY "Users read own reports" ON pyq_reports FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admin manages reports" ON pyq_reports;
DROP POLICY IF EXISTS "Admin manages reports" ON pyq_reports;
CREATE POLICY "Admin manages reports" ON pyq_reports FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner'))
);

GRANT SELECT, INSERT ON pyq_reports TO authenticated;
GRANT ALL ON pyq_reports TO service_role;

-- ─── PYQ Stats tables ───────────────────────────────────────────────────────
-- Public read for analytics
ALTER TABLE pyq_topic_stats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read topic stats" ON pyq_topic_stats;
DROP POLICY IF EXISTS "Public read topic stats" ON pyq_topic_stats;
CREATE POLICY "Public read topic stats" ON pyq_topic_stats FOR SELECT USING (true);

ALTER TABLE pyq_year_stats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read year stats" ON pyq_year_stats;
DROP POLICY IF EXISTS "Public read year stats" ON pyq_year_stats;
CREATE POLICY "Public read year stats" ON pyq_year_stats FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin manages stats" ON pyq_topic_stats;
DROP POLICY IF EXISTS "Admin manages stats" ON pyq_topic_stats;
CREATE POLICY "Admin manages stats" ON pyq_topic_stats FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner'))
);

DROP POLICY IF EXISTS "Admin manages year stats" ON pyq_year_stats;
DROP POLICY IF EXISTS "Admin manages year stats" ON pyq_year_stats;
CREATE POLICY "Admin manages year stats" ON pyq_year_stats FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner'))
);

GRANT SELECT ON pyq_topic_stats TO anon, authenticated;
GRANT SELECT ON pyq_year_stats TO anon, authenticated;
GRANT ALL ON pyq_topic_stats TO service_role;
GRANT ALL ON pyq_year_stats TO service_role;

-- ─── PYQ Sources ────────────────────────────────────────────────────────────
-- Public read for source attribution
ALTER TABLE pyq_sources ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read sources" ON pyq_sources;
DROP POLICY IF EXISTS "Public read sources" ON pyq_sources;
CREATE POLICY "Public read sources" ON pyq_sources FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin manages sources" ON pyq_sources;
DROP POLICY IF EXISTS "Admin manages sources" ON pyq_sources;
CREATE POLICY "Admin manages sources" ON pyq_sources FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner'))
);

GRANT SELECT ON pyq_sources TO anon, authenticated;
GRANT ALL ON pyq_sources TO service_role;

COMMIT;
