/**
 * GET /api/pyq/branches
 *
 * Returns all active branches for the PYQ library.
 * Public endpoint — no auth required.
 */

import { NextResponse } from "next/server";
import { getActiveBranches } from "@/lib/pyq/branches";
import { getSubjectsForBranch } from "@/lib/pyq/branches";

export async function GET() {
  try {
    const branches = getActiveBranches().map((b) => {
      const subjects = getSubjectsForBranch(b.branchCode);
      return {
        branchCode: b.branchCode,
        branchName: b.branchName,
        displayName: b.displayName,
        questionCount: b.questionCount,
        yearMin: b.yearMin,
        yearMax: b.yearMax,
        subjectCount: subjects.length,
        availableYears: Array.from(
          { length: (b.yearMax || 2024) - (b.yearMin || 2007) + 1 },
          (_, i) => (b.yearMin || 2007) + i
        ),
      };
    });

    return NextResponse.json({ branches, total: branches.length });
  } catch (error) {
    console.error("[PYQ] Failed to fetch branches:", error);
    return NextResponse.json({ error: "Failed to load branches" }, { status: 500 });
  }
}
