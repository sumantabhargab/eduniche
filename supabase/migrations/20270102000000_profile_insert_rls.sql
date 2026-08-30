-- ============================================
-- Migration: 20270102000000_profile_insert_rls.sql
-- Purpose: Fix missing INSERT policy on profiles table
-- Date: 2026-08-30
--
-- ROOT CAUSE: The profiles table had SELECT and UPDATE RLS policies
-- but NO INSERT policy. When a new OAuth user tried to set their username,
-- the upsert() failed with RLS error 42501 because authenticated users
-- had no INSERT privilege on profiles.
--
-- Fix: Add users_insert_own_profile policy and GRANT INSERT to authenticated.
-- ============================================

-- INSERT policy: users can create their own profile row
-- The WITH CHECK ensures auth.uid() = id at insert time (cannot create a
-- profile for another user or with a mismatched id).
DROP POLICY IF EXISTS "users_insert_own_profile" ON profiles;

CREATE POLICY "users_insert_own_profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Ensure INSERT is granted to authenticated role
GRANT INSERT ON profiles TO authenticated;
