/**
 * POST /api/pyq/bookmarks
 * DELETE /api/pyq/bookmarks
 *
 * Creates or removes a bookmark for the authenticated user.
 */

import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/user";
import { ok, badRequest, unauthorized, serverError } from "@/lib/api/response";

async function getAuthenticatedUser() {
  const supabase = await createServerClient();
  if (!supabase) return { supabase: null as any, user: null };
  const userResult = await requireUser();
  return { supabase, user: userResult.ok ? userResult.user : null };
}

export async function POST(request: Request) {
  try {
    const { supabase, user } = await getAuthenticatedUser();
    if (!supabase || !user) {
      return unauthorized("Unauthorized. Please sign in.");
    }

    const body = await request.json();
    const { questionId } = body;

    if (!questionId) {
      return badRequest("Missing questionId");
    }

    // Look up the question to get its branch_code — never hardcode
    const { data: question, error: qErr } = await supabase
      .from("pyq_questions")
      .select("branch_code")
      .eq("id", questionId)
      .maybeSingle();

    if (qErr || !question) {
      return badRequest("Question not found.");
    }

    const { error } = await supabase.from("pyq_bookmarks").upsert({
      question_id: questionId,
      user_id: user.id,
      branch_code: question.branch_code,
    }, { onConflict: "user_id,question_id" });

    if (error) {
      console.error("[PYQ] Bookmark error:", error);
      return serverError("Failed to bookmark");
    }

    return NextResponse.json(ok({ success: true }));
  } catch (error) {
    console.error("[PYQ] Bookmark error:", error);
    return serverError("Internal server error");
  }
}

export async function DELETE(request: Request) {
  try {
    const { supabase, user } = await getAuthenticatedUser();
    if (!supabase || !user) {
      return unauthorized("Unauthorized. Please sign in.");
    }

    const { searchParams } = new URL(request.url);
    const questionId = searchParams.get("questionId");

    if (!questionId) {
      return badRequest("Missing questionId");
    }

    const { error } = await supabase
      .from("pyq_bookmarks")
      .delete()
      .eq("question_id", questionId)
      .eq("user_id", user.id);

    if (error) {
      console.error("[PYQ] Unbookmark error:", error);
      return serverError("Failed to remove bookmark");
    }

    return NextResponse.json(ok({ success: true }));
  } catch (error) {
    console.error("[PYQ] Unbookmark error:", error);
    return serverError("Internal server error");
  }
}

export async function GET() {
  try {
    const { supabase, user } = await getAuthenticatedUser();
    if (!supabase) {
      return NextResponse.json({ bookmarks: [] });
    }

    const userId = user?.id;
    if (!userId) {
      return NextResponse.json({ bookmarks: [] });
    }

    const { data: bookmarks } = await supabase
      .from("pyq_bookmarks")
      .select(`
        id,
        question_id,
        note,
        created_at,
        pyq_questions (
          id,
          question_id,
          branch_code,
          year,
          question_number,
          subject_name,
          topic_name,
          question_text,
          options,
          correct_answer,
          marks,
          question_type
        )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    const result = (bookmarks || []).map((b: any) => ({
      id: b.id,
      questionId: b.question_id,
      note: b.note,
      createdAt: b.created_at,
      question: b.pyq_questions,
    }));

    return NextResponse.json({ bookmarks: result });
  } catch (error) {
    console.error("[PYQ] Bookmarks fetch error:", error);
    return NextResponse.json({ bookmarks: [] });
  }
}
