-- Migration: 20270101000000_security_rls_fixes.sql
-- Purpose: Fix RLS policies to enforce access_tier and remove public profile exposure
-- Date: 2026-08-30

-- ============================================================
-- PROFILES: Remove public read exposure, clean up duplicates
-- ============================================================

-- Remove broad public-read policy (exposed usernames to unauthenticated users)
DROP POLICY IF EXISTS public_read_public_profile_fields ON public.profiles;

-- Remove old-named duplicate policies (redundant with snake_case versions)
DROP POLICY IF EXISTS "Users read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;

-- Ensure remaining policies are correct (recreate if they were accidentally dropped)
DROP POLICY IF EXISTS users_read_own_profile ON public.profiles;
DROP POLICY IF EXISTS users_update_own_profile ON public.profiles;

CREATE POLICY users_read_own_profile ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Only admins can update profiles (including plan)
DROP POLICY IF EXISTS admin_update_profiles ON public.profiles;
CREATE POLICY admin_update_profiles ON public.profiles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles p2
      WHERE p2.id = auth.uid()
        AND p2.role = ANY (ARRAY['admin'::text, 'owner'::text])
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p2
      WHERE p2.id = auth.uid()
        AND p2.role = ANY (ARRAY['admin'::text, 'owner'::text])
    )
  );

-- ============================================================
-- CONTENT_RESOURCES: Enforce access_tier gating
-- ============================================================

-- Remove old broad public-read policy (bypassed access_tier checks)
DROP POLICY IF EXISTS "Public read published resources" ON public.content_resources;
DROP POLICY IF EXISTS "Admin full resources" ON public.content_resources;
DROP POLICY IF EXISTS "public_read_published_free" ON public.content_resources;
DROP POLICY IF EXISTS "authenticated_read_own_premium" ON public.content_resources;
DROP POLICY IF EXISTS admin_full_resources ON public.content_resources;
DROP POLICY IF EXISTS authenticated_read_premium ON public.content_resources;

-- Admin/owner: full CRUD
CREATE POLICY admin_full_resources ON public.content_resources
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = ANY (ARRAY['admin'::text, 'owner'::text])
  ));

-- Public: free published content only
CREATE POLICY public_read_published_free ON public.content_resources
  FOR SELECT
  USING ((visibility = 'published'::text) AND (access_tier = 'free'::text));

-- Authenticated with active subscription OR premium plan: premium content
CREATE POLICY authenticated_read_premium ON public.content_resources
  FOR SELECT
  USING (
    (visibility = 'published'::text)
    AND (access_tier = 'premium'::text)
    AND (
      -- Premium plan on profile (fast path)
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
          AND profiles.plan = ANY (ARRAY['monthly_premium'::text, 'weekly_premium'::text])
      )
      OR
      -- Active subscription
      EXISTS (
        SELECT 1 FROM user_subscriptions
        WHERE user_subscriptions.user_id = auth.uid()
          AND user_subscriptions.status = 'active'::text
          AND (user_subscriptions.expires_at IS NULL OR user_subscriptions.expires_at > now())
      )
    )
  );
