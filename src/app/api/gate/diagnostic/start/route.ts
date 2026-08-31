/**
 * POST /api/gate/diagnostic/start
 * Creates a diagnostic session and returns questions.
 *
 * Questions are sourced from:
 * - Real question bank for CSE/ECE
 * - Generated questions from branch intelligence for all other branches
 */

import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { generateQuestionsForBranch } from "@/lib/gate/question-generator.server";

export const dynamic = "force-dynamic";

const DIAGNOSTIC_SIZE = 10;

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

    // Try real question bank first (CSE/ECE)
    const { getPaperDataSource } = await import("@/lib/gate/paper-data");
    const src = getPaperDataSource(paperId);

    if (src && src.questions.length > 0) {
      // Use real questions, distributing across subjects
      const bySubject: Record<string, typeof src.questions> = {};
      for (const q of src.questions) {
        const key = q.subject;
        if (!bySubject[key]) bySubject[key] = [];
        bySubject[key].push(q);
      }

      // Take up to 2 per subject to balance coverage
      const selected: typeof src.questions = [];
      for (const [, qs] of Object.entries(bySubject)) {
        const shuffled = [...qs].sort(() => Math.random() - 0.5);
        selected.push(...shuffled.slice(0, 2));
      }

      // Shuffle and take DIAGNOSTIC_SIZE
      selected.sort(() => Math.random() - 0.5);
      const finalQuestions = selected.slice(0, DIAGNOSTIC_SIZE);

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
      // Use question generator for all other branches
      const generated = generateQuestionsForBranch(paperId, DIAGNOSTIC_SIZE, "full-syllabus");

      questions.push(...generated.map((q: any, idx: number) => ({
        id: q.id || `${paperId}-diagnostic-q-${idx + 1}`,
        subject: q.subject,
        topic: q.topic,
        weightage: q.weightage,
        question: q.question,
        options: q.options,
        // Answer index → letter (0=A, 1=B, ...)
        answer: String.fromCharCode(65 + q.answer),
        explanation: q.explanation,
        difficulty: q.difficulty,
      })));
    }

    // If we have fewer questions than DIAGNOSTIC_SIZE, that's OK for sparse branches

    return NextResponse.json({
      diagnosticId: diagnostic.id,
      questions,
    });
  } catch (e) {
    console.error("Diagnostic start error:", e);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
