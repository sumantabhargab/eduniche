/**
 * GET /api/pyq/admin/review-queue
 *
 * Admin-only: Returns questions needing review.
 */

import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/user";
import { unauthorized, forbidden, serverError, ok } from "@/lib/api/response";

export async function GET() {
  try {
    const user = await getUser();
    if (!user) {
      return unauthorized("Authentication required");
    }

    const supabase = await createServerClient();
    if (!supabase) {
      return serverError("Database unavailable");
    }

    // Verify admin role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile || !["admin", "super_admin"].includes(profile.role)) {
      return forbidden("Admin access required");
    }

    // Get questions needing review
    const { data: reviewQuestions, error } = await supabase
      .from("pyq_questions")
      .select("*")
      .or("quality_tier.neq.A,answer_verified.eq.false")
      .order("created_at", { ascending: true })
      .limit(100);

    if (error) {
      console.error("[PYQ] Review queue error:", error);
      return serverError("Failed to load review queue");
    }

    // Get aggregate stats
    const { count: totalQuestions } = await supabase
      .from("pyq_questions")
      .select("*", { count: "exact", head: true });

    const { count: verifiedCount } = await supabase
      .from("pyq_questions")
      .select("*", { count: "exact", head: true })
      .eq("answer_verified", true);

    const { count: tierACount } = await supabase
      .from("pyq_questions")
      .select("*", { count: "exact", head: true })
      .eq("quality_tier", "A");

    return ok({
      reviewQueue: (reviewQuestions || []).map((q: Record<string, unknown>) => ({
        id: q.id,
        questionId: q.question_id,
        branchCode: q.branch_code,
        year: q.year,
        questionNumber: q.question_number,
        subjectName: q.subject_name,
        topicName: q.topic_name,
        questionType: q.question_type,
        marks: q.marks,
        answer: q.correct_answer,
        answerSource: q.answer_source,
        answerVerified: q.answer_verified,
        verificationConfidence: q.verification_confidence,
        qualityTier: q.quality_tier,
        topicConfidence: q.topic_confidence,
        createdAt: q.created_at,
      })),
      stats: {
        totalQuestions: totalQuestions || 0,
        verifiedCount: verifiedCount || 0,
        tierACount: tierACount || 0,
        pendingReview: reviewQuestions?.length || 0,
      },
    });
  } catch (error) {
    console.error("[PYQ] Admin review error:", error);
    return serverError("Internal server error");
  }
}
