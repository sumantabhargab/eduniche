/**
 * POST /api/webhooks/razorpay
 * Razorpay webhook handler.
 * Verifies webhook signature and updates subscription status.
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

    const body = await request.text();

    // Verify webhook signature
    const signature = request.headers.get("x-razorpay-signature");
    if (!signature) {
      return NextResponse.json({ error: "Missing signature." }, { status: 400 });
    }

    const expectedSignature = crypto
      .createHmac("sha256", razorpayWebhookSecret)
      .update(body)
      .digest("hex");

    if (signature !== expectedSignature) {
      console.error("Invalid Razorpay webhook signature");
      return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
    }

    const event = JSON.parse(body);
    const supabase = createServiceClient();
    if (!supabase) {
      return NextResponse.json({ error: "Server not configured." }, { status: 500 });
    }

    const eventType = event.event;
    const paymentEntity = event.payload?.payment?.entity;

    if (!paymentEntity) {
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
      return NextResponse.json({ received: true });
    }

    // Handle different payment statuses
    if (status === "captured" || status === "authorized") {
      await supabase
        .from("user_subscriptions")
        .update({
          razorpay_payment_id: paymentId,
          status: "active",
          updated_at: new Date().toISOString(),
        })
        .eq("id", sub.id);
    } else if (status === "failed" || status === "refunded") {
      await supabase
        .from("user_subscriptions")
        .update({ status: "failed", updated_at: new Date().toISOString() })
        .eq("id", sub.id);
    }

    return NextResponse.json({ received: true });
  } catch (e) {
    console.error("Webhook error:", e);
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}
