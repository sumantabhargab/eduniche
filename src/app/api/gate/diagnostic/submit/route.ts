/**
 * POST /api/gate/diagnostic/submit
 * Submits diagnostic answers, calculates scores, and creates a study plan.
 */

import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { generateQuestionsForBranch } from "@/lib/gate/question-generator.server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Server not configured." }, { status: 500 });
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const diagnosticId = typeof body.diagnosticId === "string" ? body.diagnosticId : "";
    const paperId = typeof body.paperId === "string" ? body.paperId : "";
    const answers: Record<string, string> = body.answers || {};

    if (!diagnosticId) {
      return NextResponse.json({ error: "diagnosticId is required." }, { status: 400 });
    }

    // Fetch diagnostic
    const { data: diagnostic } = await supabase
      .from("user_diagnostics")
      .select("*")
      .eq("id", diagnosticId)
      .eq("user_id", session.user.id)
      .single();

    if (!diagnostic) {
      return NextResponse.json({ error: "Diagnostic not found." }, { status: 404 });
    }

    // Try real question bank (CSE/ECE), then fall back to generated questions
    const { getPaperDataSource } = await import("@/lib/gate/paper-data");
    const src = getPaperDataSource(paperId);
    let questions: any[] = [];

    if (src && src.questions.length > 0) {
      questions = src.questions.slice(0, 20);
    } else {
      // Use generated questions — map back to letter answers
      const generated = generateQuestionsForBranch(paperId, 10, "full-syllabus");
      questions = generated.map((q: any, idx: number) => ({
        id: q.id || `${paperId}-diagnostic-q-${idx + 1}`,
        subject: q.subject,
        topic: q.topic,
        answer: String.fromCharCode(65 + q.answer), // index → letter
      }));
    }

    // Calculate scores by topic
    const topicScores: Record<string, { correct: number; total: number; accuracy: number }> = {};
    let correctCount = 0;

    for (const q of questions) {
      const userAnswer = answers[q.id];
      const isCorrect = userAnswer && userAnswer === q.answer;

      if (!topicScores[q.subject]) {
        topicScores[q.subject] = { correct: 0, total: 0, accuracy: 0 };
      }
      topicScores[q.subject].total++;
      if (isCorrect) {
        topicScores[q.subject].correct++;
        correctCount++;
      }
    }

    // Calculate accuracy percentages
    for (const key of Object.keys(topicScores)) {
      const t = topicScores[key];
      t.accuracy = t.total > 0 ? Math.round((t.correct / t.total) * 100) : 0;
    }

    const totalQuestions = questions.length;
    const overallScore = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

    // Update diagnostic with results
    await supabase
      .from("user_diagnostics")
      .update({
        status: "completed",
        score: overallScore,
        correct_answers: correctCount,
        total_questions: totalQuestions,
        results: topicScores,
        completed_at: new Date().toISOString(),
      })
      .eq("id", diagnosticId);

    // Identify weak topics for study plan
    const weakTopics = Object.entries(topicScores)
      .filter(([, scores]) => scores.accuracy < 70)
      .sort((a, b) => a[1].accuracy - b[1].accuracy);

    const mediumTopics = Object.entries(topicScores)
      .filter(([, scores]) => scores.accuracy >= 70 && scores.accuracy < 90);

    const priorityTopics = weakTopics.length > 0 ? weakTopics : mediumTopics;

    // Build plan items
    const planItems: Array<{
      dayNumber: number;
      subject: string;
      topic: string;
      taskType: string;
      estimatedMinutes: number;
    }> = [];

    const days = 7;
    const topicsPerDay = Math.max(1, Math.ceil(priorityTopics.length / days));

    for (let day = 1; day <= days; day++) {
      const dayTopics = priorityTopics.slice((day - 1) * topicsPerDay, day * topicsPerDay);

      if (dayTopics.length === 0) {
        planItems.push({
          dayNumber: day,
          subject: "General",
          topic: "Full revision and mock test",
          taskType: "test",
          estimatedMinutes: 120,
        });
        continue;
      }

      for (const [subject, scores] of dayTopics) {
        // Get actual topics from branch intelligence
        let topicName = subject;
        const { data: branchIntel } = await supabase
          .from("gate_branch_intelligence")
          .select("id")
          .eq("paper_id", paperId)
          .maybeSingle();

        if (branchIntel) {
          const { data: subjectIntel } = await supabase
            .from("gate_subject_intelligence")
            .select("topics")
            .eq("branch_id", branchIntel.id)
            .eq("subject_name", subject)
            .maybeSingle();

          if (subjectIntel && Array.isArray(subjectIntel.topics) && subjectIntel.topics.length > 0) {
            const weakTopic = subjectIntel.topics.find((_, idx) => idx < Math.ceil(subjectIntel.topics.length / 3));
            topicName = weakTopic || subjectIntel.topics[0];
          }
        }

        const taskType = scores.accuracy < 40 ? "study" : scores.accuracy < 70 ? "practice" : "review";
        const mins = taskType === "study" ? 45 : taskType === "practice" ? 30 : 30;

        planItems.push({
          dayNumber: day,
          subject,
          topic: topicName,
          taskType,
          estimatedMinutes: mins,
        });
      }
    }

    // Create study plan
    const { data: plan, error: planError } = await supabase
      .from("user_study_plans")
      .insert({
        user_id: session.user.id,
        paper_id: paperId,
        title: `GATE ${paperId.toUpperCase()} — 7-Day Study Plan`,
        status: "active",
        source_diagnostic_id: diagnosticId,
      })
      .select("id")
      .single();

    let planId: string | null = null;
    if (planError || !plan) {
      console.error("Plan creation error:", planError);
    } else {
      planId = plan.id;

      // Insert plan items
      if (planItems.length > 0) {
        const items = planItems.map((item) => ({
          plan_id: plan.id,
          day_number: item.dayNumber,
          subject: item.subject,
          topic: item.topic,
          task_type: item.taskType,
          estimated_minutes: item.estimatedMinutes,
        }));

        await supabase.from("user_study_plan_items").insert(items);
      }
    }

    return NextResponse.json({
      totalScore: overallScore,
      correctAnswers: correctCount,
      totalQuestions,
      topicScores,
      planId,
      planItems,
    });
  } catch (e: any) {
    console.error("Diagnostic submit error:", e);
    return NextResponse.json(
      { error: "Server error.", detail: e?.message },
      { status: 500 }
    );
  }
}