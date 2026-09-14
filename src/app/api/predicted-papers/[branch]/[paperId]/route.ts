/**
 * GET /api/predicted-papers/[branch]/[paperId]
 * Returns full paper with questions — requires login, free for all users.
 */

import { NextResponse } from "next/server";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { getUser } from "@/lib/auth/user";
import { ok, forbidden, notFound } from "@/lib/api/response";
import { PredictedPaper } from "@/lib/predicted-papers/types";

const PAPERS_DIR = join(process.cwd(), "data", "predicted-papers");

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ branch: string; paperId: string }> }
) {
  try {
    const user = await getUser();
    if (!user) {
      return forbidden("Login required. Please sign in to access predicted papers.");
    }

    const { branch, paperId } = await params;
    const path = join(PAPERS_DIR, `${branch.toUpperCase()}.json`);

    if (!existsSync(path)) {
      return notFound("Branch not found");
    }

    const raw = readFileSync(path, "utf-8");
    const data = JSON.parse(raw);
    const paper = data.papers.find((p: PredictedPaper) => p.id.toLowerCase() === paperId.toLowerCase());

    if (!paper) {
      return notFound("Paper not found");
    }

    return ok({ paper });
  } catch {
    return NextResponse.json({ error: "Failed to load paper" }, { status: 500 });
  }
}
