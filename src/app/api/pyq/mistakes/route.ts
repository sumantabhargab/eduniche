/**
 * GET /api/pyq/mistakes
 *
 * Returns the student's mistake bank.
 */

import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const supabase = await createServiceClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    }

    // In production, get user ID from auth session
    // const { data: { user } } = await supabase.auth.getUser();
    // const userId = user?.id;
    const userId = "anonymous";

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
          question_text,
          question_html,
          options,
          correct_answer,
          marks,
          difficulty,
          question_type
        )
      `)
      .eq("user_id", userId)
      .eq("is_correct", false)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("[PYQ] Mistakes query error:", error);
      return NextResponse.json({ error: "Failed to fetch mistakes" }, { status: 500 });
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

    return NextResponse.json({ mistakes, total: mistakes.length });
  } catch (error) {
    console.error("[PYQ] Mistakes error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
