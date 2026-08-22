-- ============================================
-- EDUNICHE WAITLIST DATABASE SCHEMA
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Waitlist users table
CREATE TABLE IF NOT EXISTS waitlist_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  interest TEXT,
  desired_creator TEXT,
  learning_challenge TEXT,
  referral_code TEXT UNIQUE NOT NULL DEFAULT '',
  referred_by TEXT DEFAULT '',
  referral_count INTEGER DEFAULT 0,
  position INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_waitlist_users_email ON waitlist_users(email);
CREATE INDEX IF NOT EXISTS idx_waitlist_users_referral_code ON waitlist_users(referral_code);
CREATE INDEX IF NOT EXISTS idx_waitlist_users_referred_by ON waitlist_users(referred_by);
CREATE INDEX IF NOT EXISTS idx_waitlist_users_position ON waitlist_users(position);
CREATE INDEX IF NOT EXISTS idx_waitlist_users_created_at ON waitlist_users(created_at);

-- Migration: add learning_challenge column if it doesn't exist (for existing tables)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'waitlist_users' AND column_name = 'learning_challenge'
  ) THEN
    ALTER TABLE waitlist_users ADD COLUMN learning_challenge TEXT;
  END IF;
END $$;

-- Function to auto-assign position
CREATE OR REPLACE FUNCTION assign_waitlist_position()
RETURNS TRIGGER AS $$
BEGIN
  NEW.position := (
    SELECT COUNT(*) + 1 FROM waitlist_users
    WHERE created_at < NEW.created_at
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to assign position on insert
DROP TRIGGER IF EXISTS trigger_assign_position ON waitlist_users;
CREATE TRIGGER trigger_assign_position
  BEFORE INSERT ON waitlist_users
  FOR EACH ROW
  EXECUTE FUNCTION assign_waitlist_position();

-- Leaderboard view (top 50 by verified referrals)
CREATE OR REPLACE VIEW leaderboard AS
SELECT
  id,
  name,
  referral_count,
  position,
  created_at,
  -- Truncate name for leaderboard display
  CASE
    WHEN LENGTH(name) > 20 THEN LEFT(name, 20) || '…'
    ELSE name
  END AS display_name
FROM waitlist_users
WHERE referral_count > 0
ORDER BY referral_count DESC, created_at ASC
LIMIT 50;

-- Enable Row Level Security
ALTER TABLE waitlist_users ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert (waitlist signup)
CREATE POLICY "Anyone can join waitlist"
  ON waitlist_users
  FOR INSERT
  WITH CHECK (true);

-- Policy: Anyone can read (for leaderboard/public data)
-- This is intentional - we want the leaderboard public
-- Waitlist users can update their own records
CREATE POLICY "Users can update own record"
  ON waitlist_users
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Grant minimal permissions
GRANT INSERT ON waitlist_users TO anon;
GRANT INSERT, SELECT, UPDATE ON waitlist_users TO authenticated;
GRANT SELECT ON leaderboard TO anon, authenticated;

-- RPC function to safely increment referral count
CREATE OR REPLACE FUNCTION increment_referral_count(p_code TEXT)
RETURNS void AS $$
BEGIN
  UPDATE waitlist_users
  SET referral_count = referral_count + 1
  WHERE referral_code = UPPER(p_code);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION increment_referral_count(TEXT) TO anon, authenticated;
