/**
 * GET /api/pyq/search
 *
 * Full-text search across PYQ questions.
 * Public endpoint — works for all users.
 * Falls back to static question bank when Supabase is unavailable.
 */

import { NextResponse } from "next/server";
import { resolveBranch } from "@/lib/pyq/branches";
import { getStaticQuestionsForBranch } from "@/lib/pyq/static-questions";

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

    // Try Supabase first, fall back to static bank
    let results: any[] = [];
    let total = 0;
    let useStatic = false;

    try {
      const { createServerClient } = await import("@/lib/supabase/server");
      const supabase = await createServerClient();

      if (supabase) {
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

        const { data: dbResults, error, count } = await dbQuery;

        if (error) {
          if (error.code === "42P01" || error.message?.includes("does not exist")) {
            useStatic = true;
          } else {
            console.error("[PYQ] Search error:", error);
          }
        } else if (dbResults && dbResults.length > 0) {
          results = dbResults.map((q: Record<string, unknown>) => ({
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
          }));
          total = count || 0;
        } else {
          useStatic = true;
        }
      } else {
        useStatic = true;
      }
    } catch (dbError) {
      console.warn("[PYQ] Search DB unavailable, using static fallback:", dbError);
      useStatic = true;
    }

    // Static fallback
    if (useStatic && branchCode) {
      const rawQs = getStaticQuestionsForBranch(branchCode);
      const s = query.toLowerCase();
      const filtered = rawQs.filter((q) =>
        q.questionText.toLowerCase().includes(s) ||
        q.subjectName.toLowerCase().includes(s) ||
        q.topicName.toLowerCase().includes(s)
      ).sort((a, b) => b.year - a.year);

      total = filtered.length;
      const from = (page - 1) * pageSize;
      results = filtered.slice(from, from + pageSize).map((q) => ({
        id: q.id,
        questionId: q.id,
        branchCode: q.branchCode,
        branchName: "",
        year: q.year,
        session: q.session,
        questionNumber: q.questionNumber,
        subjectName: q.subjectName,
        topicName: q.topicName,
        questionType: q.questionType,
        marks: q.marks,
        difficulty: q.difficulty,
        answerVerified: q.answerVerified,
        qualityTier: "standard" as const,
      }));
    } else if (useStatic && !branchCode) {
      // Search across all branches statically
      const allBranches = ["CS", "EC", "EE", "ME", "CE", "IN", "PI", "CH", "BT", "MT", "XE", "XL", "TF", "PE", "EY", "MA", "AR", "AG", "GG", "PH"];
      const allQs: ReturnType<typeof getStaticQuestionsForBranch> extends (infer T)[] ? T[] : any[] = [];
      const s = query.toLowerCase();
      for (const b of allBranches) {
        const branchQs = getStaticQuestionsForBranch(b);
        const matched = branchQs.filter((q) =>
          q.questionText.toLowerCase().includes(s) ||
          q.subjectName.toLowerCase().includes(s) ||
          q.topicName.toLowerCase().includes(s)
        );
        allQs.push(...matched);
      }
      allQs.sort((a, b) => b.year - a.year);
      total = allQs.length;
      const from = (page - 1) * pageSize;
      results = allQs.slice(from, from + pageSize).map((q) => ({
        id: q.id,
        questionId: q.id,
        branchCode: q.branchCode,
        branchName: "",
        year: q.year,
        session: q.session,
        questionNumber: q.questionNumber,
        subjectName: q.subjectName,
        topicName: q.topicName,
        questionType: q.questionType,
        marks: q.marks,
        difficulty: q.difficulty,
        answerVerified: q.answerVerified,
        qualityTier: "standard" as const,
      }));
    }

    const responsePayload = {
      query,
      results,
      questions: results, // alias for compatibility with callers expecting `questions`
      pagination: {
        page,
        pageSize,
        total,
        totalPages: total ? Math.ceil(total / pageSize) : 0,
      },
    };

    return NextResponse.json(responsePayload);
  } catch (error) {
    console.error("[PYQ] Search error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
