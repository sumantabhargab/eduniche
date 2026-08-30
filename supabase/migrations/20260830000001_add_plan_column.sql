-- ============================================
-- Add plan column to profiles
-- ============================================

-- Add plan column to profiles (separate from role)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'free'
  CHECK (plan IN ('free', 'monthly_premium', 'weekly_premium'));

-- Update isPremium for existing premium users via subscriptions
UPDATE profiles
SET plan = COALESCE(
  (SELECT CASE
    WHEN user_subscriptions.plan = 'weekly' THEN 'weekly_premium'
    WHEN user_subscriptions.plan = 'monthly' THEN 'monthly_premium'
    ELSE 'free'
   END
   FROM user_subscriptions
   WHERE user_subscriptions.user_id = profiles.id
     AND user_subscriptions.status = 'active'
     AND user_subscriptions.expires_at > NOW()
   LIMIT 1),
  'free'
)
WHERE id IN (SELECT id FROM auth.users);
