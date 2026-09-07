/**
 * GET /api/pyq/branches
 *
 * Returns all active branches for the PYQ library.
 * Public endpoint — no auth required.
 */

import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getActiveBranches, getSubjectsForBranch } from "@/lib/pyq/branches";
import { getStaticQuestionsForBranch, getStaticBranchStats } from "@/lib/pyq/static-questions";

export async function GET() {
  try {
    const supabase = await createServiceClient();
    let liveCounts: Record<string, number> = {};
    let liveYearRanges: Record<string, { min: number; max: number }> = {};

    if (supabase) {
      try {
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
      } catch {
        // DB unavailable — fall back to static counts
      }
    }

    // Supplement static counts for branches not yet in DB
    const staticStats = getStaticBranchStats();
    for (const stat of staticStats) {
      if (!(stat.branchCode in liveCounts) || liveCounts[stat.branchCode] === 0) {
        liveCounts[stat.branchCode] = stat.questionCount;
        liveYearRanges[stat.branchCode] = { min: stat.yearMin, max: stat.yearMax };
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
