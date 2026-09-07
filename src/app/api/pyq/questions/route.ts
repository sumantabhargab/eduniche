/**
 * GET /api/pyq/questions
 *
 * Returns paginated PYQ questions with optional filters.
 * Free users: no topic filter, basic filters only
 * Premium users: all filters including topic
 */

import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // ─── Extract filters ─────────────────────────────────────────────────
    const branchCode = searchParams.get("branch")?.toUpperCase() || null;
    const subject = searchParams.get("subject") || null;
    const topic = searchParams.get("topic") || null;
    const year = searchParams.get("year") ? parseInt(searchParams.get("year")!) : null;
    const yearFrom = searchParams.get("yearFrom") ? parseInt(searchParams.get("yearFrom")!) : null;
    const yearTo = searchParams.get("yearTo") ? parseInt(searchParams.get("yearTo")!) : null;
    const questionType = searchParams.get("type") || null;
    const difficulty = searchParams.get("difficulty") || null;
    const marks = searchParams.get("marks") ? parseInt(searchParams.get("marks")!) : null;
    const search = searchParams.get("search") || null;
    const verifiedOnly = searchParams.get("verifiedOnly") === "true";
    const sortBy = searchParams.get("sortBy") || "year";
    const sortDir = searchParams.get("sortDir") === "asc" ? "asc" : "desc";
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = Math.min(parseInt(searchParams.get("pageSize") || "20"), 100);

    // ─── Premium check for topic filter ──────────────────────────────────
    if (topic) {
      const supabase = await createServerClient();
      if (!supabase) {
        return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
      }
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        return NextResponse.json(
          { error: "Topic filtering requires authentication. Please sign in.", requiresAuth: true },
          { status: 401 }
        );
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("plan")
        .eq("id", session.user.id)
        .maybeSingle();
      const isPremium = (profile?.plan as string | null) === "monthly_premium" ||
                        (profile?.plan as string | null) === "weekly_premium";
      if (!isPremium) {
        const { data: sub } = await supabase
          .from("user_subscriptions")
          .select("plan")
          .eq("user_id", session.user.id)
          .eq("status", "active")
          .gte("expires_at", new Date().toISOString())
          .maybeSingle();
        if (!sub) {
          return NextResponse.json(
            { error: "Topic filtering is a Premium feature. Please upgrade to access.", requiresPremium: true },
            { status: 403 }
          );
        }
      }
    }

    // ─── Build query ────────────────────────────────────────────────────
    const supabase = await createServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    }

    let query = supabase
      .from("pyq_questions")
      .select("*", { count: "exact" })
      .eq("is_duplicate", false)
      .order(sortBy as string, { ascending: sortDir === "asc" });

    // Apply filters
    if (branchCode) query = query.eq("branch_code", branchCode);
    if (subject) query = query.ilike("subject_name", `%${subject}%`);
    if (topic) query = query.ilike("topic_name", `%${topic}%`);
    if (year) query = query.eq("year", year);
    if (yearFrom) query = query.gte("year", yearFrom);
    if (yearTo) query = query.lte("year", yearTo);
    if (questionType) query = query.eq("question_type", questionType);
    if (difficulty) query = query.eq("difficulty", difficulty);
    if (marks) query = query.eq("marks", marks);
    if (verifiedOnly) query = query.eq("answer_verified", true);

    // Search in question text
    if (search) {
      query = query.or(`question_text.ilike.%${search}%,subject_name.ilike.%${search}%,topic_name.ilike.%${search}%`);
    }

    // Pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error("[PYQ] Questions query error:", error);
      const code = (error as { code?: string }).code;
      const msg = (error as { message?: string }).message || "";
      if (code === "42P01" || code === "PGRST205" || msg.includes("does not exist") || msg.includes("Could not find the table") || msg.includes("schema cache")) {
        return NextResponse.json({ data: [], pagination: { page, pageSize, totalCount: 0, totalPages: 0, hasMore: false } });
      }
      return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 });
    }

    // Transform to frontend format
    const questions = (data || []).map((q: Record<string, unknown>) => ({
      id: q.id as string,
      questionId: q.question_id as string,
      questionNumber: q.question_number as number,
      subjectName: q.subject_name as string,
      topicName: q.topic_name as string,
      questionType: q.question_type as string,
      marks: q.marks as number,
      difficulty: q.difficulty as string,
      year: q.year as number,
      session: q.session as string | undefined,
      questionText: q.question_text as string,
      questionHtml: q.question_html as string | undefined,
      options: (q.options as string[]) || [],
      correctAnswer: q.correct_answer as string,
      answerExplanation: q.answer_explanation as string,
      source: q.source as { primary: string; url?: string } | undefined,
      answerVerified: q.answer_verified as boolean,
    }));

    return NextResponse.json({
      data: questions,
      pagination: {
        page,
        pageSize,
        totalCount: count || 0,
        totalPages: count ? Math.ceil(count / pageSize) : 0,
        hasMore: count ? from + questions.length < count : false,
      },
    });
  } catch (error) {
    console.error("[PYQ] Questions error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
