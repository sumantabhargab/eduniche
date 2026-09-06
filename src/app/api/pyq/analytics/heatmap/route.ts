/**
 * GET /api/pyq/analytics/heatmap
 *
 * Returns topic frequency data across years for the heatmap.
 * Premium-only endpoint.
 */

import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const branch = searchParams.get("branch");

    const supabase = await createServiceClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    }

    // Build query
    let query = supabase
      .from("pyq_questions")
      .select("topic_name, year, branch_code")
      .eq("is_duplicate", false)
      .not("topic_name", "is", null);

    if (branch) query = query.eq("branch_code", branch.toUpperCase());

    const { data: questions, error } = await query;

    if (error) {
      console.error("[PYQ] Heatmap query error:", error);
      return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
    }

    // Build heatmap: topic -> year -> count
    const heatmap: Record<string, Record<number, number>> = {};
    const years = new Set<number>();

    for (const q of questions || []) {
      years.add(q.year);
      if (!heatmap[q.topic_name]) {
        heatmap[q.topic_name] = {};
      }
      heatmap[q.topic_name][q.year] = (heatmap[q.topic_name][q.year] || 0) + 1;
    }

    return NextResponse.json({
      heatmap,
      years: Array.from(years).sort(),
    });
  } catch (error) {
    console.error("[PYQ] Heatmap error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
