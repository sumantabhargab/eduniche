/**
 * GET /api/gate/branches/[paperId]
 * Returns a single branch's intelligence data.
 *
 * Falls back to parsing the local markdown file if database has no entry.
 */

import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getPaperById } from "@/lib/gate/config";
import { parseBranchMarkdown, cacheParsedBranch, getParsedBranch } from "@/lib/gate/markdown-parser";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

const PAPER_FILE_MAP: Record<string, string> = {
  cse: "01-GATE-CS.md", ece: "02-GATE-ECE.md", me: "03-GATE-ME.md",
  ee: "04-GATE-EE.md", ce: "05-GATE-CE.md", in: "06-GATE-IN.md",
  ch: "07-GATE-CH.md", bt: "08-GATE-BT.md", mt: "09-GATE-MT.md",
  pi: "10-GATE-PI.md", xe: "11-GATE-XE.md", xl: "12-GATE-XL.md",
  tf: "13-GATE-TF.md", pe: "14-GATE-PE.md", ey: "15-GATE-EY.md",
  ma: "16-GATE-MA.md", ar: "17-GATE-AR.md", ag: "18-GATE-AG.md",
  gg: "19-GATE-GG.md", ph: "20-GATE-PH.md",
};

const MARKDOWN_DIR = join(process.cwd(), "..", "gate-pyq-analysis");

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ paperId: string }> }
) {
  try {
    const { paperId } = await params;
    const paper = getPaperById(paperId);
    if (!paper) {
      return NextResponse.json({ error: "Paper not found." }, { status: 404 });
    }

    const supabase = await createServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Server not configured." }, { status: 500 });
    }

    // 1. Try database
    const { data: branch } = await supabase
      .from("gate_branch_intelligence")
      .select("*")
      .eq("paper_id", paperId)
      .maybeSingle();

    let branchData = branch;

    // 2. If no DB entry, try parsing markdown
    if (!branchData) {
      const mdFileName = PAPER_FILE_MAP[paperId];
      if (mdFileName) {
        const mdPath = join(MARKDOWN_DIR, mdFileName);
        if (existsSync(mdPath)) {
          const markdown = readFileSync(mdPath, "utf-8");
          const parsed = parseBranchMarkdown(paperId, markdown);
          if (parsed) {
            cacheParsedBranch(parsed);
            return NextResponse.json({
              source: "markdown",
              paper: {
                id: paper.id,
                code: paper.code,
                name: paper.name,
                shortName: paper.shortName,
                description: paper.description,
                dataCoverage: paper.dataCoverage,
                subjectCount: paper.subjectCount,
                questionCount: paper.questionCount,
                availableYears: paper.availableYears,
                totalSessions: paper.totalSessions,
                difficultyLevel: paper.difficultyLevel,
                estimatedQuestionHours: paper.estimatedQuestionHours,
                monthlyActiveLearners: paper.monthlyActiveLearners,
              },
              intelligence: parsed,
            });
          }
        }
      }
    }

    // 3. If DB entry exists, load subjects
    if (branchData) {
      const { data: subjects } = await supabase
        .from("gate_subject_intelligence")
        .select("*")
        .eq("branch_id", branchData.id)
        .order("avg_weightage", { ascending: false });

      return NextResponse.json({
        source: "database",
        branch: {
          ...branchData,
          subjects: (subjects || []).map((s) => ({
            id: s.id,
            name: s.subject_name,
            avgWeightage: Number(s.avg_weightage),
            priority: s.priority,
            category: s.category,
            topics: s.topics,
            difficultyBreakdown: s.difficulty_breakdown,
            yearlyData: s.yearly_data,
          })),
        },
      });
    }

    // 4. Last resort — return config-only data
    return NextResponse.json({
      source: "config",
      paper: {
        id: paper.id,
        code: paper.code,
        name: paper.name,
        shortName: paper.shortName,
        description: paper.description,
        dataCoverage: paper.dataCoverage,
        subjectCount: paper.subjectCount,
        questionCount: paper.questionCount,
        availableYears: paper.availableYears,
        totalSessions: paper.totalSessions,
        difficultyLevel: paper.difficultyLevel,
        estimatedQuestionHours: paper.estimatedQuestionHours,
        monthlyActiveLearners: paper.monthlyActiveLearners,
      },
      intelligence: null,
    });
  } catch (e) {
    console.error("Gate branch detail error:", e);
    return NextResponse.json({ error: "Failed to load branch detail." }, { status: 500 });
  }
}
