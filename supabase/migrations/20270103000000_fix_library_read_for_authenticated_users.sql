-- ============================================
-- Migration: 20270103000000_fix_library_read_for_authenticated_users.sql
-- Purpose: Allow authenticated (non-admin) users to read library content
-- Date: 2026-08-30
--
-- ROOT CAUSE: Three issues prevented normal authenticated users from seeing
-- library content:
--
--   1. content_folders: No RLS SELECT policy for non-admin users.
--      The only policy ("Admin full folders") requires role = 'admin'.
--      Result: folder listing query returns empty.
--
--   2. content_resources: GRANT SELECT only to 'anon', not 'authenticated'.
--      Logged-in users run as role 'authenticated', so even correct RLS
--      policies couldn't help — the query was denied at the privilege level.
--
--   3. storage.objects (eduniche-content bucket): No read policy for
--      non-admin users. Only the "Admin read" policy existed.
--      Result: file downloads/viewing blocked.
--
-- FIX: Add minimal read-only policies for authenticated users while
-- preserving all admin write permissions.
-- ============================================

-- ─── 1. content_folders: Add read policy for authenticated users ───────────────

DROP POLICY IF EXISTS "authenticated_read_folders" ON content_folders;

CREATE POLICY "authenticated_read_folders"
  ON content_folders FOR SELECT
  USING (auth.role() = 'authenticated');

-- Admins keep full access via the existing "Admin full folders" policy (FOR ALL).
-- Multiple policies on the same operation are combined with OR, so admins
-- satisfy both and normal users satisfy only the read policy.

-- ─── 2. content_resources: Grant SELECT to authenticated role ──────────────────

GRANT SELECT ON content_resources TO authenticated;

-- RLS policies already cover the access logic:
--   "public_read_published_free"       → anyone (anon + authenticated) can read published free content
--   "authenticated_read_premium"       → authenticated users with active subscription can read premium
--   "admin_full_resources"             → admins have full CRUD
-- The only missing piece was the database-level GRANT.

-- ─── 3. Storage: Add read policy for authenticated users ───────────────────────

DROP POLICY IF EXISTS "authenticated_read_content" ON storage.objects;

CREATE POLICY "authenticated_read_content"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'eduniche-content'
    AND auth.role() = 'authenticated'
  );

-- Admins keep full access via existing "Admin read" policy.
-- INSERT/UPDATE/DELETE remain admin-only (no changes to those policies).
