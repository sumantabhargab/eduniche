/**
 * GET /api/game/leaderboard
 * Returns top 10 global arcade high scores, with optional branch filter.
 * Query: ?branch=cse (optional)
 */

import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const supabase = await createServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Server not configured." }, { status: 500 });
    }

    const url = new URL(request.url);
    const branch = url.searchParams.get("branch") || null;

    let query = supabase
      .from("gate_arcade_scores")
      .select("user_id, username, branch, score, correct, total, accuracy, best_combo, duration_seconds, created_at")
      .order("score", { ascending: false })
      .limit(10);

    if (branch) {
      query = query.eq("branch", branch);
    }

    const { data: scores, error } = await query;

    if (error) {
      console.error("Arcade leaderboard error:", error);
      return NextResponse.json({ leaderboard: [] });
    }

    // De-duplicate by user_id: keep the highest score per user
    const bestByUser = new Map<string, typeof scores[0]>();
    for (const s of scores ?? []) {
      const existing = bestByUser.get(s.user_id);
      if (!existing || s.score > existing.score) {
        bestByUser.set(s.user_id, s);
      }
    }

    const deduped = Array.from(bestByUser.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    const leaderboard = deduped.map((entry, i) => ({
      rank: i + 1,
      user_id: entry.user_id,
      username: entry.username || "Anonymous",
      branch: entry.branch,
      score: entry.score,
      correct: entry.correct,
      total: entry.total,
      accuracy: entry.accuracy,
      bestCombo: entry.best_combo,
      durationSeconds: entry.duration_seconds,
    }));

    return NextResponse.json({ leaderboard });
  } catch {
    return NextResponse.json({ leaderboard: [] });
  }
}
