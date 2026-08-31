/**
 * GET /api/gate/branches
 * Returns all GATE branch intelligence data from the database.
 *
 * Falls back to static config data if database has no entries yet.
 */

import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { PAPERS, getPaperById } from "@/lib/gate/config";
import { parseBranchMarkdown, type ParsedBranch } from "@/lib/gate/markdown-parser";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Server not configured." }, { status: 500 });
    }

    // Try loading from database
    const { data: branches, error: branchError } = await supabase
      .from("gate_branch_intelligence")
      .select("*")
      .order("paper_id", { ascending: true });

    if (branchError || !branches || branches.length === 0) {
      // Fall back to static config data
      return NextResponse.json({
        source: "config",
        branches: PAPERS
          .filter((p) => p.processingStatus === "available")
          .map((p) => ({
            paperId: p.id,
            paperCode: p.code,
            paperName: p.name,
            shortName: p.shortName,
            description: p.description,
            dataCoverage: p.dataCoverage,
            subjectCount: p.subjectCount,
            questionCount: p.questionCount,
            availableYears: p.availableYears,
            difficultyLevel: p.difficultyLevel,
            estimatedQuestionHours: p.estimatedQuestionHours,
            monthlyActiveLearners: p.monthlyActiveLearners,
          })),
      });
    }

    // Load subjects for each branch
    const branchIds = branches.map((b) => b.id);
    const { data: subjects } = await supabase
      .from("gate_subject_intelligence")
      .select("*")
      .in("branch_id", branchIds)
      .order("avg_weightage", { ascending: false });

    // Group subjects by branch
    const subjectsByBranch = new Map<string, typeof subjects>();
    if (subjects) {
      for (const s of subjects) {
        const existing = subjectsByBranch.get(s.branch_id) || [];
        existing.push(s);
        subjectsByBranch.set(s.branch_id, existing);
      }
    }

    // Format response
    const result = branches.map((b) => ({
      ...b,
      subjects: (subjectsByBranch.get(b.id) || []).map((s) => ({
        id: s.id,
        name: s.subject_name,
        avgWeightage: Number(s.avg_weightage),
        priority: s.priority,
        category: s.category,
        topics: s.topics,
        difficultyBreakdown: s.difficulty_breakdown,
        yearlyData: s.yearly_data,
      })),
    }));

    return NextResponse.json({
      source: "database",
      branches: result,
    });
  } catch (e) {
    console.error("Gate branches fetch error:", e);
    return NextResponse.json({ error: "Failed to load branch data." }, { status: 500 });
  }
}
