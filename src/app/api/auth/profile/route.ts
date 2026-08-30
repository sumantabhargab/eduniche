/**
 * GET /api/auth/profile
 * Returns current user's profile including subscription status.
 */

import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Server not configured." }, { status: 500 });
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const userId = session.user.id;

    // Get profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url, daily_goal_minutes, timezone, role, created_at, plan")
      .eq("id", userId)
      .maybeSingle();

    // Get subscription status
    const { data: subscription } = await supabase
      .from("user_subscriptions")
      .select("plan, status, expires_at, started_at")
      .eq("user_id", userId)
      .eq("status", "active")
      .gte("expires_at", new Date().toISOString())
      .maybeSingle();

    // Get badge count
    const { count: badgeCount } = await supabase
      .from("user_badges")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    const hasUsername = !!profile?.username;
    const userPlan = (profile?.plan as "free" | "monthly_premium" | "weekly_premium") || "free";
    const isPremiumFromPlan = userPlan === "monthly_premium" || userPlan === "weekly_premium";

    return NextResponse.json({
      user: {
        id: userId,
        email: session.user.email,
        display_name: profile?.display_name || session.user.user_metadata?.full_name || session.user.user_metadata?.name,
        avatar_url: profile?.avatar_url || session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture,
        username: profile?.username,
        hasUsername,
        daily_goal_minutes: profile?.daily_goal_minutes ?? 120,
        timezone: profile?.timezone || 'Asia/Kolkata',
        role: profile?.role || 'student',
        plan: userPlan,
        created_at: profile?.created_at || session.user.created_at,
        badge_count: badgeCount || 0,
        isPremium: !!subscription || isPremiumFromPlan,
      },
      subscription: subscription ? {
        plan: subscription.plan,
        status: subscription.status,
        expires_at: subscription.expires_at,
        started_at: subscription.started_at,
      } : null,
      isPremium: !!subscription || isPremiumFromPlan,
    });
  } catch (e) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
