/**
 * POST /api/webhooks/razorpay
 * Razorpay webhook handler.
 *
 * Verifies webhook signature against the RAW request body, claims the
 * event atomically via the claim_webhook_event RPC, processes it
 * exactly once, and records the outcome.
 *
 * Concurrency safety:
 * - claim_webhook_event RPC ensures only one concurrent webhook call
 *   processes a given event.
 * - activate_subscription RPC ensures verify + webhook races produce
 *   exactly one entitlement extension.
 *
 * Liveness safety:
 * - A 'processing' claim older than 5 minutes is treated as crashed —
 *   the next delivery will steal the claim and reprocess. This prevents
 *   permanent loss of a valid webhook when the original worker crashes.
 *
 * Failed payment safety:
 * - Only marks the order's own subscription row as failed.
 * - Does NOT touch profiles.plan, because a failed payment on one order
 *   must never revoke a premium entitlement granted by a DIFFERENT
 *   successful payment on a DIFFERENT order.
 *
 * State machine:
 *   processing → claimed by a worker
 *   processed  → worker completed successfully (terminal)
 *   failed     → worker completed with error (terminal, retryable via stale-claim)
 */

import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const razorpayWebhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!razorpayWebhookSecret) {
      return NextResponse.json({ error: "Webhook not configured." }, { status: 500 });
    }

    // 1. Read RAW body BEFORE parsing — required for HMAC verification
    const body = await request.text();

    // 2. Verify webhook signature against raw body
    const signature = request.headers.get("x-razorpay-signature");
    if (!signature) {
      return NextResponse.json({ error: "Missing signature." }, { status: 400 });
    }

    const expectedSignature = crypto
      .createHmac("sha256", razorpayWebhookSecret)
      .update(body)
      .digest("hex");

    if (!crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature))) {
      console.error("Invalid Razorpay webhook signature");
      return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
    }

    const event = JSON.parse(body);
    const supabase = createServiceClient();
    if (!supabase) {
      return NextResponse.json({ error: "Server not configured." }, { status: 500 });
    }

    // 3. Use x-razorpay-event-id header as the authoritative event identifier.
    //    Fall back to event.id from the parsed body if the header is absent.
    const eventId = request.headers.get("x-razorpay-event-id") || event.id;
    const eventType = event.event;

    if (!eventId) {
      console.error("Webhook event missing ID (no x-razorpay-event-id header and no event.id)");
      return NextResponse.json({ received: true });
    }

    // claim_webhook_event returns the new row UUID on a fresh or stale claim,
    // NULL if the event is already in a terminal state (processed/failed).
    // Stale threshold: 5 minutes. A 'processing' row older than this is
    // considered crashed and will be re-claimed.
    const claimedId = await supabase.rpc("claim_webhook_event", {
      p_event_id: eventId,
      p_event_type: eventType,
      p_stale_after_seconds: 300,
    });

    if (!claimedId) {
      // Already processed or failed — safe no-op (terminal state).
      return NextResponse.json({ received: true });
    }

    // 4. Process only supported payment events
    const paymentEntity = event.payload?.payment?.entity;

    if (!paymentEntity) {
      // Non-payment event — mark as processed and move on
      await supabase.rpc("complete_webhook_event", {
        p_event_id: eventId,
        p_status: "processed",
      });
      return NextResponse.json({ received: true });
    }

    const orderId = paymentEntity.order_id;
    const paymentId = paymentEntity.id;
    const status = paymentEntity.status;

    // Find subscription by order ID
    const { data: sub } = await supabase
      .from("user_subscriptions")
      .select("*")
      .eq("razorpay_order_id", orderId)
      .maybeSingle();

    if (!sub) {
      // No matching order in our system — not an error, just unknown
      await supabase.rpc("complete_webhook_event", {
        p_event_id: eventId,
        p_status: "processed",
      });
      return NextResponse.json({ received: true });
    }

    try {
      if (status === "captured") {
        // Only auto-capture grants Premium. Authorized-only payments
        // are left for the next Razorpay capture event or user action.
        const { data: updated, error: updateErr } = await supabase.rpc(
          "activate_subscription",
          {
            p_subscription_id: sub.id,
            p_payment_id: paymentId,
            p_plan: sub.plan,
          }
        );

        if (updateErr) {
          console.error("Webhook activation error:", updateErr);
          await supabase.rpc("complete_webhook_event", {
            p_event_id: eventId,
            p_status: "failed",
            p_error: `Activation error: ${updateErr.message || JSON.stringify(updateErr)}`,
          });
          return NextResponse.json({ error: "Activation failed." }, { status: 500 });
        }

        // Sync plan to profiles so premium access works immediately.
        // Only update if this call actually activated (not idempotent no-op).
        if (updated && updated.length > 0) {
          const planValue = sub.plan === "weekly" ? "weekly_premium" : "monthly_premium";
          await supabase
            .from("profiles")
            .update({ plan: planValue })
            .eq("id", sub.user_id);
        }

        await supabase.rpc("complete_webhook_event", {
          p_event_id: eventId,
          p_status: "processed",
        });

      } else if (status === "authorized") {
        // Authorized but not yet captured — do NOT grant Premium yet.
        // Razorpay will send a second 'captured' event once the money
        // is actually captured. Mark as processed since we've noted it.
        await supabase.rpc("complete_webhook_event", {
          p_event_id: eventId,
          p_status: "processed",
        });

      } else if (status === "failed" || status === "refunded") {
        // CRITICAL: Only mark our own subscription row as failed.
        // Do NOT touch profiles.plan — a failed payment on this order
        // must never revoke a premium entitlement granted by a DIFFERENT
        // successful payment on a DIFFERENT order.

        // Only mark as failed if this subscription was not already activated
        // by a successful payment (i.e., razorpay_payment_id is still null
        // or this payment is not the active one).
        const { data: current } = await supabase
          .from("user_subscriptions")
          .select("razorpay_payment_id, status")
          .eq("id", sub.id)
          .single();

        // If another payment already activated this subscription, don't mark it failed.
        if (current && current.razorpay_payment_id && current.razorpay_payment_id !== paymentId) {
          await supabase.rpc("complete_webhook_event", {
            p_event_id: eventId,
            p_status: "processed",
          });
          return NextResponse.json({ received: true });
        }

        await supabase
          .from("user_subscriptions")
          .update({ status: "failed", updated_at: new Date().toISOString() })
          .eq("id", sub.id)
          .eq("razorpay_payment_id", paymentId);

        await supabase.rpc("complete_webhook_event", {
          p_event_id: eventId,
          p_status: "processed",
        });
      } else {
        // Unsupported payment status — mark as processed (not an error)
        await supabase.rpc("complete_webhook_event", {
          p_event_id: eventId,
          p_status: "processed",
        });
      }

      return NextResponse.json({ received: true });
    } catch (processingErr) {
      console.error("Webhook processing error:", processingErr);
      await supabase.rpc("complete_webhook_event", {
        p_event_id: eventId,
        p_status: "failed",
        p_error: `Processing error: ${processingErr instanceof Error ? processingErr.message : "unknown"}`,
      });
      return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
    }
  } catch (e) {
    console.error("Webhook error:", e);
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}