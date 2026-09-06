/**
 * GET /api/pyq/search
 *
 * Full-text search across PYQ questions.
 * Public endpoint — works for all users.
 */

import { NextResponse } from "next/server";
import { resolveBranch } from "@/lib/pyq/branches";

interface RouteQuery {
  q?: string;
  branch?: string;
  year?: string;
  type?: string;
  page?: string;
  pageSize?: string;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const query = url.searchParams.get("q")?.trim();
    const branchCode = url.searchParams.get("branch");
    const year = url.searchParams.get("year");
    const questionType = url.searchParams.get("type");
    const page = parseInt(url.searchParams.get("page") || "1") || 1;
    const pageSize = Math.min(parseInt(url.searchParams.get("pageSize") || "15") || 15, 30);

    if (!query || query.length < 2) {
      return NextResponse.json(
        { error: "Search query must be at least 2 characters" },
        { status: 400 }
      );
    }

    // Use Supabase text search
    const { createServerClient } = await import("@/lib/supabase/server");
    const supabase = await createServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    }

    // Build search query
    const searchTerm = `%${query}%`;
    let dbQuery = supabase
      .from("pyq_questions")
      .select("*", { count: "exact" })
      .or(`question_text.ilike.${searchTerm},subject_name.ilike.${searchTerm},topic_name.ilike.${searchTerm},answer_explanation.ilike.${searchTerm}`);

    if (branchCode) {
      const branch = resolveBranch(branchCode);
      if (branch) {
        dbQuery = dbQuery.eq("branch_code", branch.branchCode);
      }
    }

    if (year) {
      dbQuery = dbQuery.eq("year", parseInt(year));
    }

    if (questionType && questionType !== "all") {
      dbQuery = dbQuery.eq("question_type", questionType);
    }

    const from = (page - 1) * pageSize;
    dbQuery = dbQuery.range(from, from + pageSize - 1).order("year", { ascending: false });

    const { data: results, error, count } = await dbQuery;

    if (error) {
      console.error("[PYQ] Search error:", error);
      // Return empty results if table doesn't exist yet
      if (error.code === "42P01" || error.message?.includes("does not exist")) {
        return NextResponse.json({
          query,
          results: [],
          pagination: { page, pageSize, total: 0, totalPages: 0 },
        });
      }
      return NextResponse.json({ error: "Search failed" }, { status: 500 });
    }

    return NextResponse.json({
      query,
      results: (results || []).map((q: Record<string, unknown>) => ({
        id: q.id,
        questionId: q.question_id,
        branchCode: q.branch_code,
        branchName: q.branch_name,
        year: q.year,
        session: q.session,
        questionNumber: q.question_number,
        subjectName: q.subject_name,
        topicName: q.topic_name,
        questionType: q.question_type,
        marks: q.marks,
        difficulty: q.difficulty,
        answerVerified: q.answer_verified,
        qualityTier: q.quality_tier,
      })),
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
    });
  } catch (error) {
    console.error("[PYQ] Search error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
