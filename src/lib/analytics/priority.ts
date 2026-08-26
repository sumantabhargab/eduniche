/**
 * Priority estimation engine.
 *
 * Estimates which topics/concepts deserve more attention based on
 * historical evidence. NOT a prediction engine — produces uncertainty-aware
 * estimates with explicit explanation.
 */

import { linearTrend, presenceRate, recencyWeightedFrequency, descriptiveStats, bayesianUpdate } from "./statistics";
import { computeTrend, isNotableGap } from "./trends";
import type { TrendData } from "./trends";

export interface PriorityInputs {
  yearlyOccurrences: { year: number; count: number }[];
  allAvailableYears: number[];
  marksContribution?: { year: number; marks: number }[];
  topicDepth?: number; // 1=topic, 2=subtopic, 3=concept — deeper = less data
}

export interface PriorityResult {
  score: number; // 0-100
  confidence: "high" | "medium" | "low" | "insufficient";
  components: {
    frequency: number;       // 0-100
    recency: number;         // 0-100
    trend: number;           // -50 to 50 (negative = declining)
    marks: number;           // 0-100
    depthPenalty: number;    // 0-1 (reduces score for deep topics)
  };
  uncertainty: {
    sampleSize: number;
    dataQuality: "sufficient" | "limited" | "insufficient";
    notes: string[];
  };
  explanation: string[];
}

/**
 * Compute priority score for a topic/concept.
 *
 * All components are independently meaningful and explained.
 */
export function computePriority(inputs: PriorityInputs): PriorityResult {
  const trend = computeTrend(inputs.yearlyOccurrences, inputs.allAvailableYears);
  const components = computeComponents(inputs, trend);
  const { score, uncertainty, explanation } = computeWeightedResult(
    components,
    inputs,
    trend
  );

  return {
    score: Math.round(Math.max(0, Math.min(100, score))),
    confidence: trend.confidence,
    components,
    uncertainty,
    explanation,
  };
}

function computeComponents(
  inputs: PriorityInputs,
  trend: TrendData
): PriorityResult["components"] {
  // Frequency score: normalized by total papers
  const freqScore = Math.min(100, (trend.papersAppeared / trend.totalPapers) * 100 * 2);

  // Recency score: based on weighted frequency, normalized
  const maxPossibleRecency = trend.totalPapers;
  const recencyScore = maxPossibleRecency > 0
    ? Math.min(100, (trend.recencyWeightedScore / maxPossibleRecency) * 100)
    : 0;

  // Trend component: -50 to 50
  // Normalize slope relative to max expected count per paper
  const maxCount = Math.max(...trend.yearlyOccurrences.map((o) => o.count), 1);
  const normalizedSlope = trend.trendSlope / maxCount;
  const trendScore = Math.max(-50, Math.min(50, normalizedSlope * 50));

  // Marks contribution
  let marksScore = 50; // neutral default
  if (inputs.marksContribution && inputs.marksContribution.length > 0) {
    const totalMarks = inputs.marksContribution.reduce(
      (acc, m) => acc + m.marks,
      0
    );
    const maxPossibleMarks = 15; // typical max marks per topic per paper
    marksScore = Math.min(100, (totalMarks / (maxPossibleMarks * trend.totalPapers)) * 100);
  }

  // Depth penalty: deeper topics have less data, reduce confidence
  const depthPenalty = inputs.topicDepth
    ? Math.max(0.3, 1 - inputs.topicDepth * 0.2)
    : 1;

  return {
    frequency: Math.round(freqScore),
    recency: Math.round(recencyScore),
    trend: Math.round(trendScore),
    marks: Math.round(marksScore),
    depthPenalty: Math.round(depthPenalty * 100) / 100,
  };
}

function computeWeightedResult(
  components: PriorityResult["components"],
  inputs: PriorityInputs,
  trend: TrendData
): Pick<PriorityResult, "score" | "uncertainty" | "explanation"> {
  const explanation: string[] = [];
  const uncertainty: PriorityResult["uncertainty"] = {
    sampleSize: trend.totalOccurrences,
    dataQuality: trend.confidence === "high" ? "sufficient" : trend.confidence === "medium" ? "limited" : "insufficient",
    notes: [],
  };

  // Weights for combining components
  const wFreq = 0.3;
  const wRecency = 0.35;
  const wTrend = 0.15;
  const wMarks = 0.2;

  let rawScore =
    components.frequency * wFreq +
    components.recency * wRecency +
    (50 + components.trend) * wTrend +
    components.marks * wMarks;

  // Apply depth penalty
  rawScore *= components.depthPenalty;

  // Adjust confidence based on data
  if (trend.totalOccurrences < 3) {
    uncertainty.notes.push(
      "Fewer than 3 occurrences across all papers — estimate is highly uncertain."
    );
    rawScore *= 0.5;
  } else if (trend.totalOccurrences < 6) {
    uncertainty.notes.push(
      "Limited occurrence data — treat this as a rough estimate."
    );
    rawScore *= 0.75;
  }

  // Check for notable gaps
  if (trend.gapsBetweenAppearances.length > 0) {
    const lastGap = trend.gapsBetweenAppearances[trend.gapsBetweenAppearances.length - 1];
    if (isNotableGap(lastGap, trend.averageGap, trend.totalPapers, 0)) {
      explanation.push(
        `Last appeared ${trend.yearsSinceLastAppearance} years ago — this is a notable gap.`
      );
      uncertainty.notes.push(
        "A notable gap is observed. This is descriptive, not predictive."
      );
    }
  }

  // Build explanation
  if (trend.presenceRate >= 0.7) {
    explanation.push(
      `Appeared in ${trend.papersAppeared} of ${trend.totalPapers} papers (${Math.round(trend.presenceRate * 100)}%).`
    );
  } else if (trend.presenceRate > 0) {
    explanation.push(
      `Appeared in ${trend.papersAppeared} of ${trend.totalPapers} papers.`
    );
  } else {
    explanation.push("No appearances found in available data.");
  }

  if (trend.trendDirection === "increasing") {
    explanation.push(
      "Frequency is increasing over time."
    );
  } else if (trend.trendDirection === "decreasing") {
    explanation.push(
      "Frequency is decreasing over time."
    );
  }

  if (trend.yearsSinceLastAppearance > 0) {
    explanation.push(
      `Last appeared ${trend.yearsSinceLastAppearance} year(s) ago.`
    );
  }

  const weightedScore = Math.round(Math.max(0, Math.min(100, rawScore)));

  return {
    score: weightedScore,
    uncertainty,
    explanation,
  };
}

/**
 * Format a priority score with context for display.
 */
export function formatPriority(result: PriorityResult): {
  label: string;
  description: string;
  colorClass: string;
} {
  if (result.confidence === "insufficient") {
    return {
      label: "Insufficient Data",
      description:
        "Not enough historical evidence for a reliable estimate.",
      colorClass: "text-muted",
    };
  }

  if (result.score >= 70) {
    return {
      label: "High Attention",
      description:
        "Historical evidence suggests this area deserves significant attention.",
      colorClass: "text-error",
    };
  } else if (result.score >= 50) {
    return {
      label: "Moderate Attention",
      description:
        "Mixed historical signals — worth practicing but not exclusively.",
      colorClass: "text-accent",
    };
  } else if (result.score >= 25) {
    return {
      label: "Routine Coverage",
      description:
        "Normal syllabus coverage — include in your preparation plan.",
      colorClass: "text-muted",
    };
  } else {
    return {
      label: "Lower Priority",
      description:
        "Historical evidence suggests this is less frequently tested.",
      colorClass: "text-success",
    };
  }
}
