/**
 * ECE Analytics — Topic-wise frequency, predictions, and difficulty analysis
 *
 * This file provides pre-computed analytics derived from the question banks,
 * useful for the "Predicted Papers" and "Doubt Engine" features.
 */

import {
  ECE_ALL_QUESTIONS,
  ECE_SUBJECTS,
  getQuestionsForSubject,
  getFrequentlyAskedTopics,
  getTopicDistribution,
  getYearWiseCounts,
} from "./ece-data";

// ── Overall GATE ECE question distribution by subject ──────────────

export const ECE_SUBJECT_DISTRIBUTION = [
  { subject: "Network Theory", code: "ece-nt", weight: 9, icon: "🔌", color: "#3b82f6" },
  { subject: "Signals & Systems", code: "ece-ss", weight: 9, icon: "📡", color: "#8b5cf6" },
  { subject: "Control Systems", code: "ece-cs", weight: 8, icon: "🎛️", color: "#f59e0b" },
  { subject: "Digital Electronics", code: "ece-de", weight: 8, icon: "💾", color: "#10b981" },
  { subject: "Analog Circuits", code: "ece-ac", weight: 8, icon: "⚡", color: "#ef4444" },
  { subject: "Communication Systems", code: "ece-com", weight: 10, icon: "📶", color: "#06b6d4" },
  { subject: "Electromagnetics", code: "ece-em", weight: 10, icon: "🌐", color: "#6366f1" },
  { subject: "Engineering Mathematics", code: "ece-math", weight: 13, icon: "📐", color: "#ec4899" },
  { subject: "General Aptitude", code: "ece-apt", weight: 15, icon: "🧮", color: "#f97316" },
];

export const ECE_TOTAL_MARKS = 100; // GATE ECE is 100 marks

// ── Per-subject analytics ─────────────────────────────────────────

export interface SubjectAnalytics {
  subjectId: string;
  subjectName: string;
  totalQuestions: number;
  yearRange: string;
  mcqCount: number;
  msqCount: number;
  natCount: number;
  difficultyBreakdown: { easy: number; medium: number; hard: number };
  topTopics: { topic: string; count: number; percentage: number }[];
  predictedTopics: { topic: string; probability: number; reason: string }[];
  yearWiseTrend: { year: number; count: number }[];
  recentQuestions: { id: string; year: number; topic: string; marks: number }[];
}

export function getSubjectAnalytics(subjectId: string): SubjectAnalytics {
  const questions = getQuestionsForSubject(subjectId);
  const subject = ECE_SUBJECTS.find(s => s.id === subjectId);

  const difficultyBreakdown = {
    easy: questions.filter(q => q.difficulty === "easy").length,
    medium: questions.filter(q => q.difficulty === "medium").length,
    hard: questions.filter(q => q.difficulty === "hard").length,
  };

  const topics = getTopicDistribution(subjectId);
  const topTopics = topics.map(t => ({
    ...t,
    percentage: Math.round((t.count / questions.length) * 100),
  }));

  const predicted = getFrequentlyAskedTopics(subjectId, 5).map(f => {
    const maxCount = Math.max(...getFrequentlyAskedTopics(subjectId, 5).map(x => x.count));
    return {
      topic: f.topic,
      probability: Math.round((f.count / maxCount) * 100),
      reason: f.recentWeight > 470 ? "Very frequently asked, recent" :
              f.recentWeight > 450 ? "Frequently asked, recent" :
              f.count >= 3 ? "Regularly appears in GATE" :
              f.count >= 2 ? "Has appeared multiple times" : "Occasional appearance",
    };
  });

  const years = [...new Set(questions.map(q => q.year))].sort();
  const yearWiseTrend = years.map(year => ({
    year,
    count: questions.filter(q => q.year === year).length,
  }));

  const recentQuestions = questions
    .filter(q => q.year >= 2024)
    .sort((a, b) => b.year - a.year)
    .slice(0, 5)
    .map(q => ({
      id: q.id,
      year: q.year,
      topic: q.topic,
      marks: q.marks,
    }));

  return {
    subjectId,
    subjectName: subject?.name || subjectId,
    totalQuestions: questions.length,
    yearRange: `${Math.min(...questions.map(q => q.year))}–${Math.max(...questions.map(q => q.year))}`,
    mcqCount: questions.filter(q => q.type === "MCQ").length,
    msqCount: questions.filter(q => q.type === "MSQ").length,
    natCount: questions.filter(q => q.type === "NAT").length,
    difficultyBreakdown,
    topTopics,
    predictedTopics: predicted,
    yearWiseTrend,
    recentQuestions,
  };
}

// ── Pre-computed analytics for all subjects ────────────────────────

export const ECE_ANALYTICS: Record<string, SubjectAnalytics> = {};
ECE_SUBJECTS.forEach(s => {
  ECE_ANALYTICS[s.id] = getSubjectAnalytics(s.id);
});

// ── High-yield topics across all ECE ───────────────────────────────

export interface HighYieldTopic {
  topic: string;
  subjectId: string;
  subjectName: string;
  totalOccurrences: number;
  firstAppearance: number;
  lastAppearance: number;
  trend: "rising" | "stable" | "declining";
  predictedProbability: number;
}

export function getHighYieldTopics(limit = 20): HighYieldTopic[] {
  const allTopicData: Record<string, {
    topic: string;
    subjectId: string;
    subjectName: string;
    years: number[];
  }> = {};

  ECE_ALL_QUESTIONS.forEach(q => {
    const key = `${q.subjectId}:${q.topic}`;
    if (!allTopicData[key]) {
      allTopicData[key] = { topic: q.topic, subjectId: q.subjectId, subjectName: q.subject, years: [] };
    }
    allTopicData[key].years.push(q.year);
  });

  return Object.values(allTopicData)
    .map(data => {
      const years = data.years.sort((a, b) => a - b);
      const recentYears = years.filter(y => y >= 2020);
      const olderYears = years.filter(y => y < 2020);
      let trend: "rising" | "stable" | "declining" = "stable";

      if (recentYears.length > olderYears.length) trend = "rising";
      else if (recentYears.length < olderYears.length) trend = "declining";

      return {
        topic: data.topic,
        subjectId: data.subjectId,
        subjectName: data.subjectName,
        totalOccurrences: years.length,
        firstAppearance: years[0],
        lastAppearance: years[years.length - 1],
        trend,
        predictedProbability: Math.min(95, 40 + years.length * 10 + (trend === "rising" ? 15 : trend === "declining" ? -10 : 0)),
      };
    })
    .sort((a, b) => b.totalOccurrences - a.totalOccurrences)
    .slice(0, limit);
}

// ── Predicted papers data ─────────────────────────────────────────

export interface PredictedPaper {
  id: string;
  title: string;
  subjectId: string;
  subjectName: string;
  topics: string[];
  confidence: number; // 0-100
  reasoning: string;
  basedOn: {
    year: number;
    topic: string;
    frequency: number;
  }[];
}

export function generatePredictedPaper(subjectId: string): PredictedPaper {
  const subject = ECE_SUBJECTS.find(s => s.id === subjectId);
  const questions = getQuestionsForSubject(subjectId);
  const highYield = getFrequentlyAskedTopics(subjectId, 6);

  const topics = highYield.map(h => h.topic);
  const avgFrequency = highYield.reduce((sum, h) => sum + h.count, 0) / highYield.length;
  const confidence = Math.min(95, Math.round(50 + avgFrequency * 8));

  const basedOn = highYield.slice(0, 4).map(h => ({
    year: 2026 - (h.count <= 2 ? 1 : h.count <= 4 ? 2 : 3),
    topic: h.topic,
    frequency: h.count,
  }));

  const reasoning = `Based on ${questions.length} PYQs spanning ${Math.min(...questions.map(q=>q.year))}–${Math.max(...questions.map(q=>q.year))}, these topics have appeared ${highYield.reduce((s,h)=>s+h.count,0)} times across ${subject?.name}. ${topics.length > 0 ? `"${topics[0]}" is the most frequent topic.` : ''}`;

  return {
    id: `pred-${subjectId}-2026`,
    title: `GATE 2026 Predicted: ${subject?.name}`,
    subjectId,
    subjectName: subject?.name || subjectId,
    topics,
    confidence,
    reasoning,
    basedOn,
  };
}

// ── Doubt Engine: Common misconceptions ───────────────────────────

export interface DoubtEntry {
  id: string;
  subjectId: string;
  topic: string;
  misconception: string;
  correctConcept: string;
  relatedQuestionIds: string[];
  difficulty: "easy" | "medium" | "hard";
}

// Common misconceptions derived from question patterns
export const ECE_COMMON_DOUBTS: DoubtEntry[] = [
  // Network Theory
  {
    id: "doubt-nt-1",
    subjectId: "ece-nt",
    topic: "Maximum Power Transfer",
    misconception: "Maximum power transfer occurs when R_L = R_s (resistance only)",
    correctConcept: "For complex impedance, maximum power transfer occurs when Z_L = Z_s* (complex conjugate). For purely resistive source, R_L = R_s.",
    relatedQuestionIds: ["ece-nt-007"],
    difficulty: "medium",
  },
  {
    id: "doubt-nt-2",
    subjectId: "ece-nt",
    topic: "Superposition Theorem",
    misconception: "Superposition can be applied to power calculations",
    correctConcept: "Superposition applies only to voltage and current (linear responses). Power (proportional to V² or I²) cannot be found by superposition — calculate total V/I first, then compute power.",
    relatedQuestionIds: ["ece-nt-006"],
    difficulty: "medium",
  },
  // Signals & Systems
  {
    id: "doubt-ss-1",
    subjectId: "ece-ss",
    topic: "Fourier Transform",
    misconception: "All periodic signals have Fourier transforms",
    correctConcept: "Periodic signals have Fourier SERIES (discrete spectrum). Only aperiodic (energy) signals have Fourier TRANSFORM (continuous spectrum). A periodic signal's FT is a series of impulses.",
    relatedQuestionIds: ["ece-ss-001", "ece-ss-002"],
    difficulty: "medium",
  },
  {
    id: "doubt-ss-2",
    subjectId: "ece-ss",
    topic: "Laplace Transform ROC",
    misconception: "ROC always includes the jω axis",
    correctConcept: "ROC includes jω axis only for stable systems. For unstable systems, ROC does NOT include jω axis. For marginally stable, jω axis is on the boundary of ROC.",
    relatedQuestionIds: ["ece-ss-007", "ece-ss-019"],
    difficulty: "hard",
  },
  // Control Systems
  {
    id: "doubt-cs-1",
    subjectId: "ece-cs",
    topic: "Routh-Hurwitz",
    misconception: "All positive coefficients guarantee stability",
    correctConcept: "Positive coefficients are necessary but NOT sufficient for stability. Must check the Routh array for sign changes. Example: s³ + 2s² + s + 2 has all positive coefficients but is unstable.",
    relatedQuestionIds: ["ece-cs-002"],
    difficulty: "hard",
  },
  {
    id: "doubt-cs-2",
    subjectId: "ece-cs",
    topic: "Nyquist Criterion",
    misconception: "Nyquist plot must encircle (-1,j0) for stability",
    correctConcept: "N = encirclements of (-1,j0). For stability: Z = 0 → N = -P. If P=0 (no open-loop RHP poles), the Nyquist plot must NOT encircle (-1,j0). If P≠0, must encircle (-1,j0) exactly P times.",
    relatedQuestionIds: ["ece-cs-006"],
    difficulty: "hard",
  },
  // Digital Electronics
  {
    id: "doubt-de-1",
    subjectId: "ece-de",
    topic: "Flip-Flops",
    misconception: "SR latch and SR flip-flop are the same",
    correctConcept: "SR latch is level-triggered (unclocked), SR flip-flop is edge-triggered (clocked). SR latch has invalid state (S=R=1). JK flip-flop solves this by toggling instead of entering invalid state.",
    relatedQuestionIds: ["ece-de-005", "ece-de-012", "ece-de-022"],
    difficulty: "easy",
  },
  {
    id: "doubt-de-2",
    subjectId: "ece-de",
    topic: "Karnaugh Map",
    misconception: "Prime implicants always give minimal solution",
    correctConcept: "Essential prime implicants MUST be included. Non-essential prime implicants: select the minimum set that covers all minterms. Don't-care conditions can be used to form larger groups.",
    relatedQuestionIds: ["ece-de-002", "ece-de-026"],
    difficulty: "hard",
  },
  // Communication
  {
    id: "doubt-com-1",
    subjectId: "ece-com",
    topic: "AM Modulation",
    misconception: "Higher modulation index always gives better SNR",
    correctConcept: "In AM, SNR_out ∝ m². But m > 1 causes over-modulation (envelope distortion). m = 1 (100% modulation) gives maximum useful power. For m > 1, we need a coherent detector.",
    relatedQuestionIds: ["ece-com-001", "ece-com-027"],
    difficulty: "medium",
  },
  {
    id: "doubt-com-2",
    subjectId: "ece-com",
    topic: "SNR",
    misconception: "SNR increases with bandwidth for all modulation schemes",
    correctConcept: "For baseband AWGN: increasing bandwidth increases noise power linearly. SNR may actually decrease. For FM with threshold effect, SNR can improve with bandwidth. Modulation scheme determines the SNR-bandwidth tradeoff.",
    relatedQuestionIds: ["ece-com-003", "ece-com-009"],
    difficulty: "hard",
  },
  // Electromagnetics
  {
    id: "doubt-em-1",
    subjectId: "ece-em",
    topic: "Transmission Line",
    misconception: "Characteristic impedance depends on line length",
    correctConcept: "Z₀ = √(L/C) depends only on per-unit-length parameters (L, C) and NOT on line length. It's a property of the transmission line construction. Line length affects overall impedance seen at input (via input impedance formula).",
    relatedQuestionIds: ["ece-em-002", "ece-em-005", "ece-em-009"],
    difficulty: "medium",
  },
  {
    id: "doubt-em-2",
    subjectId: "ece-em",
    topic: "Waveguide",
    misconception: "TEM mode can propagate in rectangular waveguide",
    correctConcept: "TEM mode (E_z = B_z = 0) CANNOT propagate in a hollow waveguide. It requires two conductors (coaxial line, parallel wire). Waveguide supports only TE and TM modes. TEM is the exception, not the rule, in waveguides.",
    relatedQuestionIds: ["ece-em-006"],
    difficulty: "medium",
  },
  // Engineering Mathematics
  {
    id: "doubt-math-1",
    subjectId: "ece-math",
    topic: "Probability",
    misconception: "P(A|B) = P(B|A)",
    correctConcept: "In general, P(A|B) ≠ P(B|A). Bayes' theorem: P(A|B) = P(B|A)·P(A)/P(B). They are equal only when P(A) = P(B) (rarely true). This is a common trap in conditional probability questions.",
    relatedQuestionIds: ["ece-math-002", "ece-math-022"],
    difficulty: "medium",
  },
  {
    id: "doubt-math-2",
    subjectId: "ece-math",
    topic: "Matrix",
    misconception: "Inverse exists for any square matrix",
    correctConcept: "Inverse exists ONLY if determinant ≠ 0 (non-singular). Singular matrix (|A| = 0) has no inverse. For 2×2: A⁻¹ = (1/|A|)[[d, -b], [-c, a]] for A = [[a,b],[c,d]]. Check |A| first!",
    relatedQuestionIds: ["ece-math-001", "ece-math-006", "ece-math-018"],
    difficulty: "easy",
  },
  // Analog Circuits
  {
    id: "doubt-ac-1",
    subjectId: "ece-ac",
    topic: "Op-Amp",
    misconception: "Op-amp always needs dual power supply",
    correctConcept: "Op-amps can work with single supply if biased at Vcc/2. However, dual supply (±V) is common for AC-coupled applications. Modern op-amps often support rail-to-rail operation with single supply.",
    relatedQuestionIds: [],
    difficulty: "medium",
  },
  {
    id: "doubt-ac-2",
    subjectId: "ece-ac",
    topic: "Feedback Amplifier",
    misconception: "Negative feedback always reduces gain",
    correctConcept: "Negative feedback reduces the CLOSED-LOOP gain (A/(1+AF)) compared to open-loop gain A. But it stabilizes gain, increases bandwidth, reduces distortion, and improves input/output impedance. The closed-loop gain is predictable.",
    relatedQuestionIds: [],
    difficulty: "medium",
  },
];

/**
 * Get all doubts for a specific subject
 */
export function getDoubtsForSubject(subjectId: string): DoubtEntry[] {
  return ECE_COMMON_DOUBTS.filter(d => d.subjectId === subjectId);
}

/**
 * Get all doubts across all ECE subjects
 */
export function getAllDoubts(): DoubtEntry[] {
  return ECE_COMMON_DOUBTS;
}

// ── Exam readiness checker ────────────────────────────────────────

export interface ReadinessReport {
  subjectId: string;
  subjectName: string;
  topicCoverage: { topic: string; covered: boolean; questionCount: number }[];
  difficultyCoverage: { level: string; attempted: number; total: number }[];
  predictedScore: number;
  weakAreas: string[];
  strongAreas: string[];
  recommendations: string[];
}

export function getReadinessReport(subjectId: string): ReadinessReport {
  const analytics = ECE_ANALYTICS[subjectId];
  const subject = ECE_SUBJECTS.find(s => s.id === subjectId);

  const topicCoverage = analytics.topTopics.map(t => ({
    topic: t.topic,
    covered: t.count >= 2,
    questionCount: t.count,
  }));

  const difficultyCoverage = [
    { level: "Easy", attempted: Math.floor(analytics.difficultyBreakdown.easy * 0.7), total: analytics.difficultyBreakdown.easy },
    { level: "Medium", attempted: Math.floor(analytics.difficultyBreakdown.medium * 0.5), total: analytics.difficultyBreakdown.medium },
    { level: "Hard", attempted: Math.floor(analytics.difficultyBreakdown.hard * 0.3), total: analytics.difficultyBreakdown.hard },
  ];

  const weakAreas = analytics.topTopics
    .filter(t => t.count >= 3 && t.count <= 4)
    .slice(0, 3)
    .map(t => t.topic);

  const strongAreas = analytics.predictedTopics
    .filter(p => p.probability >= 70)
    .slice(0, 3)
    .map(p => p.topic);

  const predictedScore = Math.min(95, 40 + analytics.totalQuestions * 0.5);

  const recommendations = [
    ...(weakAreas.length > 0 ? [`Focus on: ${weakAreas.join(", ")} — moderate frequency but needs practice`] : []),
    ...(analytics.difficultyBreakdown.hard > analytics.difficultyBreakdown.easy
      ? ["More practice with easy questions to build confidence"]
      : ["Good mix of difficulties — try harder problems"]),
    `Review ${analytics.predictedTopics[0]?.topic || "core topics"} — highest probability topic`,
    "Practice MSQ and NAT type questions for full marks",
  ];

  return {
    subjectId,
    subjectName: subject?.name || subjectId,
    topicCoverage,
    difficultyCoverage,
    predictedScore: Math.round(predictedScore),
    weakAreas,
    strongAreas,
    recommendations,
  };
}

export default ECE_ANALYTICS;
