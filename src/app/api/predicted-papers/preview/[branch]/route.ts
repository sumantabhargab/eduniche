/**
 * GET /api/predicted-papers/preview/[branch]
 * Returns first 10 questions as a free preview (no auth required).
 */

import { NextResponse } from "next/server";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { PredictedPaper } from "@/lib/predicted-papers/types";

const PAPERS_DIR = join(process.cwd(), "data", "predicted-papers");

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
    const firstPaper = data.papers[0];

    if (!firstPaper) {
      return NextResponse.json({ error: "No papers available" }, { status: 404 });
    }

    // Return only first 10 questions as preview
    const preview: PredictedPaper = {
      ...firstPaper,
      questions: firstPaper.questions.slice(0, 10),
      predictionRationale: "This is a preview. Upgrade to Premium to access all 65 questions and 4 papers per branch.",
    };

    return NextResponse.json({ paper: preview, isPreview: true });
  } catch {
    return NextResponse.json({ error: "Failed to load preview" }, { status: 500 });
  }
}
