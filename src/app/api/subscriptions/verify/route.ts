/**
 * POST /api/subscriptions/verify
 * Verifies Razorpay payment signature and activates subscription.
 * CRITICAL: This must be called server-side only.
 */

import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import crypto from "crypto";

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

    const body = await request.json().catch(() => ({}));
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: "Missing payment details." }, { status: 400 });
    }

    // CRITICAL: Verify Razorpay signature
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!razorpayKeySecret) {
      return NextResponse.json({ error: "Payment verification not configured." }, { status: 500 });
    }

    const expectedSignature = crypto
      .createHmac("sha256", razorpayKeySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      console.error("Invalid Razorpay signature:", {
        order: razorpay_order_id,
        payment: razorpay_payment_id,
        expected: expectedSignature,
        received: razorpay_signature,
      });
      return NextResponse.json({ error: "Invalid payment signature." }, { status: 400 });
    }

    // Check if this payment was already processed
    const { data: existing } = await supabase
      .from("user_subscriptions")
      .select("*")
      .eq("razorpay_payment_id", razorpay_payment_id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ success: true, subscription: existing });
    }

    // Calculate expiry
    const startedAt = new Date();
    let expiresAt: Date;
    if (plan === 'weekly') {
      expiresAt = new Date(startedAt);
      expiresAt.setDate(expiresAt.getDate() + 7);
    } else {
      expiresAt = new Date(startedAt);
      expiresAt.setMonth(expiresAt.getMonth() + 1);
    }

    // Create subscription record
    const { data: subscription, error } = await supabase
      .from("user_subscriptions")
      .insert({
        user_id: session.user.id,
        plan: plan || 'monthly',
        status: 'active',
        provider: 'razorpay',
        razorpay_order_id,
        razorpay_payment_id,
        started_at: startedAt.toISOString(),
        expires_at: expiresAt.toISOString(),
      })
      .select("*")
      .single();

    if (error) {
      console.error("Subscription creation error:", error);
      return NextResponse.json({ error: "Failed to activate subscription." }, { status: 500 });
    }

    // Sync plan to profiles table
    const planValue = plan === 'weekly' ? 'weekly_premium' : 'monthly_premium';
    await supabase
      .from("profiles")
      .update({ plan: planValue })
      .eq("id", session.user.id);

    return NextResponse.json({ success: true, subscription });
  } catch (e) {
    console.error("Subscription verify error:", e);
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
