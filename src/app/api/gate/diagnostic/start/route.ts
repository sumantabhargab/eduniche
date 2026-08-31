/**
 * POST /api/gate/diagnostic/start
 * Creates a diagnostic session and returns questions.
 */

import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

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
    const paperId = typeof body.paperId === "string" ? body.paperId : "";

    if (!paperId) {
      return NextResponse.json({ error: "paperId is required." }, { status: 400 });
    }

    // Create diagnostic session
    const { data: diagnostic, error } = await supabase
      .from("user_diagnostics")
      .insert({
        user_id: session.user.id,
        paper_id: paperId,
        status: "in_progress",
      })
      .select("id")
      .single();

    if (error || !diagnostic) {
      console.error("Diagnostic creation error:", error);
      return NextResponse.json({ error: "Failed to start diagnostic." }, { status: 500 });
    }

    // Get branch intelligence subjects for this paper
    const { data: branchIntel } = await supabase
      .from("gate_branch_intelligence")
      .select("id")
      .eq("paper_id", paperId)
      .maybeSingle();

    let subjects: string[] = [];
    if (branchIntel) {
      const { data: subjectData } = await supabase
        .from("gate_subject_intelligence")
        .select("subject_name")
        .eq("branch_id", branchIntel.id)
        .order("avg_weightage", { ascending: false });

      subjects = subjectData?.map((s) => s.subject_name) || [];
    }

    // Generate questions from existing question bank for this paper
    // Import paper-data to get actual questions
    const { getPaperDataSource } = await import("@/lib/gate/paper-data");
    const src = getPaperDataSource(paperId);

    const questions: Array<{
      id: string;
      subject: string;
      topic: string;
      weightage: number;
      question: string;
      options: string[];
      answer: string;
      explanation: string;
      difficulty: "easy" | "medium" | "hard";
    }> = [];

    if (src && src.questions.length > 0) {
      // Use real questions, selecting 15-20 diverse questions
      const allQuestions = src.questions;
      const count = Math.min(20, allQuestions.length);

      // Pick questions distributed across subjects and difficulties
      const bySubject: Record<string, typeof allQuestions> = {};
      for (const q of allQuestions) {
        const key = q.subject;
        if (!bySubject[key]) bySubject[key] = [];
        bySubject[key].push(q);
      }

      // Take up to 3 per subject
      const selected: typeof allQuestions = [];
      for (const [subj, qs] of Object.entries(bySubject)) {
        const shuffled = [...qs].sort(() => Math.random() - 0.5);
        selected.push(...shuffled.slice(0, 3));
      }

      // Shuffle and take top count
      selected.sort(() => Math.random() - 0.5);
      const finalQuestions = selected.slice(0, count);

      questions.push(...finalQuestions.map((q) => ({
        id: q.id,
        subject: q.subject,
        topic: q.topic,
        weightage: 3,
        question: q.question,
        options: q.options || ["A", "B", "C", "D"],
        answer: q.answer,
        explanation: q.explanation || "",
        difficulty: q.difficulty as "easy" | "medium" | "hard",
      })));
    } else {
      // No question bank — return 0 questions (page will show "No questions available")
      // The plan will still be created based on branch intelligence
    }

    return NextResponse.json({
      diagnosticId: diagnostic.id,
      questions,
    });
  } catch (e) {
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}