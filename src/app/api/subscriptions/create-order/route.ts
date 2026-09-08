/**
 * POST /api/subscriptions/create-order
 * Creates a Razorpay order for subscription payment.
 *
 * IMPORTANT: Inserts a pending subscription row BEFORE creating the
 * Razorpay order. This ensures verify and webhook can always find
 * the order in our database.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { checkRateLimit, getClientIdentifier } from "@/lib/rate-limit";
import { PLANS, PAID_PLAN_IDS, formatINR } from "@/config/plans";
import { ok, badRequest, serverError } from "@/lib/api/response";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    if (!supabase) {
      return serverError("Server not configured.");
    }

    // 1. Authenticate — payment identity comes from the Supabase session,
    //    never from client-supplied user IDs.
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user) {
      return badRequest("Unauthorized.");
    }

    // 2. Rate limit per user+IP
    const rl = checkRateLimit(
      { maxRequests: 5, windowMs: 60000 },
      getClientIdentifier(request) + session.user.id,
    );
    if (!rl.allowed) {
      return badRequest("Too many requests.");
    }

    // 3. Validate plan — reject unknown plans, trust only server config
    const body = await request.json().catch(() => ({}));
    const rawPlan = typeof body.plan === "string" ? body.plan : "";

    if (!PAID_PLAN_IDS.includes(rawPlan as any) || !PLANS[rawPlan as keyof typeof PLANS]) {
      return badRequest("Invalid plan. Choose 'weekly' or 'monthly'.");
    }

    const plan = rawPlan as keyof typeof PLANS;
    const config = PLANS[plan];
    const amount = config.amountInPaise;
    const currency = config.currency;

    // 4. Check Razorpay credentials
    const razorpayKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!razorpayKeyId || !razorpayKeySecret) {
      return serverError("Payment system not configured.");
    }

    // 5. Insert a pending subscription row BEFORE creating the Razorpay order.
    //    This ensures verify and webhook can always find the order.
    //    The atomic activate_subscription RPC will claim it on first successful payment.
    const { data: subRow, error: insertErr } = await supabase
      .from("user_subscriptions")
      .insert({
        user_id: session.user.id,
        plan,
        status: "pending",
        amount,
        currency,
        provider: "razorpay",
      })
      .select("id")
      .single();

    if (insertErr || !subRow) {
      console.error("Failed to create pending subscription:", insertErr);
      return serverError("Failed to initialize payment.");
    }

    const receipt = `edun_${subRow.id.slice(0, 8)}_${Date.now()}`;

    // 6. Create Razorpay order server-side
    const authHeader = Buffer.from(`${razorpayKeyId}:${razorpayKeySecret}`).toString("base64");

    const orderResponse = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${authHeader}`,
      },
      body: JSON.stringify({
        amount,
        currency,
        receipt,
        payment_capture: 1,
        notes: {
          user_id: session.user.id,
          plan,
          subscription_id: subRow.id,
        },
      }),
    });

    if (!orderResponse.ok) {
      // Clean up the pending row if Razorpay order creation failed
      await supabase
        .from("user_subscriptions")
        .delete()
        .eq("id", subRow.id);

      const errorData = await orderResponse.text();
      console.error("Razorpay order error:", errorData);
      return serverError("Failed to create payment order.");
    }

    const order = await orderResponse.json();

    // 7. Link the Razorpay order ID to our subscription row
    await supabase
      .from("user_subscriptions")
      .update({ razorpay_order_id: order.id })
      .eq("id", subRow.id);

    // 8. Return only data required by the browser
    return NextResponse.json(ok({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: razorpayKeyId,
      formattedAmount: formatINR(amount),
      plan: plan,
      durationDays: config.durationDays,
    }));
  } catch (e) {
    console.error("Subscription order error:", e);
    return badRequest("Invalid request.");
  }
}
