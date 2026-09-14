/**
 * GET /api/predicted-papers/[branch]
 * Lists all papers for a branch (no auth required).
 */

import { NextResponse } from "next/server";
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { PredictedPaper } from "@/lib/predicted-papers/types";

const PAPERS_DIR = join(process.cwd(), "..", "data", "predicted-papers");

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ branch: string }> }
) {
  try {
    const { branch } = await params;
    const path = join(PAPERS_DIR, `${branch.toUpperCase()}.json`);

    if (!existsSync(path)) {
      return NextResponse.json({ error: "Branch not found" }, { status: 404 });
    }

    const raw = readFileSync(path, "utf-8");
    const data = JSON.parse(raw);

    // Return metadata only (not questions)
    const papers: Omit<PredictedPaper, "questions">[] = data.papers.map((p: PredictedPaper) => ({
      id: p.id,
      branch: p.branch,
      title: p.title,
      description: p.description,
      createdAt: p.createdAt,
      totalQuestions: p.totalQuestions,
      totalMarks: p.totalMarks,
      difficultyDistribution: p.difficultyDistribution,
      subjectBreakdown: p.subjectBreakdown,
      predictionRationale: p.predictionRationale,
    }));

    return NextResponse.json({ branch: data.branch, papers });
  } catch {
    return NextResponse.json({ error: "Failed to load papers" }, { status: 500 });
  }
}
