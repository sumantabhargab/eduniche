/**
 * GET /api/pyq/branches
 *
 * Returns all active branches for the PYQ library.
 * Public endpoint — no auth required.
 */

import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getActiveBranches, getSubjectsForBranch } from "@/lib/pyq/branches";

export async function GET() {
  try {
    const supabase = await createServiceClient();
    let liveCounts: Record<string, number> = {};
    let liveYearRanges: Record<string, { min: number; max: number }> = {};

    if (supabase) {
      const { data } = await supabase
        .from("pyq_questions")
        .select("branch_code, year")
        .eq("is_duplicate", false);

      if (data) {
        for (const row of data) {
          liveCounts[row.branch_code] = (liveCounts[row.branch_code] || 0) + 1;
          const r = liveYearRanges[row.branch_code] || { min: row.year, max: row.year };
          r.min = Math.min(r.min, row.year);
          r.max = Math.max(r.max, row.year);
          liveYearRanges[row.branch_code] = r;
        }
      }
    }

    const branches = getActiveBranches().map((b) => {
      const subjects = getSubjectsForBranch(b.branchCode);
      const liveCount = liveCounts[b.branchCode] ?? b.questionCount;
      const liveRange = liveYearRanges[b.branchCode];
      const yMin = liveRange?.min ?? b.yearMin;
      const yMax = liveRange?.max ?? b.yearMax;
      return {
        branchCode: b.branchCode,
        branchName: b.branchName,
        displayName: b.displayName,
        questionCount: liveCount,
        yearMin: yMin,
        yearMax: yMax,
        subjectCount: subjects.length,
        availableYears: Array.from({ length: yMax - yMin + 1 }, (_, i) => yMin + i),
      };
    });

    return NextResponse.json({ branches, total: branches.length });
  } catch (error) {
    console.error("[PYQ] Failed to fetch branches:", error);
    return NextResponse.json({ error: "Failed to load branches" }, { status: 500 });
  }
}
