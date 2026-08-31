/**
 * GET /api/gate/topic-performance
 * Get topic performance data for a user's branch.
 */

import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

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
    const paperId = url.searchParams.get("paperId");

    if (!paperId) {
      return NextResponse.json({ error: "paperId is required." }, { status: 400 });
    }

    let query = supabase
      .from("user_topic_performance")
      .select("*")
      .eq("user_id", session.user.id)
      .order("accuracy", { ascending: true });

    if (paperId) {
      query = query.eq("paper_id", paperId);
    }

    const { data: performance, error } = await query;

    if (error) {
      console.error("Topic performance fetch error:", error);
      return NextResponse.json({ error: "Failed to load performance data." }, { status: 500 });
    }

    // Also fetch diagnostic results for the same paper
    const { data: diagnostics } = await supabase
      .from("user_diagnostic_results")
      .select("*")
      .eq("user_id", session.user.id)
      .eq("paper_id", paperId)
      .order("created_at", { ascending: false })
      .limit(1);

    return NextResponse.json({
      topics: performance ?? [],
      latestDiagnostic: diagnostics?.[0] ?? null,
    });
  } catch (e) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}