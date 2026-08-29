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

// POST - Start a new session
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

    // Rate limit
    const rl = checkRateLimit({ maxRequests: 10, windowMs: 60000 }, getClientIdentifier(request) + session.user.id);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
    }

    const body = await request.json().catch(() => ({}));
    const { room_id, branch_id, subject_id, topic } = body;

    // Validate inputs
    if (room_id && typeof room_id === 'string' && room_id.length > 100) {
      return NextResponse.json({ error: "Invalid room_id." }, { status: 400 });
    }
    if (topic && typeof topic === 'string' && topic.length > 200) {
      return NextResponse.json({ error: "Topic too long." }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("study_sessions")
      .insert({
        user_id: session.user.id,
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
      return NextResponse.json({ error: "Failed to start session." }, { status: 500 });
    }

    return NextResponse.json({ session: data }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
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
