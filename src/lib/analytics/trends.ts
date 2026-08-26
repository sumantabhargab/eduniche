/**
 * Trend analysis — detect temporal patterns in question occurrence data.
 */

import { linearTrend, recencyWeightedFrequency, presenceRate } from "./statistics";

export interface TrendData {
  yearlyOccurrences: { year: number; count: number }[];
  totalOccurrences: number;
  papersAppeared: number;
  totalPapers: number;
  presenceRate: number;
  recencyWeightedScore: number;
  trendDirection: "increasing" | "decreasing" | "flat";
  trendSlope: number;
  yearsSinceLastAppearance: number;
  averageGap: number;
  gapsBetweenAppearances: number[];
  confidence: "high" | "medium" | "low" | "insufficient";
}

/**
 * Compute trend analysis for a topic/concept given yearly occurrence data.
 */
export function computeTrend(
  yearlyOccurrences: { year: number; count: number }[],
  allAvailableYears: number[],
  options?: { minPapersForConfidence?: number }
): TrendData {
  const minPapers = options?.minPapersForConfidence ?? 3;

  const totalOccurrences = yearlyOccurrences.reduce(
    (acc, o) => acc + o.count,
    0
  );
  const papersAppeared = yearlyOccurrences.filter((o) => o.count > 0).length;
  const totalPapers = allAvailableYears.length;
  const presence = presenceRate(totalPapers, papersAppeared);
  const recency = recencyWeightedFrequency(yearlyOccurrences);

  // Sort by year for trend
  const sorted = [...yearlyOccurrences].sort((a, b) => a.year - b.year);
  const trendPoints = sorted.map((o) => ({ x: o.year, y: o.count }));
  const trend = linearTrend(trendPoints);

  // Gap analysis
  const appearances = sorted
    .filter((o) => o.count > 0)
    .map((o) => o.year);
  const gaps: number[] = [];
  for (let i = 1; i < appearances.length; i++) {
    gaps.push(appearances[i] - appearances[i - 1]);
  }
  const averageGap =
    gaps.length > 0 ? gaps.reduce((a, b) => a + b, 0) / gaps.length : 0;
  const lastAppearanceYear =
    appearances.length > 0 ? appearances[appearances.length - 1] : 0;
  const yearsSinceLastAppearance =
    appearances.length > 0
      ? Math.max(...allAvailableYears.filter((y) => y > lastAppearanceYear).map((y) => y - lastAppearanceYear), 0)
      : totalPapers;

  // Confidence
  let confidence: "high" | "medium" | "low" | "insufficient" = "insufficient";
  if (papersAppeared >= minPapers * 2) confidence = "high";
  else if (papersAppeared >= minPapers) confidence = "medium";
  else if (papersAppeared > 0) confidence = "low";

  return {
    yearlyOccurrences: sorted,
    totalOccurrences,
    papersAppeared,
    totalPapers,
    presenceRate: presence,
    recencyWeightedScore: recency.weightedScore,
    trendDirection: trend.direction,
    trendSlope: trend.slope,
    yearsSinceLastAppearance,
    averageGap: Math.round(averageGap * 10) / 10,
    gapsBetweenAppearances: gaps,
    confidence,
  };
}

/**
 * Detect if a gap is "notable" — appears unusually long compared to the average.
 */
export function isNotableGap(
  gap: number,
  averageGap: number,
  totalPapers: number,
  papersRemaining: number
): boolean {
  if (averageGap === 0) return false;
  if (papersRemaining < 2) return false; // too little data to make claims

  // A gap is notable if it's > 1.5x the average
  return gap > averageGap * 1.5;
}
