/**
 * POST /api/pyq/bookmarks
 * DELETE /api/pyq/bookmarks
 *
 * Creates or removes a bookmark for the authenticated user.
 */

import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

async function getUserId() {
  const supabase = await createServerClient();
  if (!supabase) return null;
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id || null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { questionId } = body;

    if (!questionId) {
      return NextResponse.json({ error: "Missing questionId" }, { status: 400 });
    }

    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    const supabase = await createServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    }

    const { error } = await supabase.from("pyq_bookmarks").upsert({
      question_id: questionId,
      user_id: userId,
      branch_code: "CS",
    }, { onConflict: "user_id,question_id" });

    if (error) {
      console.error("[PYQ] Bookmark error:", error);
      return NextResponse.json({ error: "Failed to bookmark" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[PYQ] Bookmark error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const questionId = searchParams.get("questionId");

    if (!questionId) {
      return NextResponse.json({ error: "Missing questionId" }, { status: 400 });
    }

    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    const supabase = await createServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    }

    const { error } = await supabase
      .from("pyq_bookmarks")
      .delete()
      .eq("question_id", questionId)
      .eq("user_id", userId);

    if (error) {
      console.error("[PYQ] Unbookmark error:", error);
      return NextResponse.json({ error: "Failed to remove bookmark" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[PYQ] Unbookmark error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ bookmarks: [] });
    }

    const supabase = await createServerClient();
    if (!supabase) {
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
