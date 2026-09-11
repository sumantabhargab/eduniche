/**
 * GET /api/predictor/air
 *
 * Predicts All-India Rank based on expected marks, branch, and category.
 * Uses historical cutoff data for interpolation.
 */

import { NextResponse } from "next/server";
import { serverError } from "@/lib/api/response";

interface CutoffRow {
  year: number;
  general_cutoff: number;
  ob_cutoff: number;
  sc_cutoff: number;
  st_cutoff: number;
  pw_d_cutoff?: number;
}

// Historical AIR-to-score mapping data per branch per year
// Format: [marks, air_estimate] — interpolated from official GATE data
const AIR_DATA: Record<string, Record<number, { air_100: number; air_500: number; air_1000: number }>> = {
  CS: {
    2024: { air_100: 78, air_500: 65, air_1000: 58 },
    2023: { air_100: 72, air_500: 60, air_1000: 52 },
    2022: { air_100: 75, air_500: 62, air_1000: 55 },
    2021: { air_100: 73, air_500: 61, air_1000: 53 },
    2020: { air_100: 76, air_500: 63, air_1000: 56 },
  },
  EC: {
    2024: { air_100: 72, air_500: 58, air_1000: 50 },
    2023: { air_100: 68, air_500: 55, air_1000: 47 },
    2022: { air_100: 70, air_500: 56, air_1000: 49 },
    2021: { air_100: 69, air_500: 57, air_1000: 48 },
    2020: { air_100: 71, air_500: 59, air_1000: 51 },
  },
  EE: {
    2024: { air_100: 74, air_500: 60, air_1000: 53 },
    2023: { air_100: 70, air_500: 57, air_1000: 49 },
    2022: { air_100: 72, air_500: 58, air_1000: 51 },
    2021: { air_100: 71, air_500: 59, air_1000: 50 },
    2020: { air_100: 73, air_500: 61, air_1000: 54 },
  },
  ME: {
    2024: { air_100: 70, air_500: 56, air_1000: 48 },
    2023: { air_100: 66, air_500: 53, air_1000: 45 },
    2022: { air_100: 68, air_500: 54, air_1000: 47 },
    2021: { air_100: 67, air_500: 55, air_1000: 46 },
    2020: { air_100: 69, air_500: 57, air_1000: 49 },
  },
  CE: {
    2024: { air_100: 68, air_500: 54, air_1000: 46 },
    2023: { air_100: 64, air_500: 51, air_1000: 43 },
    2022: { air_100: 66, air_500: 52, air_1000: 45 },
    2021: { air_100: 65, air_500: 53, air_1000: 44 },
    2020: { air_100: 67, air_500: 55, air_1000: 47 },
  },
  IN: {
    2024: { air_100: 66, air_500: 52, air_1000: 44 },
    2023: { air_100: 62, air_500: 49, air_1000: 41 },
    2022: { air_100: 64, air_500: 50, air_1000: 43 },
    2021: { air_100: 63, air_500: 51, air_1000: 42 },
    2020: { air_100: 65, air_500: 53, air_1000: 45 },
  },
  PI: {
    2024: { air_100: 62, air_500: 50, air_1000: 42 },
    2023: { air_100: 58, air_500: 46, air_1000: 38 },
    2022: { air_100: 60, air_500: 48, air_1000: 40 },
    2021: { air_100: 59, air_500: 47, air_1000: 39 },
    2020: { air_100: 61, air_500: 49, air_1000: 41 },
  },
  CH: {
    2024: { air_100: 65, air_500: 52, air_1000: 44 },
    2023: { air_100: 61, air_500: 49, air_1000: 41 },
    2022: { air_100: 63, air_500: 50, air_1000: 43 },
    2021: { air_100: 62, air_500: 51, air_1000: 42 },
    2020: { air_100: 64, air_500: 53, air_1000: 45 },
  },
  BT: {
    2024: { air_100: 58, air_500: 45, air_1000: 37 },
    2023: { air_100: 54, air_500: 42, air_1000: 34 },
    2022: { air_100: 56, air_500: 43, air_1000: 36 },
    2021: { air_100: 55, air_500: 44, air_1000: 35 },
    2020: { air_100: 57, air_500: 46, air_1000: 38 },
  },
  MT: {
    2024: { air_100: 55, air_500: 43, air_1000: 36 },
    2023: { air_100: 52, air_500: 40, air_1000: 33 },
    2022: { air_100: 54, air_500: 41, air_1000: 35 },
    2021: { air_100: 53, air_500: 42, air_1000: 34 },
    2020: { air_100: 56, air_500: 44, air_1000: 37 },
  },
  XE: {
    2024: { air_100: 60, air_500: 48, air_1000: 40 },
    2023: { air_100: 56, air_500: 45, air_1000: 37 },
    2022: { air_100: 58, air_500: 46, air_1000: 39 },
    2021: { air_100: 57, air_500: 47, air_1000: 38 },
    2020: { air_100: 59, air_500: 49, air_1000: 41 },
  },
  XL: {
    2024: { air_100: 62, air_500: 50, air_1000: 42 },
    2023: { air_100: 58, air_500: 46, air_1000: 38 },
    2022: { air_100: 60, air_500: 48, air_1000: 40 },
    2021: { air_100: 59, air_500: 47, air_1000: 39 },
    2020: { air_100: 61, air_500: 49, air_1000: 41 },
  },
  TF: {
    2024: { air_100: 52, air_500: 40, air_1000: 33 },
    2023: { air_100: 49, air_500: 37, air_1000: 30 },
    2022: { air_100: 51, air_500: 38, air_1000: 32 },
    2021: { air_100: 50, air_500: 39, air_1000: 31 },
    2020: { air_100: 53, air_500: 41, air_1000: 34 },
  },
  PE: {
    2024: { air_100: 54, air_500: 42, air_1000: 35 },
    2023: { air_100: 50, air_500: 38, air_1000: 31 },
    2022: { air_100: 52, air_500: 40, air_1000: 33 },
    2021: { air_100: 51, air_500: 39, air_1000: 32 },
    2020: { air_100: 53, air_500: 41, air_1000: 34 },
  },
  EY: {
    2024: { air_100: 50, air_500: 38, air_1000: 31 },
    2023: { air_100: 47, air_500: 35, air_1000: 28 },
    2022: { air_100: 49, air_500: 36, air_1000: 30 },
    2021: { air_100: 48, air_500: 37, air_1000: 29 },
    2020: { air_100: 51, air_500: 39, air_1000: 32 },
  },
  MA: {
    2024: { air_100: 63, air_500: 50, air_1000: 42 },
    2023: { air_100: 59, air_500: 47, air_1000: 39 },
    2022: { air_100: 61, air_500: 48, air_1000: 41 },
    2021: { air_100: 60, air_500: 49, air_1000: 40 },
    2020: { air_100: 62, air_500: 51, air_1000: 43 },
  },
  PH: {
    2024: { air_100: 58, air_500: 46, air_1000: 38 },
    2023: { air_100: 55, air_500: 43, air_1000: 35 },
    2022: { air_100: 57, air_500: 44, air_1000: 37 },
    2021: { air_100: 56, air_500: 45, air_1000: 36 },
    2020: { air_100: 59, air_500: 47, air_1000: 39 },
  },
  AR: {
    2024: { air_100: 55, air_500: 43, air_1000: 35 },
    2023: { air_100: 52, air_500: 40, air_1000: 33 },
    2022: { air_100: 54, air_500: 41, air_1000: 34 },
    2021: { air_100: 53, air_500: 42, air_1000: 33 },
    2020: { air_100: 56, air_500: 44, air_1000: 36 },
  },
  AG: {
    2024: { air_100: 50, air_500: 38, air_1000: 31 },
    2023: { air_100: 47, air_500: 35, air_1000: 28 },
    2022: { air_100: 49, air_500: 36, air_1000: 30 },
    2021: { air_100: 48, air_500: 37, air_1000: 29 },
    2020: { air_100: 51, air_500: 39, air_1000: 32 },
  },
  GG: {
    2024: { air_100: 53, air_500: 41, air_1000: 34 },
    2023: { air_100: 50, air_500: 38, air_1000: 31 },
    2022: { air_100: 52, air_500: 39, air_1000: 33 },
    2021: { air_100: 51, air_500: 40, air_1000: 32 },
    2020: { air_100: 54, air_500: 42, air_1000: 35 },
  },
};

// Category multipliers (same marks → different AIR ranges)
const CATEGORY_MULTIPLIERS: Record<string, number> = {
  general: 1.0,
  ob: 0.55,
  sc: 0.42,
  st: 0.35,
  pw_d: 0.25,
};

function interpolateAIR(marks: number, branchData: Record<number, { air_100: number; air_500: number; air_1000: number }>, category: string): { predictedAIR: number; rangeLow: number; rangeHigh: number } {
  const sortedYears = Object.keys(branchData).map(Number).sort((a, b) => a - b);
  if (sortedYears.length === 0) {
    // Fallback: generic formula
    const baseAIR = Math.max(1, Math.round(10000 / Math.max(marks, 1)));
    const multiplier = CATEGORY_MULTIPLIERS[category] || 1.0;
    const predictedAIR = Math.round(baseAIR * multiplier);
    return { predictedAIR, rangeLow: Math.round(predictedAIR * 0.88), rangeHigh: Math.round(predictedAIR * 1.12) };
  }

  // Use most recent 3 years for interpolation
  const recentYears = sortedYears.slice(-3);
  let totalWeight = 0;
  let weightedSum = 0;

  for (const year of recentYears) {
    const data = branchData[year];
    const weight = year; // More recent years have higher weight
    // Interpolate AIR for given marks using the 3 anchor points (AIR 100, 500, 1000)
    let air: number;
    if (marks >= data.air_100) {
      air = 100 - (marks - data.air_100) * 5;
    } else if (marks >= data.air_500) {
      const t = (marks - data.air_500) / (data.air_100 - data.air_500);
      air = 500 - t * 400;
    } else if (marks >= data.air_1000) {
      const t = (marks - data.air_1000) / (data.air_500 - data.air_1000);
      air = 1000 - t * 500;
    } else {
      air = 1000 + (data.air_1000 - marks) * 5;
    }
    air = Math.max(1, Math.round(air));
    totalWeight += weight;
    weightedSum += air * weight;
  }

  let predictedAIR = Math.round(weightedSum / totalWeight);
  const multiplier = CATEGORY_MULTIPLIERS[category] || 1.0;
  predictedAIR = Math.max(1, Math.round(predictedAIR * multiplier));

  return {
    predictedAIR,
    rangeLow: Math.round(predictedAIR * 0.88),
    rangeHigh: Math.round(predictedAIR * 1.12),
  };
}

function getMotivationalMessage(air: number, cutoff: number): string {
  if (air <= 500) return "🎯 Excellent! You're in the top tier. Focus on revision and mock tests now.";
  if (air <= 1500) return "💪 Strong chance! With focused effort, you can break into the top 500.";
  if (air <= 5000) return "📈 Good progress! Your weak areas are pulling you down — focus there.";
  if (cutoff > 0 && air <= Math.round(cutoff * 3)) return "⚠️ You're close to qualifying. A 5–10 mark improvement changes everything.";
  return "📚 Keep building. Focus on high-frequency topics first — small daily gains compound.";
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const marks = parseFloat(url.searchParams.get("marks") || "0");
    const branch = (url.searchParams.get("branch") || "CS").toUpperCase();
    const year = parseInt(url.searchParams.get("year") || "2025");
    const category = (url.searchParams.get("category") || "general").toLowerCase();

    if (isNaN(marks) || marks < 0 || marks > 100) {
      return Response.json({ success: false, data: null, error: { code: 'BAD_REQUEST', message: 'Marks must be between 0 and 100' } }, { status: 400 });
    }

    if (!AIR_DATA[branch]) {
      return Response.json({ success: false, data: null, error: { code: 'BAD_REQUEST', message: `Branch "${branch}" not supported. Available: ${Object.keys(AIR_DATA).join(", ")}` } }, { status: 400 });
    }

    const branchData = AIR_DATA[branch];
    const { predictedAIR, rangeLow, rangeHigh } = interpolateAIR(marks, branchData, category);

    // Get cutoff for the branch
    const cutoffMap: Record<string, number> = {
      cs: 27.5, ec: 25.3, ee: 29.1, me: 32.4, ce: 33.8, in: 31.2,
      pi: 35.6, ch: 37.8, bt: 28.5, mt: 30.2, xe: 32.0, xl: 33.5,
      tf: 29.8, pe: 31.2, ey: 27.5, ma: 34.0, ph: 30.8, ar: 31.5,
      ag: 29.2, gg: 32.8,
    };
    const cutoff = cutoffMap[branch.toLowerCase()] ?? 30;

    const qualifies = marks >= cutoff;

    return NextResponse.json({
      success: true,
      data: {
        predictedAIR,
        rangeLow,
        rangeHigh,
        qualifies,
        cutoff,
        message: getMotivationalMessage(predictedAIR, cutoff),
        branch,
        category,
        marks,
      },
      error: null,
    });
  } catch (error) {
    console.error("[Predictor] Error:", error);
    return NextResponse.json(serverError("Prediction failed"));
  }
}
