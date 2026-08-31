-- ============================================
-- Webhook Event Idempotency (Razorpay)
-- ============================================
--
-- Tracks processed Razorpay webhook events to prevent duplicate
-- processing. Each webhook event has a unique x-razorpay-event-id.
--
-- State machine:
--   pending   → created, no claim yet (not currently produced; reserved
--               for future use)
--   processing → claimed by a worker that has not yet finished
--   processed  → worker completed successfully (terminal)
--   failed     → worker completed with an error (terminal, but retryable)
--
-- Concurrency / liveness:
--   - claim_webhook_event uses a transaction-scoped advisory lock keyed
--     off hashtext(event_id) so concurrent webhook calls serialize.
--   - A 'processed' or 'failed' row is terminal — a duplicate delivery
--     sees it and returns NULL (idempotent no-op).
--   - A 'processing' row whose claim is older than
--     p_stale_after_seconds is treated as crashed: the worker is allowed
--     to re-claim and reprocess. This prevents permanent loss of an
--     event when the original handler crashed before transitioning to a
--     terminal state.
--
-- Exactly-once side effects (e.g., Premium extension) are enforced
-- separately by the unique partial index on
-- user_subscriptions.razorpay_payment_id + activate_subscription().
-- The webhook's job is to ensure every event eventually completes; the
-- activation RPC ensures side effects remain idempotent even if two
-- workers race after a stale-claim recovery.

-- Table: one row per x-razorpay-event-id
CREATE TABLE IF NOT EXISTS razorpay_webhook_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    TEXT NOT NULL UNIQUE,
  event_type  TEXT NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  claimed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  status      TEXT NOT NULL DEFAULT 'processing'
                 CHECK (status IN ('processing', 'processed', 'failed')),
  error       TEXT,
  attempts    INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_razorpay_webhook_events_event_id
  ON razorpay_webhook_events(event_id);

CREATE INDEX IF NOT EXISTS idx_razorpay_webhook_events_status_claimed
  ON razorpay_webhook_events(status, claimed_at);

-- Service role manages the table. Authenticated is intentionally
-- denied write — only the webhook handler (server, service role) may
-- insert/update this table.
GRANT ALL ON razorpay_webhook_events TO service_role;
REVOKE ALL ON razorpay_webhook_events FROM authenticated;
REVOKE ALL ON razorpay_webhook_events FROM anon;

-- RPC: atomically claim a webhook event for processing.
--
-- p_stale_after_seconds:
--   How long a 'processing' row may sit before another worker is
--   allowed to take it over. Default 5 minutes — long enough that an
--   in-flight handler is unlikely to be interrupted, short enough that
--   a crashed request doesn't permanently lose the event.
--
-- Returns the row's UUID if this caller is the first to claim, OR if
-- this caller has legitimately taken over a crashed prior claim.
-- Returns NULL if the event is already in a terminal state (processed
-- or failed) and must not be reprocessed.
CREATE OR REPLACE FUNCTION claim_webhook_event(
  p_event_id             TEXT,
  p_event_type           TEXT,
  p_stale_after_seconds  INTEGER DEFAULT 300
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_id              UUID;
  v_existing_status TEXT;
  v_existing_claimed TIMESTAMPTZ;
BEGIN
  -- Serialize concurrent claim attempts for the same event_id.
  -- pg_advisory_xact_lock is released automatically at COMMIT/ROLLBACK.
  PERFORM pg_advisory_xact_lock(
    hashtext('claim_webhook_event')::bigint,
    hashtext(p_event_id)::bigint
  );

  -- Now serialized: what state is this event in?
  SELECT status, claimed_at
    INTO v_existing_status, v_existing_claimed
  FROM razorpay_webhook_events
  WHERE event_id = p_event_id;

  IF NOT FOUND THEN
    -- No row yet — fresh claim.
    INSERT INTO razorpay_webhook_events (event_id, event_type, status)
    VALUES (p_event_id, p_event_type, 'processing')
    RETURNING id INTO v_id;
    RETURN v_id;
  END IF;

  -- Row exists. Terminal states mean: duplicate delivery, do not reprocess.
  IF v_existing_status IN ('processed', 'failed') THEN
    RETURN NULL;
  END IF;

  -- 'processing' — either still in flight, or crashed.
  -- If the claim is older than the stale window, treat the previous
  -- worker as crashed and let this caller reprocess. Bump attempts and
  -- claimed_at so a stale row doesn't keep getting re-stolen every
  -- second by every concurrent delivery.
  IF v_existing_claimed IS NOT NULL
     AND v_existing_claimed < NOW() - (p_stale_after_seconds || ' seconds')::INTERVAL
  THEN
    UPDATE razorpay_webhook_events
       SET status     = 'processing',
           claimed_at = NOW(),
           attempts   = attempts + 1
     WHERE event_id = p_event_id
     RETURNING id INTO v_id;
    RETURN v_id;
  END IF;

  -- Still within the stale window — assume in flight. Skip.
  RETURN NULL;
END;
$$;

-- Service role runs this; tighten the grant.
REVOKE ALL ON FUNCTION claim_webhook_event(TEXT, TEXT, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION claim_webhook_event(TEXT, TEXT, INTEGER)
  TO service_role;

-- RPC: mark a webhook event as terminal (processed or failed).
--
-- Idempotent — safe to call more than once for the same event. Records
-- the most recent error if any.
CREATE OR REPLACE FUNCTION complete_webhook_event(
  p_event_id TEXT,
  p_status   TEXT,  -- 'processed' or 'failed'
  p_error    TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE razorpay_webhook_events
     SET processed_at = NOW(),
         status       = p_status,
         error        = COALESCE(p_error, error)
   WHERE event_id = p_event_id;
END;
$$;

REVOKE ALL ON FUNCTION complete_webhook_event(TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION complete_webhook_event(TEXT, TEXT, TEXT)
  TO service_role;