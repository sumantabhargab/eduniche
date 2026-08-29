/**
 * GET /api/study/goal - Get user's daily goal
 * POST /api/study/goal - Set daily goal
 */

import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { checkRateLimit, getClientIdentifier } from "@/lib/rate-limit";

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

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("daily_goal_minutes")
      .eq("id", session.user.id)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: "Failed to load goal." }, { status: 500 });
    }

    return NextResponse.json({
      dailyGoalMinutes: profile?.daily_goal_minutes ?? 120,
    });
  } catch (e) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}

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

    const rl = checkRateLimit({ maxRequests: 10, windowMs: 60000 }, getClientIdentifier(request) + session.user.id);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Too many requests." }, { status: 429 });
    }

    const body = await request.json().catch(() => ({}));
    const minutes = parseInt(body.dailyGoalMinutes);

    // Valid goals: 15 min to 12 hours in 15-minute increments
    if (!Number.isInteger(minutes) || minutes < 15 || minutes > 720 || minutes % 15 !== 0) {
      return NextResponse.json({ error: "Goal must be between 15 and 720 minutes in 15-minute increments." }, { status: 400 });
    }

    const { error } = await supabase
      .from("profiles")
      .update({ daily_goal_minutes: minutes, updated_at: new Date().toISOString() })
      .eq("id", session.user.id);

    if (error) {
      return NextResponse.json({ error: "Failed to update goal." }, { status: 500 });
    }

    return NextResponse.json({ success: true, dailyGoalMinutes: minutes });
  } catch (e) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
