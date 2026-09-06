/**
 * POST /api/pyq/attempts
 *
 * Records a student's attempt at a question.
 */

import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { questionId, selectedAnswer, practiceMode, sessionId } = body;

    if (!questionId || selectedAnswer === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // In a real implementation, get user ID from auth session
    // For now, we use a placeholder
    const supabase = await createServiceClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    }

    // Get question details to check answer
    const { data: question } = await supabase
      .from("pyq_questions")
      .select("correct_answer, id")
      .eq("id", questionId)
      .single();

    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    const isCorrect = selectedAnswer === question.correct_answer;

    // In production, get user ID from session
    // const { data: { user } } = await supabase.auth.getUser();
    // const userId = user?.id;
    const userId = "anonymous"; // Placeholder

    const { error } = await supabase.from("pyq_attempts").insert({
      question_id: questionId,
      user_id: userId,
      selected_answer: selectedAnswer,
      is_correct: isCorrect,
      practice_mode: practiceMode || "practice",
      session_id: sessionId || null,
      revealed_answer: practiceMode === "practice",
    });

    if (error) {
      console.error("[PYQ] Attempt record error:", error);
      return NextResponse.json({ error: "Failed to record attempt" }, { status: 500 });
    }

    return NextResponse.json({ success: true, isCorrect });
  } catch (error) {
    console.error("[PYQ] Attempt error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
