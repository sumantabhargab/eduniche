/**
 * GET /api/pyq/mistakes
 *
 * Returns the authenticated student's mistake bank.
 */

import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/user";
import { ok, unauthorized, serverError } from "@/lib/api/response";

export async function GET(request: Request) {
  try {
    const user = await getUser();
    if (!user) {
      return unauthorized("Sign in to view your mistake bank");
    }

    const supabase = await createServerClient();
    if (!supabase) {
      return serverError("Database unavailable");
    }

    const { data: attempts, error } = await supabase
      .from("pyq_attempts")
      .select(`
        id,
        question_id,
        selected_answer,
        created_at,
        pyq_questions (
          id,
          branch_code,
          year,
          session,
          question_number,
          subject_name,
          topic_name,
          correct_answer
        )
      `)
      .eq("user_id", user.id)
      .eq("is_correct", false)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("[PYQ] Mistakes query error:", error);
      return serverError("Failed to fetch mistakes");
    }

    const mistakes = (attempts || []).map((a: {
      id: string;
      question_id: string;
      selected_answer: string;
      created_at: string;
      pyq_questions: {
        id: string;
        branch_code: string;
        year: number;
        session?: string;
        question_number: number;
        subject_name: string;
        topic_name: string;
        correct_answer: string;
      }[];
    }) => {
      const q = a.pyq_questions[0];
      return {
        id: a.id,
        questionId: a.question_id,
        branchCode: q?.branch_code || "",
        year: q?.year || 0,
        session: q?.session,
        questionNumber: q?.question_number || 0,
        subjectName: q?.subject_name || "",
        topicName: q?.topic_name || "",
        selectedAnswer: a.selected_answer,
        correctAnswer: q?.correct_answer || "",
        createdAt: a.created_at,
      };
    });

    return ok({ mistakes, total: mistakes.length });
  } catch (error) {
    console.error("[PYQ] Mistakes error:", error);
    return serverError("Internal server error");
  }
}
