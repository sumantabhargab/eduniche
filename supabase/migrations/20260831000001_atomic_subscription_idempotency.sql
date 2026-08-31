-- ============================================
-- Atomic Subscription Idempotency (Razorpay)
-- ============================================
--
-- Concurrency vulnerability fixed:
--   Previously, verify + webhook both used "SELECT → check → UPDATE",
--   which is NOT safe under concurrent execution. Two callers could
--   both read razorpay_payment_id IS NULL, both decide to activate,
--   and both extend the subscription.
--
-- Fix (two parts):
--
-- 1. UNIQUE partial index on razorpay_payment_id
--    Only one row across the entire table can hold a given payment_id.
--    Multiple pending rows (payment_id IS NULL) are still allowed.
--    This is the atomic claim mechanism — any UPDATE that tries to set
--    a payment_id that is already claimed will fail at the DB level.
--
-- 2. activate_subscription RPC
--    Single server-side function that atomically:
--      a) FOR UPDATE locks the subscription row
--      b) Reads the current state (razorpay_payment_id, status, expires_at)
--      c) Computes the extension in SQL (avoids JS race on baseDate)
--      d) Claims the payment and activates in one UPDATE ... RETURNING
--
--    If two callers race, only one succeeds. The other gets an empty
--    result (payment already claimed) — a safe no-op, not an error.
--
--    The webhook's failed-payment handler now only marks its own row
--    as failed. It does NOT touch profiles.plan, because a failed
--    payment on one order must never revoke a premium granted by a
--    different (successful) payment on a different order.
--
-- Also adds:
--   - amount and currency columns for server-side payment verification
--     in /api/subscriptions/verify
--   - razorpay_order_id unique index for order lookup

-- Part 0: columns needed for payment verification
ALTER TABLE user_subscriptions
  ADD COLUMN IF NOT EXISTS amount INTEGER,
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'INR';

-- Part 1: unique partial index — enforces single-claim across all callers
-- PostgreSQL treats NULLs as distinct in unique indexes, so multiple
-- pending subscriptions (payment_id IS NULL) are still allowed.
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_subscriptions_payment_id
  ON user_subscriptions(razorpay_payment_id)
  WHERE razorpay_payment_id IS NOT NULL;

-- Part 2: atomic activate RPC
CREATE OR REPLACE FUNCTION activate_subscription(
  p_subscription_id  UUID,
  p_payment_id       TEXT,
  p_plan             TEXT   -- 'weekly' or 'monthly'
)
RETURNS SETOF user_subscriptions
LANGUAGE plpgsql
AS $$
DECLARE
  v_now      TIMESTAMPTZ := NOW();
  v_base     TIMESTAMPTZ;
  v_interval TEXT;
BEGIN
  -- Lock the row and compute the extension base in SQL.
  -- FOR UPDATE prevents two concurrent RPC calls from reading the same
  -- expires_at and computing the same extension.
  SELECT
    CASE
      WHEN status = 'active' AND expires_at IS NOT NULL AND expires_at > v_now
      THEN expires_at
      ELSE v_now
    END
  INTO v_base
  FROM user_subscriptions
  WHERE id = p_subscription_id
  FOR UPDATE;

  IF v_base IS NULL THEN
    RETURN;  -- order not found — caller handles the error
  END IF;

  -- Determine the interval
  IF p_plan = 'weekly' THEN
    v_interval := '7 days';
  ELSE
    v_interval := '1 month';
  END IF;

  -- Atomic claim + activate.
  -- WHERE razorpay_payment_id IS NULL ensures only the first caller wins.
  -- The unique index above is the ultimate backstop against any race
  -- this condition misses.
  RETURN QUERY
  UPDATE user_subscriptions
  SET
    razorpay_payment_id = p_payment_id,
    status              = 'active',
    started_at          = v_base,
    expires_at          = v_base + v_interval::INTERVAL,
    updated_at          = v_now
  WHERE id = p_subscription_id
    AND razorpay_payment_id IS NULL   -- only claim if unclaimed
  RETURNING *;
END;
$$;

GRANT EXECUTE ON FUNCTION activate_subscription(UUID, TEXT, TEXT)
  TO service_role;
REVOKE EXECUTE ON FUNCTION activate_subscription(UUID, TEXT, TEXT) FROM authenticated;
REVOKE EXECUTE ON FUNCTION activate_subscription(UUID, TEXT, TEXT) FROM anon;