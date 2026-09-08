/**
 * POST /api/study/sessions
 * Creates a new study session.
 * GET /api/study/sessions
 * Lists user's study sessions.
 * PATCH /api/study/sessions/[id]
 * Ends/updates a session.
 */

import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { checkRateLimit, getClientIdentifier } from "@/lib/rate-limit";
import { validateUuid } from "@/modules/content-cms/lib/validators";
import { requireUser } from "@/lib/auth/user";
import { ok, badRequest, unauthorized, conflict, serverError } from "@/lib/api/response";

// POST - Start a new session
export async function POST(request: Request) {
  try {
    const supabase = await createServerClient();
    if (!supabase) {
      return serverError("Server not configured.");
    }

    // Authenticate via requireUser helper
    const userResult = await requireUser();
    if (!userResult.ok) {
      return unauthorized();
    }
    const { user } = userResult;

    // Rate limit
    const rl = checkRateLimit({ maxRequests: 10, windowMs: 60000 }, getClientIdentifier(request) + user.id);
    if (!rl.allowed) {
      return badRequest("Too many requests. Please try again later.");
    }

    const body = await request.json().catch(() => ({}));
    const { room_id, branch_id, subject_id, topic } = body;

    // Validate inputs
    if (room_id && typeof room_id === 'string' && room_id.length > 100) {
      return badRequest("Invalid room_id.");
    }
    if (topic && typeof topic === 'string' && topic.length > 200) {
      return badRequest("Topic too long.");
    }

    // Enforce session uniqueness: reject if user already has an active session
    const { data: activeSession, error: activeError } = await supabase
      .from("study_sessions")
      .select("id, started_at, validation_status")
      .eq("user_id", user.id)
      .eq("validation_status", "pending")
      .maybeSingle();

    if (activeError) {
      console.error("Active session check error:", activeError);
      return serverError("Failed to check existing sessions.");
    }

    if (activeSession) {
      return conflict("You already have an active study session. End it before starting a new one.", {
        existingSessionId: activeSession.id,
        startedAt: activeSession.started_at,
      });
    }

    const { data, error } = await supabase
      .from("study_sessions")
      .insert({
        user_id: user.id,
        room_id: room_id ?? null,
        branch_id: branch_id ?? null,
        subject_id: subject_id ?? null,
        topic: topic ?? null,
        started_at: new Date().toISOString(),
        validation_status: 'pending',
      })
      .select("*")
      .single();

    if (error) {
      console.error("Session create error:", error);
      return serverError("Failed to start session.");
    }

    return NextResponse.json(ok({ session: data }), { status: 201 });
  } catch (e) {
    return badRequest("Invalid request.");
  }
}

// GET - List sessions
export async function GET(request: Request) {
  try {
    const supabase = await createServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Server not configured." }, { status: 500 });
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 100);
    const status = url.searchParams.get("status");

    let query = supabase
      .from("study_sessions")
      .select("*")
      .eq("user_id", session.user.id)
      .order("started_at", { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq("validation_status", status);
    }

    const { data, error } = await query;
    if (error) {
      console.error("Session list error:", error);
      return NextResponse.json({ error: "Failed to load sessions." }, { status: 500 });
    }

    return NextResponse.json({ sessions: data ?? [] });
  } catch (e) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
