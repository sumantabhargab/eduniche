/**
 * POST /api/pyq/attempts
 *
 * Records a student's attempt at a question.
 */

import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getUser, clientIdentifier } from "@/lib/auth/user";
import { checkRateLimit } from "@/lib/rate-limit/db";
import { ok, badRequest, unauthorized, serverError } from "@/lib/api/response";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { questionId, selectedAnswer, practiceMode, sessionId } = body;

    if (!questionId || selectedAnswer === undefined) {
      return badRequest("Missing required fields: questionId and selectedAnswer");
    }

    const user = await getUser();
    if (!user) {
      return unauthorized("Sign in to record your attempt");
    }

    const supabase = await createServerClient();
    if (!supabase) {
      return serverError("Database unavailable");
    }

    // Rate limit
    const rateResult = await checkRateLimit(
      clientIdentifier(user.id, request),
      "pyq_attempts",
      { windowSeconds: 60, maxRequests: 20 }
    );
    if (!rateResult.allowed) {
      return serverError("Too many requests. Please slow down.");
    }

    // Validate question exists
    const { data: question, error: questionError } = await supabase
      .from("pyq_questions")
      .select("correct_answer, id")
      .eq("id", questionId)
      .single();

    if (questionError || !question) {
      return badRequest("Question not found");
    }

    const isCorrect = selectedAnswer === question.correct_answer;

    const { error } = await supabase.from("pyq_attempts").insert({
      question_id: questionId,
      user_id: user.id,
      selected_answer: selectedAnswer,
      is_correct: isCorrect,
      practice_mode: practiceMode || "practice",
      session_id: sessionId || null,
      revealed_answer: practiceMode === "practice",
    });

    if (error) {
      console.error("[PYQ] Attempt record error:", error);
      return serverError("Failed to record attempt");
    }

    return ok({ success: true, isCorrect });
  } catch (error) {
    console.error("[PYQ] Attempt error:", error);
    return serverError("Internal server error");
  }
}
