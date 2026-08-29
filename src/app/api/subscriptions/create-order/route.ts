/**
 * POST /api/subscriptions/create-order
 * Creates a Razorpay order for subscription payment.
 */

import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { checkRateLimit, getClientIdentifier } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Server not configured." }, { status: 500 });
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const rl = checkRateLimit({ maxRequests: 5, windowMs: 60000 }, getClientIdentifier(request) + session.user.id);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Too many requests." }, { status: 429 });
    }

    const body = await request.json().catch(() => ({}));
    const plan = typeof body.plan === 'string' ? body.plan : "";

    if (!['weekly', 'monthly'].includes(plan)) {
      return NextResponse.json({ error: "Invalid plan. Choose 'weekly' or 'monthly'." }, { status: 400 });
    }

    // Check Razorpay credentials
    const razorpayKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!razorpayKeyId || !razorpayKeySecret) {
      return NextResponse.json({ error: "Payment system not configured." }, { status: 500 });
    }

    // Check if user already has active subscription
    const { data: activeSub } = await supabase
      .from("user_subscriptions")
      .select("*")
      .eq("user_id", session.user.id)
      .eq("status", "active")
      .gte("expires_at", new Date().toISOString())
      .maybeSingle();

    if (activeSub) {
      return NextResponse.json({ error: "You already have an active subscription." }, { status: 400 });
    }

    const amount = plan === 'monthly' ? 4900 : 2000; // in paise (₹49, ₹20)
    const receipt = `edun_${session.user.id.slice(0, 8)}_${Date.now()}`;

    // Create Razorpay order via API
    const authHeader = Buffer.from(`${razorpayKeyId}:${razorpayKeySecret}`).toString('base64');

    const orderResponse = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${authHeader}`,
      },
      body: JSON.stringify({
        amount,
        currency: "INR",
        receipt,
        payment_capture: 1,
        notes: {
          user_id: session.user.id,
          plan,
        },
      }),
    });

    if (!orderResponse.ok) {
      const errorData = await orderResponse.text();
      console.error("Razorpay order error:", errorData);
      return NextResponse.json({ error: "Failed to create payment order." }, { status: 500 });
    }

    const order = await orderResponse.json();

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
