/**
 * POST /api/pyq/bookmarks
 * DELETE /api/pyq/bookmarks
 *
 * Creates or removes a bookmark.
 */

import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { questionId } = body;

    if (!questionId) {
      return NextResponse.json({ error: "Missing questionId" }, { status: 400 });
    }

    const supabase = await createServiceClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    }

    // Get question details
    const { data: question } = await supabase
      .from("pyq_questions")
      .select("branch_code")
      .eq("id", questionId)
      .single();

    // In production, get user ID from session
    // const { data: { user } } = await supabase.auth.getUser();
    // const userId = user?.id;
    const userId = "anonymous";

    const { error } = await supabase.from("pyq_bookmarks").insert({
      question_id: questionId,
      user_id: userId,
      branch_code: question?.branch_code || "CS",
    });

    if (error) {
      // Handle duplicate bookmark
      if (error.code === "23505") {
        return NextResponse.json({ success: true, message: "Already bookmarked" });
      }
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

    const supabase = await createServiceClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    }

    // In production, get user ID from session
    const userId = "anonymous";

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
