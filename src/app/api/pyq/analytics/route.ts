/**
 * GET /api/pyq/analytics
 *
 * Aggregated PYQ statistics.
 * Public for basic stats.
 * Premium-only for topic-level analytics.
 */

import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { resolveBranch } from "@/lib/pyq/branches";

export async function GET(request: Request) {
  try {
    const supabase = await createServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    }

    const url = new URL(request.url);
    const branchCode = url.searchParams.get("branch");

    // Auth check for premium analytics
    const { data: { session } } = await supabase.auth.getSession();
    const isPremium = session ? await checkPremium(supabase as never, session.user.id) : false;

    // ─── Global / Branch-level stats ───────────────────────────────────────────

    let questionsQuery = supabase.from("pyq_questions").select("branch_code, year, question_type, marks, subject_name, topic_name, difficulty", { count: "exact" });

    if (branchCode) {
      const branch = resolveBranch(branchCode);
      if (branch) {
        questionsQuery = questionsQuery.eq("branch_code", branch.branchCode);
      }
    }

    const { data: questions, count: totalQuestions, error: questionsError } = await questionsQuery;

    if (questionsError) {
      console.error("[PYQ] Analytics query error:", questionsError);
      return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
    }

    if (!questions) {
      return NextResponse.json({
        totalQuestions: 0,
        branches: [],
        yearDistribution: [],
        typeDistribution: [],
        marksDistribution: [],
        isPremium,
      });
    }

    // Compute aggregates
    const branchStats: Record<string, { count: number; years: number[]; subjectCount: number }> = {};
    const yearStats: Record<number, number> = {};
    const typeStats: Record<string, number> = {};
    const marksStats: Record<number, number> = {};

    for (const q of questions) {
      // Branch
      const bc = q.branch_code;
      if (!branchStats[bc]) branchStats[bc] = { count: 0, years: [], subjectCount: 0 };
      branchStats[bc].count++;
      if (!branchStats[bc].years.includes(q.year)) branchStats[bc].years.push(q.year);

      // Year
      yearStats[q.year] = (yearStats[q.year] || 0) + 1;

      // Type
      typeStats[q.question_type] = (typeStats[q.question_type] || 0) + 1;

      // Marks
      marksStats[q.marks] = (marksStats[q.marks] || 0) + 1;
    }

    const response: Record<string, unknown> = {
      totalQuestions: totalQuestions || 0,
      branches: Object.entries(branchStats).map(([code, stats]) => ({
        branchCode: code,
        questionCount: stats.count,
        yearRange: { min: Math.min(...stats.years), max: Math.max(...stats.years) },
        yearCount: stats.years.length,
      })),
      yearDistribution: Object.entries(yearStats)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([year, count]) => ({ year: Number(year), count })),
      typeDistribution: Object.entries(typeStats).map(([type, count]) => ({ type, count })),
      marksDistribution: Object.entries(marksStats)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([marks, count]) => ({ marks: Number(marks), count })),
      isPremium,
    };

    // ─── Premium analytics: topic-level ───────────────────────────────────────

    if (isPremium) {
      const topicQuery = supabase
        .from("pyq_questions")
        .select("subject_name, topic_name, year, question_type, marks", { count: "exact" });

      if (branchCode) {
        const branch = resolveBranch(branchCode);
        if (branch) topicQuery.eq("branch_code", branch.branchCode);
      }

      const { data: topicData } = await topicQuery;

      if (topicData) {
        const topicAgg: Record<string, { subject: string; count: number; years: number[]; totalMarks: number }> = {};
        for (const q of topicData) {
          const key = `${q.topic_name}`;
          if (!topicAgg[key]) topicAgg[key] = { subject: q.subject_name, count: 0, years: [], totalMarks: 0 };
          topicAgg[key].count++;
          topicAgg[key].totalMarks += q.marks;
          if (!topicAgg[key].years.includes(q.year)) topicAgg[key].years.push(q.year);
        }

        response.topicStats = Object.entries(topicAgg)
          .sort(([, a], [, b]) => b.count - a.count)
          .slice(0, 100)
          .map(([topicName, stats]) => ({
            topicName,
            subject: stats.subject,
            questionCount: stats.count,
            totalMarks: stats.totalMarks,
            yearRange: { min: Math.min(...stats.years), max: Math.max(...stats.years) },
            yearCount: stats.years.length,
          }));
      }
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("[PYQ] Analytics error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function checkPremium(supabase: Awaited<ReturnType<typeof createServerClient>>, userId: string): Promise<boolean> {
  if (!supabase) return false;
  const { data: profile } = await supabase.from("profiles").select("plan").eq("id", userId).maybeSingle();
  if ((profile as { plan?: string } | null)?.plan === "monthly_premium" || (profile as { plan?: string } | null)?.plan === "weekly_premium") return true;

  const { data: subResult } = await supabase.rpc("has_active_subscription", { p_user_id: userId } as never);
  return subResult === true;
}
