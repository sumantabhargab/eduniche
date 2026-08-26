/**
 * Statistical calculations for analytics.
 *
 * All functions work with raw numeric arrays and return
 * interpretable statistics with confidence intervals where applicable.
 */

/**
 * Basic descriptive statistics.
 */
export interface DescriptiveStats {
  count: number;
  mean: number;
  median: number;
  stdDev: number;
  min: number;
  max: number;
  variance: number;
}

export function descriptiveStats(values: number[]): DescriptiveStats {
  if (values.length === 0) {
    return { count: 0, mean: 0, median: 0, stdDev: 0, min: 0, max: 0, variance: 0 };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const count = values.length;
  const sum = values.reduce((a, b) => a + b, 0);
  const mean = sum / count;
  const median =
    count % 2 === 0
      ? (sorted[count / 2 - 1] + sorted[count / 2]) / 2
      : sorted[Math.floor(count / 2)];
  const variance =
    count > 1
      ? values.reduce((acc, v) => acc + (v - mean) ** 2, 0) / count
      : 0;
  const stdDev = Math.sqrt(variance);
  const min = sorted[0];
  const max = sorted[count - 1];

  return { count, mean, median, stdDev, min, max, variance };
}

/**
 * Frequency distribution — count occurrences of each value.
 */
export function frequencyDistribution(
  values: number[],
  bins?: number[]
): { value: number; count: number; percentage: number }[] {
  if (values.length === 0) return [];

  const counts = new Map<number, number>();
  for (const v of values) {
    counts.set(v, (counts.get(v) || 0) + 1);
  }

  const total = values.length;
  let entries = Array.from(counts.entries())
    .map(([value, count]) => ({
      value,
      count,
      percentage: (count / total) * 100,
    }))
    .sort((a, b) => b.count - a.count);

  if (bins && bins.length > 0) {
    // Bin into ranges
    const binned = bins.map((bin, i) => {
      const low = bin;
      const high = bins[i + 1] ?? Infinity;
      const count = values.filter(
        (v) => v >= low && (i === bins.length - 1 ? v <= high : v < high)
      ).length;
      return {
        value: bin,
        range: `${low}–${i === bins.length - 1 ? "max" : bins[i + 1] - 1}`,
        count,
        percentage: (count / total) * 100,
      };
    });
    entries = binned;
  }

  return entries;
}

/**
 * Exponential decay weights — newer observations get higher weight.
 * weight(i) = λ^i where i = 0 is most recent, λ = decayFactor ∈ (0, 1]
 */
export function exponentialDecayWeights(
  count: number,
  decayFactor = 0.9
): number[] {
  if (count === 0) return [];
  const weights: number[] = [];
  for (let i = count - 1; i >= 0; i--) {
    weights.push(Math.pow(decayFactor, i));
  }
  return weights;
}

/**
 * Recency-weighted frequency.
 */
export function recencyWeightedFrequency(
  occurrences: { year: number; count: number }[],
  decayFactor = 0.85
): { weightedScore: number; rawScore: number } {
  if (occurrences.length === 0) {
    return { weightedScore: 0, rawScore: 0 };
  }

  const sorted = [...occurrences].sort((a, b) => b.year - a.year);
  const rawScore = sorted.reduce((acc, o) => acc + o.count, 0);
  const weights = exponentialDecayWeights(sorted.length, decayFactor);
  const weightedScore = sorted.reduce(
    (acc, o, i) => acc + o.count * weights[i],
    0
  );

  return { weightedScore, rawScore };
}

/**
 * Linear trend estimation using least squares.
 * Returns slope and whether the trend is increasing.
 */
export function linearTrend(
  values: { x: number; y: number }[]
): { slope: number; intercept: number; direction: "increasing" | "decreasing" | "flat" } {
  if (values.length < 2) {
    return { slope: 0, intercept: 0, direction: "flat" };
  }

  const n = values.length;
  const sumX = values.reduce((a, v) => a + v.x, 0);
  const sumY = values.reduce((a, v) => a + v.y, 0);
  const sumXY = values.reduce((a, v) => a + v.x * v.y, 0);
  const sumX2 = values.reduce((a, v) => a + v.x * v.x, 0);

  const denominator = n * sumX2 - sumX * sumX;
  if (denominator === 0) {
    return { slope: 0, intercept: sumY / n, direction: "flat" };
  }

  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;

  const THRESHOLD = 0.01;
  let direction: "increasing" | "decreasing" | "flat" = "flat";
  if (slope > THRESHOLD) direction = "increasing";
  else if (slope < -THRESHOLD) direction = "decreasing";

  return { slope, intercept, direction };
}

/**
 * Presence rate — in what fraction of observations did something appear?
 */
export function presenceRate(
  totalObservations: number,
  appearances: number
): number {
  if (totalObservations === 0) return 0;
  return appearances / totalObservations;
}

/**
 * Bayesian update — combine prior belief with new evidence.
 * Used for smoothing sparse data with a global prior.
 *
 * posterior_mean = (prior_count * prior_mean + new_count * new_mean) / (prior_count + new_count)
 */
export function bayesianUpdate(
  priorCount: number,
  priorMean: number,
  newCount: number,
  newMean: number
): { posteriorMean: number; posteriorWeight: number } {
  const totalCount = priorCount + newCount;
  if (totalCount === 0) {
    return { posteriorMean: 0, posteriorWeight: 0 };
  }
  const posteriorMean =
    (priorCount * priorMean + newCount * newMean) / totalCount;
  return { posteriorMean, posteriorWeight: totalCount };
}

/**
 * Co-occurrence matrix — how often do two topics appear in the same paper?
 */
export function coOccurrence<T extends string>(
  items: T[],
  groups: T[][] // items grouped by observation (e.g., topics per paper)
): Map<string, Map<string, number>> {
  const matrix = new Map<string, Map<string, number>>();

  for (const group of groups) {
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        const a = group[i];
        const b = group[j];
        if (!matrix.has(a)) matrix.set(a, new Map());
        if (!matrix.has(b)) matrix.set(b, new Map());

        const rowA = matrix.get(a)!;
        const rowB = matrix.get(b)!;
        rowA.set(b, (rowA.get(b) || 0) + 1);
        rowB.set(a, (rowB.get(a) || 0) + 1);
      }
    }
  }

  return matrix;
}

/**
 * Calculate the gap (years since last appearance).
 */
export function lastAppearanceGap(
  year: number,
  yearsAvailable: number[]
): number {
  return Math.max(...yearsAvailable.filter((y) => y > year).map((y) => y - year), 0);
}

/**
 * Confidence interval for a proportion (normal approximation).
 */
export function proportionConfidenceInterval(
  successes: number,
  total: number,
  confidence = 0.95
): { lower: number; upper: number; point: number } {
  if (total === 0) return { lower: 0, upper: 0, point: 0 };

  const p = successes / total;
  const z = confidence === 0.95 ? 1.96 : confidence === 0.99 ? 2.576 : 1.645;
  const se = Math.sqrt((p * (1 - p)) / total);
  const margin = z * se;

  return {
    point: p,
    lower: Math.max(0, p - margin),
    upper: Math.min(1, p + margin),
  };
}
