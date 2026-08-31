/**
 * POST /api/subscriptions/create-order
 * Creates a Razorpay order for subscription payment.
 *
 * IMPORTANT: Inserts a pending subscription row BEFORE creating the
 * Razorpay order. This ensures verify and webhook can always find
 * the order in our database.
 */

import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { checkRateLimit, getClientIdentifier } from "@/lib/rate-limit";

// Authoritative server-side plan configuration.
// The client may request a plan, but NEVER controls price, currency,
// or entitlement duration.
const PLANS = {
  weekly: {
    durationDays: 7,
    amountPaise: 2000,
    currency: "INR",
    label: "weekly_premium",
  },
  monthly: {
    durationDays: 30,
    amountPaise: 4900,
    currency: "INR",
    label: "monthly_premium",
  },
} as const;

type PlanKey = keyof typeof PLANS;

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Server not configured." }, { status: 500 });
    }

    // 1. Authenticate — payment identity comes from the Supabase session,
    //    never from client-supplied user IDs.
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    // 2. Rate limit per user+IP
    const rl = checkRateLimit(
      { maxRequests: 5, windowMs: 60000 },
      getClientIdentifier(request) + session.user.id
    );
    if (!rl.allowed) {
      return NextResponse.json({ error: "Too many requests." }, { status: 429 });
    }

    // 3. Validate plan — reject unknown plans, trust only server config
    const body = await request.json().catch(() => ({}));
    const rawPlan = typeof body.plan === "string" ? body.plan : "";
    const plan = rawPlan as PlanKey;

    if (!PLANS[plan]) {
      return NextResponse.json(
        { error: "Invalid plan. Choose 'weekly' or 'monthly'." },
        { status: 400 }
      );
    }

    // 4. Resolve plan config entirely from server
    const config = PLANS[plan];
    const amount = config.amountPaise;
    const currency = config.currency;

    // 5. Check Razorpay credentials
    const razorpayKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!razorpayKeyId || !razorpayKeySecret) {
      return NextResponse.json({ error: "Payment system not configured." }, { status: 500 });
    }

    // 6. Insert a pending subscription row BEFORE creating the Razorpay order.
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
      return NextResponse.json({ error: "Failed to initialize payment." }, { status: 500 });
    }

    const receipt = `edun_${subRow.id.slice(0, 8)}_${Date.now()}`;

    // 7. Create Razorpay order server-side
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
      return NextResponse.json({ error: "Failed to create payment order." }, { status: 500 });
    }

    const order = await orderResponse.json();

    // 8. Link the Razorpay order ID to our subscription row
    await supabase
      .from("user_subscriptions")
      .update({ razorpay_order_id: order.id })
      .eq("id", subRow.id);

    // 9. Return only data required by the browser
    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: razorpayKeyId,
    });
  } catch (e) {
    console.error("Subscription order error:", e);
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
