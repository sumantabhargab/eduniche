/**
 * POST /api/game/score
 * Submits a game session score to the arcade leaderboard.
 * Body: { branch, score, correct, total, accuracy, bestCombo, durationSeconds }
 */

import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Server not configured." }, { status: 500 });
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Sign in to submit scores." }, { status: 401 });
    }

    const body = await request.json();
    const { branch, score, correct, total, accuracy, bestCombo, durationSeconds } = body;

    if (!branch || score == null || correct == null || total == null) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("gate_arcade_scores")
      .insert({
        user_id: session.user.id,
        username: session.user.user_metadata?.username || session.user.email?.split("@")[0],
        branch: branch as string,
        score: Math.max(0, score as number),
        correct: correct as number,
        total: total as number,
        accuracy: (accuracy as string) || "0%",
        best_combo: (bestCombo as number) || 0,
        duration_seconds: (durationSeconds as number) || 0,
      })
      .select("id, created_at")
      .single();

    if (error) {
      console.error("Arcade score insert error:", error);
      return NextResponse.json({ error: "Failed to save score." }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: data.id, created_at: data.created_at });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
