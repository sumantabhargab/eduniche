/**
 * POST /api/subscriptions/verify
 * Verifies Razorpay payment signature and activates subscription.
 *
 * Concurrency safety: Uses the same atomic activate_subscription RPC as
 * the webhook. Verify and webhook can safely race — only one wins.
 *
 * Payment safety (multi-layer):
 *   Layer 1: Validates Razorpay HMAC signature (proves data came from Razorpay).
 *   Layer 2: Verifies the order belongs to the authenticated user (prevents
 *            a user from claiming another user's order ID).
 *   Layer 3: Confirms server-stored plan/amount/currency are authoritative
 *            (never trusts client-supplied values).
 *   Layer 4: Fetches the payment directly from Razorpay's API server-side
 *            and verifies:
 *              - payment.order_id matches our stored order ID
 *              - payment.amount matches our stored amount
 *              - payment.currency matches our stored currency
 *              - payment.status === "captured" (not merely "authorized")
 *   Only after ALL layers pass is Premium entitlement granted.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import crypto from "crypto";
import { legacyPlanToPlanId } from "@/config/plans";
import { ok, badRequest, serverError } from "@/lib/api/response";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    if (!supabase) {
      return serverError("Server not configured.");
    }

    const razorpayKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!razorpayKeyId || !razorpayKeySecret) {
      return serverError("Payment verification not configured.");
    }

    // 1. Authenticate — payment identity comes from the Supabase session
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user) {
      return badRequest("Unauthorized.");
    }

    const body = await request.json().catch(() => ({}));
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return badRequest("Missing payment details.");
    }

    // 2. Verify Razorpay signature server-side using the trusted order ID.
    //    This proves the data came from Razorpay, but does NOT prove
    //    the payment was captured or belongs to this order.
    const expectedSignature = crypto
      .createHmac("sha256", razorpayKeySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (!crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(razorpay_signature))) {
      console.error("Invalid Razorpay signature:", {
        order: razorpay_order_id,
        payment: razorpay_payment_id,
      });
      return badRequest("Invalid payment signature.");
    }

    // 3. Look up the order from our database using the Razorpay order ID.
    //    Server-side plan/amount/currency are the ONLY authority.
    //    NEVER trust client-supplied plan, amount, or user ID.
    const { data: order, error: orderErr } = await supabase
      .from("user_subscriptions")
      .select("id, plan, status, expires_at, user_id, razorpay_payment_id, amount, currency")
      .eq("razorpay_order_id", razorpay_order_id)
      .maybeSingle();

    if (orderErr || !order) {
      console.error("Order not found in database:", razorpay_order_id);
      return badRequest("Order not recognized.");
    }

    // 4. Verify the order belongs to the authenticated user.
    //    A user must not be able to claim another user's order ID.
    if (order.user_id !== session.user.id) {
      console.error("Order ownership mismatch:", {
        orderId: razorpay_order_id,
        orderUserId: order.user_id,
        sessionUserId: session.user.id,
      });
      return badRequest("Order not found.");
    }

    // 5. Fetch the payment directly from Razorpay's API to confirm
    //    real payment state before granting entitlement.
    //    The browser-supplied signature only proves Razorpay signed it;
    //    it does NOT prove the payment was captured or matches our order.
    const authHeader = Buffer.from(`${razorpayKeyId}:${razorpayKeySecret}`).toString("base64");

    let razorpayPayment: {
      id: string;
      order_id: string;
      amount: number;
      currency: string;
      status: string;
      captured?: boolean;
    };

    try {
      const paymentResponse = await fetch(
        `https://api.razorpay.com/v1/payments/${razorpay_payment_id}`,
        {
          headers: {
            Authorization: `Basic ${authHeader}`,
          },
        },
      );

      if (!paymentResponse.ok) {
        const errorText = await paymentResponse.text();
        console.error("Razorpay payment fetch failed:", paymentResponse.status, errorText);
        return badRequest("Unable to verify payment with provider.");
      }

      razorpayPayment = await paymentResponse.json() as typeof razorpayPayment;
    } catch (fetchErr) {
      console.error("Razorpay payment fetch error:", fetchErr);
      return badRequest("Unable to verify payment with provider.");
    }

    // 5a. Confirm the payment belongs to the expected order.
    //     This prevents replaying a valid payment signature for a different order.
    if (razorpayPayment.order_id !== razorpay_order_id) {
      console.error("Payment order mismatch:", {
        paymentOrder: razorpayPayment.order_id,
        expectedOrder: razorpay_order_id,
      });
      return badRequest("Payment does not match order.");
    }

    // 5b. Confirm the amount matches our server-side stored amount.
    //     Razorpay amounts are in paise (smallest currency unit).
    if (razorpayPayment.amount !== order.amount) {
      console.error("Payment amount mismatch:", {
        paymentAmount: razorpayPayment.amount,
        orderAmount: order.amount,
      });
      return badRequest("Payment amount mismatch.");
    }

    // 5c. Confirm the currency matches.
    if (razorpayPayment.currency !== order.currency) {
      console.error("Payment currency mismatch:", {
        paymentCurrency: razorpayPayment.currency,
        orderCurrency: order.currency,
      });
      return badRequest("Payment currency mismatch.");
    }

    // 5d. Confirm the payment is captured, not merely authorized.
    //     An "authorized" payment holds funds but hasn't actually
    //     transferred them. Do NOT grant Premium for authorized-only.
    if (razorpayPayment.status !== "captured") {
      if (razorpayPayment.status === "authorized") {
        return new Response(JSON.stringify({ status: "pending_capture", message: "Payment authorized, awaiting capture." }), {
          status: 202,
          headers: { "Content-Type": "application/json" },
        });
      }
      return badRequest(`Payment not captured (status: ${razorpayPayment.status}).`);
    }

    // 6. Normalize plan via legacyPlanToPlanId for any legacy values
    const canonicalPlan = legacyPlanToPlanId(order.plan);

    // 7. Atomic claim + activation via RPC.
    //    WHERE razorpay_payment_id IS NULL ensures only one concurrent caller
    //    (verify or webhook) can activate this payment. All subsequent calls
    //    hit 0 rows and return as already-processed.
    //    Extension is computed in SQL so it is atomic with the claim.
    const { data: updated, error: updateErr } = await supabase.rpc(
      "activate_subscription",
      {
        p_subscription_id: order.id,
        p_payment_id: razorpay_payment_id,
        p_plan: canonicalPlan,
      },
    );

    if (updateErr) {
      console.error("Subscription activation error:", updateErr);
      return serverError("Failed to activate subscription.");
    }

    // 8. If the RPC returned null, the payment was already claimed by a
    //    concurrent verify or webhook call. Return success — idempotent.
    if (!updated || updated.length === 0) {
      const { data: current } = await supabase
        .from("user_subscriptions")
        .select("*")
        .eq("id", order.id)
        .single();

      return NextResponse.json(ok({ success: true, subscription: current, idempotent: true }));
    }

    const subscription = updated[0];

    // 9. Sync plan to profiles table so premium access works immediately
    const planValue = canonicalPlan === "weekly" ? "weekly_premium" : "monthly_premium";
    await supabase
      .from("profiles")
      .update({ plan: planValue })
      .eq("id", session.user.id);

    return NextResponse.json(ok({ success: true, subscription }));
  } catch (e) {
    console.error("Subscription verify error:", e);
    return badRequest("Invalid request.");
  }
}
