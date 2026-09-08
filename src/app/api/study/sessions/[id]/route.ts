/**
 * PATCH /api/study/sessions/[id]
 * Ends a study session with validation.
 */

import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { checkRateLimit, getClientIdentifier } from "@/lib/rate-limit";
import { requireUser } from "@/lib/auth/user";
import { ok, conflict, serverError } from "@/lib/api/response";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabaseRaw = await createServerClient();
    if (!supabaseRaw) {
      return serverError("Server not configured.");
    }
    const sb: any = supabaseRaw;

    // Authenticate via requireUser helper
    const userResult = await requireUser();
    if (!userResult.ok) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    const { user } = userResult;

    const rl = checkRateLimit({ maxRequests: 20, windowMs: 60000 }, getClientIdentifier(request) + user.id);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Too many requests." }, { status: 429 });
    }

    const { id } = await params;
    if (!validateUuid(id)) {
      return NextResponse.json({ error: "Invalid session ID." }, { status: 400 });
    }

    // Fetch the session
    const { data: existing, error: fetchError } = await sb
      .from("study_sessions")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (fetchError || !existing) {
      return NextResponse.json({ error: "Session not found." }, { status: 404 });
    }

    if (existing.validation_status !== 'pending') {
      return conflict("Session already ended.", {
        sessionId: id,
        currentStatus: existing.validation_status,
      });
    }

    const body = await request.json().catch(() => ({}));
    const { ended_at, duration_seconds } = body;

    // Server-side validation of duration
    const now = new Date();
    const serverEndedAt = ended_at ? new Date(ended_at) : now;
    const startedAt = new Date(existing.started_at);
    const serverDuration = Math.floor((serverEndedAt.getTime() - startedAt.getTime()) / 1000);

    // Reject impossible values
    if (serverEndedAt < startedAt) {
      return NextResponse.json({ error: "Invalid end time." }, { status: 400 });
    }
    if (serverDuration > 24 * 3600) {
      // Max 24 hours per session
      return NextResponse.json({ error: "Session too long." }, { status: 400 });
    }
    if (serverDuration < 1) {
      return NextResponse.json({ error: "Session too short." }, { status: 400 });
    }

    // Flat 60-second tolerance against client-provided duration.
    // Reject client values that deviate by more than 60s from server-side calculation.
    const clientDuration = typeof duration_seconds === 'number' ? duration_seconds : null;
    const finalDuration = clientDuration && Math.abs(clientDuration - serverDuration) <= 60
      ? clientDuration
      : serverDuration;

    const { data: updated, error: updateError } = await sb
      .from("study_sessions")
      .update({
        ended_at: serverEndedAt.toISOString(),
        duration_seconds: finalDuration,
        validation_status: 'valid',
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .select("*")
      .single();

    if (updateError) {
      console.error("Session end error:", updateError);
      return NextResponse.json({ error: "Failed to end session." }, { status: 500 });
    }

    // Check for new badges
    await checkAndAwardBadges(sb, user.id);

    return NextResponse.json(ok({ session: updated }));
  } catch (e) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}

function validateUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

async function checkAndAwardBadges(supabase: any, userId: string) {
  // This is simplified - in production, use a proper badge engine
  try {
    const { data: sessions } = await supabase
      .from("study_sessions")
      .select("duration_seconds")
      .eq("user_id", userId)
      .eq("validation_status", "valid");

    if (!sessions) return;

    const totalMinutes = sessions.reduce((sum: number, s: any) => sum + (s.duration_seconds || 0), 0) / 60;
    const maxSessionMinutes = Math.max(...sessions.map((s: any) => (s.duration_seconds || 0) / 60), 0);

    const badgesToAward: string[] = [];

    if (sessions.length >= 1) badgesToAward.push("first_session");
    if (totalMinutes >= 10) badgesToAward.push("scholar");
    if (totalMinutes >= 50) badgesToAward.push("dedicated");
    if (totalMinutes >= 100) badgesToAward.push("hundred_club");
    if (maxSessionMinutes >= 300) badgesToAward.push("deep_focus");

    for (const badgeKey of badgesToAward) {
      await supabase.from("user_badges").upsert(
        { user_id: userId, badge_key: badgeKey },
        { onConflict: "user_id,badge_key" }
      );
    }
  } catch (e) {
    // Non-critical, don't fail the session end
  }
}
