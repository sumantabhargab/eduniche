-- ============================================================
-- Premium entitlement diagnosis for messyguy@gmail.com
-- Run these in Supabase SQL Editor (or psql) sequentially
-- ============================================================

-- Step 1: Find the auth.users UUID for this email
SELECT
  id,
  email,
  email_confirmed_at,
  last_sign_in_at,
  created_at
FROM auth.users
WHERE email = 'messyguy@gmail.com';

-- Step 2: Check if a subscription already exists for this user
-- Replace <uuid> with the id from Step 1
SELECT
  user_id,
  plan,
  status,
  expires_at,
  started_at,
  created_at,
  updated_at
FROM user_subscriptions
WHERE user_id = '<PASTE_UUID_FROM_STEP_1>';

-- Step 3: Verify the RPC function works correctly for this user
-- Replace <uuid> with the id from Step 1
SELECT
  has_active_subscription('<PASTE_UUID_FROM_STEP_1>') AS is_premium;

-- Step 4: If Step 3 returns false but you need to grant premium,
-- delete any existing subscription and insert a correct one:
-- (Run ONLY if Step 2 shows wrong UUID or missing/invalid status)

-- DELETE FROM user_subscriptions WHERE user_id = '<WRONG_UUID_IF_ANY>';

-- INSERT INTO user_subscriptions (user_id, plan, status, expires_at, started_at)
-- VALUES ('<CORRECT_UUID_FROM_STEP_1>', 'monthly', 'active', NOW() + INTERVAL '1 month', NOW());

-- Step 5: Final verification after INSERT
-- SELECT
--   u.email,
--   s.plan,
--   s.status,
--   s.expires_at,
--   has_active_subscription(u.id) AS is_premium
-- FROM auth.users u
-- LEFT JOIN user_subscriptions s ON s.user_id = u.id AND s.status = 'active'
-- WHERE u.email = 'messyguy@gmail.com';
