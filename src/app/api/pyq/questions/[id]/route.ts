import { NextResponse } from "next/server";
import { SupabaseClient } from "@supabase/supabase-js";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    }

    const { id } = await params;

    const { data: question, error } = await supabase
      .from("pyq_questions")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    // Check premium for full details
    const { data: { session } } = await supabase.auth.getSession();
    const isPremium = session ? await checkPremiumInline(supabase, session.user.id) : false;

    return NextResponse.json({
      id: question.id,
      questionId: question.question_id,
      branchCode: question.branch_code,
      branchName: question.branch_name,
      exam: question.exam,
      year: question.year,
      session: question.session,
      questionNumber: question.question_number,
      subjectId: question.subject_id,
      subjectName: question.subject_name,
      topicId: question.topic_id,
      topicName: question.topic_name,
      questionType: question.question_type,
      marks: question.marks,
      negativeMarks: question.negative_marks,
      questionText: question.question_text,
      questionHtml: question.question_html,
      options: question.options || [],
      correctAnswer: question.correct_answer,
      answerExplanation: question.answer_explanation,
      difficulty: question.difficulty,
      tags: question.tags || [],
      source: {
        primary: question.source_primary,
        url: question.source_url,
        sourceType: question.source_type,
        sourceReference: question.source_reference,
      },
      answerSource: question.answer_source,
      answerVerified: question.answer_verified,
      verificationConfidence: question.verification_confidence,
      qualityTier: question.quality_tier,
      imageUrl: question.image_url,
      imageAltText: question.image_alt_text,
      isDuplicate: question.is_duplicate,
      filters: {
        topicFilterAvailable: isPremium,
      },
    });
  } catch (error) {
    console.error("[PYQ] Failed to fetch question:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function checkPremiumInline(supabase: SupabaseClient<any>, userId: string): Promise<boolean> {
  const { data: profile } = await supabase.from("profiles").select("plan").eq("id", userId).maybeSingle();
  if ((profile as { plan?: string } | null)?.plan === "monthly_premium" || (profile as { plan?: string } | null)?.plan === "weekly_premium") return true;

  const { data: subResult } = await supabase.rpc("has_active_subscription", { p_user_id: userId } as never);
  return subResult === true;
}
