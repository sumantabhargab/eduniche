/**
 * GET /api/pyq/analytics/trends
 *
 * Returns topic trend analysis — which topics are increasing/decreasing in frequency.
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

    // Get all questions for trend analysis
    let query = supabase
      .from("pyq_questions")
      .select("topic_name, year, subject_name")
      .eq("is_duplicate", false)
      .not("topic_name", "is", null);

    if (branch) query = query.eq("branch_code", branch.toUpperCase());

    const { data: questions, error } = await query;

    if (error) {
      console.error("[PYQ] Trends query error:", error);
      return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
    }

    // Group by topic and year
    const topicYearMap = new Map<string, Map<number, number>>();
    const allYears = new Set<number>();

    for (const q of questions || []) {
      allYears.add(q.year);
      if (!topicYearMap.has(q.topic_name)) {
        topicYearMap.set(q.topic_name, new Map());
      }
      const yearMap = topicYearMap.get(q.topic_name)!;
      yearMap.set(q.year, (yearMap.get(q.year) || 0) + 1);
    }

    const sortedYears = Array.from(allYears).sort();
    const halfPoint = Math.floor(sortedYears.length / 2);
    const firstHalf = sortedYears.slice(0, halfPoint);
    const secondHalf = sortedYears.slice(halfPoint);

    // Calculate trends
    const trends: { topic: string; trend: "increasing" | "decreasing" | "stable"; change: number; count: number }[] = [];

    for (const [topic, yearMap] of topicYearMap.entries()) {
      const firstHalfCount = firstHalf.reduce((sum, y) => sum + (yearMap.get(y) || 0), 0);
      const secondHalfCount = secondHalf.reduce((sum, y) => sum + (yearMap.get(y) || 0), 0);
      const totalCount = Array.from(yearMap.values()).reduce((a, b) => a + b, 0);

      if (totalCount < 2) continue;

      const avgFirst = firstHalfCount / firstHalf.length || 0;
      const avgSecond = secondHalfCount / secondHalf.length || 0;

      let trend: "increasing" | "decreasing" | "stable";
      let change: number;

      if (avgFirst === 0) {
        trend = avgSecond > 0 ? "increasing" : "stable";
        change = 0;
      } else {
        const pctChange = ((avgSecond - avgFirst) / avgFirst) * 100;
        change = Math.round(pctChange);
        if (pctChange > 20) trend = "increasing";
        else if (pctChange < -20) trend = "decreasing";
        else trend = "stable";
      }

      trends.push({ topic, trend, change, count: totalCount });
    }

    // Sort by total count descending, take top 20
    trends.sort((a, b) => b.count - a.count);

    return NextResponse.json({ trends: trends.slice(0, 20) });
  } catch (error) {
    console.error("[PYQ] Trends error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
