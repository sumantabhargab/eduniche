/**
 * GET /api/pyq/admin/stats
 *
 * Admin-only: Comprehensive PYQ statistics for content quality dashboard.
 */

import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createServiceClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    }

    // Total counts
    const { count: totalQuestions } = await supabase
      .from("pyq_questions")
      .select("*", { count: "exact", head: true });

    const { count: totalBranches } = await supabase
      .from("pyq_branches")
      .select("*", { count: "exact", head: true })
      .eq("active", true);

    const { count: totalSubjects } = await supabase
      .from("pyq_subjects")
      .select("*", { count: "exact", head: true });

    const { count: totalTopics } = await supabase
      .from("pyq_topics")
      .select("*", { count: "exact", head: true });

    // Quality stats - cast through any to avoid TS issues with supabase generated types
    const { data: qualityData } = await supabase
      .from("pyq_questions")
      .select("quality_tier, answer_verified, branch_code")
      .limit(500);

    const qualityTierCounts: Record<string, number> = {};
    const branchCounts: Record<string, number> = {};
    let verifiedCount = 0;
    let unverifiedCount = 0;

    for (const q of qualityData || []) {
      const row = q as Record<string, unknown>;
      qualityTierCounts[String(row.quality_tier || "unknown")] = (qualityTierCounts[String(row.quality_tier || "unknown")] || 0) + 1;
      branchCounts[String(row.branch_code || "unknown")] = (branchCounts[String(row.branch_code || "unknown")] || 0) + 1;
      if (row.answer_verified) verifiedCount++;
      else unverifiedCount++;
    }

    // Source stats
    const { data: sourceData } = await supabase
      .from("pyq_sources")
      .select("source_type, question_count")
      .limit(200);

    const sourceStats: Record<string, number> = {};
    for (const s of sourceData || []) {
      const row = s as Record<string, unknown>;
      sourceStats[String(row.source_type || "unknown")] = (sourceStats[String(row.source_type || "unknown")] || 0) + Number(row.question_count || 0);
    }

    // Attempt stats
    const { count: totalAttempts } = await supabase
      .from("pyq_attempts")
      .select("*", { count: "exact", head: true });

    // Bookmark stats
    const { count: totalBookmarks } = await supabase
      .from("pyq_bookmarks")
      .select("*", { count: "exact", head: true });

    return NextResponse.json({
      totals: {
        questions: totalQuestions || 0,
        branches: totalBranches || 0,
        subjects: totalSubjects || 0,
        topics: totalTopics || 0,
        attempts: totalAttempts || 0,
        bookmarks: totalBookmarks || 0,
      },
      quality: {
        verified: verifiedCount,
        unverified: unverifiedCount,
        verificationRate: totalQuestions ? Math.round((verifiedCount / totalQuestions) * 100) : 0,
        tiers: qualityTierCounts,
      },
      branches: branchCounts,
      sources: sourceStats,
    });
  } catch (error) {
    console.error("[PYQ] Admin stats error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
