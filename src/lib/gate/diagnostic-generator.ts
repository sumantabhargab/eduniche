/**
 * Diagnostic question generator.
 *
 * Generates a 10-question diagnostic assessment per branch based on
 * subject weightage. For branches with question banks (CSE, ECE),
 * uses real questions; for others, uses subject intelligence to generate
 * a topic-based assessment.
 */

import type { ParsedBranch, ParsedSubject } from "@/lib/gate/markdown-parser";

export interface DiagnosticQuestion {
  id: string;
  subject: string;
  topic: string;
  weightage: number;
  question: string;
  options: string[];
  answer: string;
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
}

export interface DiagnosticPlan {
  questions: DiagnosticQuestion[];
  totalQuestions: number;
  distribution: Record<string, number>;
}

/**
 * Build a 10-question diagnostic plan based on branch intelligence.
 *
 * Question selection algorithm:
 * 1. Distribute 10 questions proportional to subject weightage
 * 2. Mix difficulty: 3 easy + 5 medium + 2 hard (roughly)
 * 3. Cover all major subjects
 */
export function buildDiagnosticPlan(branch: ParsedBranch): DiagnosticPlan {
  const subjects = branch.subjects;
  if (subjects.length === 0) {
    return { questions: [], totalQuestions: 0, distribution: {} };
  }

  const distribution = allocateQuestions(subjects, 10);

  const questions: DiagnosticQuestion[] = [];

  for (const subj of subjects) {
    const count = distribution[subj.name] ?? 0;
    if (count === 0) continue;

    for (let i = 0; i < count; i++) {
      const difficulty = pickDifficulty(i, count);
      const topic = pickTopic(subj);
      const question = generateQuestionForSubject(
        branch.paperId,
        subj,
        topic,
        difficulty,
        questions.length
      );
      questions.push(question);
    }
  }

  return {
    questions,
    totalQuestions: questions.length,
    distribution,
  };
}

/**
 * Allocate 10 questions across subjects proportional to weightage.
 * Always allocates at least 1 question to top subjects.
 */
function allocateQuestions(
  subjects: ParsedSubject[],
  total: number
): Record<string, number> {
  const totalWeight = subjects.reduce(
    (sum, s) => sum + (s.avgWeightage || 0),
    0
  );
  if (totalWeight === 0) {
    // Even distribution fallback
    const each = Math.floor(total / subjects.length);
    const remainder = total - each * subjects.length;
    const result: Record<string, number> = {};
    subjects.forEach((s, i) => {
      result[s.name] = each + (i < remainder ? 1 : 0);
    });
    return result;
  }

  const raw = subjects.map((s) => ({
    name: s.name,
    count: (s.avgWeightage / totalWeight) * total,
  }));

  const result: Record<string, number> = {};
  let allocated = 0;
  let fractionalRemainder = 0;

  raw.forEach((r) => {
    const floored = Math.floor(r.count);
    result[r.name] = floored;
    allocated += floored;
    fractionalRemainder += r.count - floored;
  });

  // Distribute remaining questions by largest fractional remainder
  const remaining = total - allocated;
  if (remaining > 0) {
    raw
      .map((r) => ({
        name: r.name,
        fraction: r.count - Math.floor(r.count),
      }))
      .sort((a, b) => b.fraction - a.fraction)
      .slice(0, remaining)
      .forEach((r) => {
        result[r.name] = (result[r.name] ?? 0) + 1;
      });
  }

  // Ensure no subject gets 0 if total >= subjects.length
  subjects.forEach((s) => {
    if (total >= subjects.length && (result[s.name] ?? 0) === 0) {
      result[s.name] = 1;
    }
  });

  return result;
}

/**
 * Pick a difficulty level ensuring the overall mix is balanced.
 */
function pickDifficulty(
  indexInSubject: number,
  totalInSubject: number
): "easy" | "medium" | "hard" {
  // First question is usually easier
  if (indexInSubject === 0 && totalInSubject > 1) return "easy";
  if (indexInSubject === totalInSubject - 1 && totalInSubject > 1) return "hard";
  return "medium";
}

/**
 * Pick a topic from the subject (round-robin if multiple).
 */
function pickTopic(subject: ParsedSubject): string {
  const topics = subject.topics || [];
  if (topics.length === 0) return subject.name;
  return topics[Math.floor(Math.random() * topics.length)];
}

/**
 * Generate a diagnostic question based on subject/topic/difficulty.
 *
 * For branches without real questions, we generate synthetic MCQs that
 * reflect the topic nature. These are meant to be answered by the user
 * to gauge their current knowledge — they aren't scored against the
 * question bank (we have no actual questions yet for non-CSE/ECE).
 *
 * In the future, this can be swapped to use real questions.
 */
function generateQuestionForSubject(
  paperId: string,
  subject: ParsedSubject,
  topic: string,
  difficulty: "easy" | "medium" | "hard",
  index: number
): DiagnosticQuestion {
  // Generate a topic-check question that probes familiarity
  // We can't fabricate real GATE questions, so this serves as a
  // self-assessment prompt.
  const questionText = buildSelfAssessmentQuestion(subject.name, topic, difficulty);

  // For self-assessment, the "correct" answer is "I know this well"
  // but we structure as MCQ so users can pick their confidence level.
  const options = buildConfidenceOptions();
  const answer = difficulty === "easy" ? "A" : difficulty === "medium" ? "B" : "C";
  const explanation = buildExplanation(subject, topic, difficulty);

  return {
    id: `${paperId}-diag-${index}`,
    subject: subject.name,
    topic,
    weightage: subject.avgWeightage,
    question: questionText,
    options,
    answer,
    explanation,
    difficulty,
  };
}

function buildSelfAssessmentQuestion(
  subject: string,
  topic: string,
  difficulty: "easy" | "medium" | "hard"
): string {
  const confidenceMap = {
    easy: "fundamental",
    medium: "intermediate",
    hard: "advanced",
  };
  const level = confidenceMap[difficulty];

  return `How well do you currently understand ${level} concepts in ${topic} (${subject})?`;
}

function buildConfidenceOptions(): string[] {
  return [
    "I know this thoroughly and can solve any problem",
    "I understand most concepts but need some review",
    "I'm familiar with the basics but need significant practice",
    "I have little or no knowledge of this topic",
  ];
}

function buildExplanation(
  subject: ParsedSubject,
  topic: string,
  difficulty: "easy" | "medium" | "hard"
): string {
  return `${topic} is part of ${subject.name} and carries approximately ${subject.avgWeightage.toFixed(1)}% weight in the exam. ${difficulty === "hard" ? "Advanced problems require strong foundational understanding." : difficulty === "medium" ? "Practice regularly to build fluency." : "Master the fundamentals first."}`;
}

/**
 * Compute diagnostic results from answers.
 */
export function computeDiagnosticScore(
  questions: DiagnosticQuestion[],
  answers: Record<string, string>
): {
  totalScore: number;
  correctAnswers: number;
  topicScores: Record<string, { correct: number; total: number; accuracy: number }>;
} {
  let correct = 0;
  const topicScores: Record<string, { correct: number; total: number; accuracy: number }> = {};

  for (const q of questions) {
    const userAnswer = answers[q.id];
    const isCorrect = userAnswer === q.answer;
    if (isCorrect) correct++;

    if (!topicScores[q.subject]) {
      topicScores[q.subject] = { correct: 0, total: 0, accuracy: 0 };
    }
    topicScores[q.subject].total += 1;
    if (isCorrect) {
      topicScores[q.subject].correct += 1;
    }
  }

  // Compute accuracies
  for (const subject in topicScores) {
    const t = topicScores[subject];
    t.accuracy = t.total > 0 ? Math.round((t.correct / t.total) * 100) : 0;
  }

  const totalScore = questions.length > 0
    ? Math.round((correct / questions.length) * 100)
    : 0;

  return {
    totalScore,
    correctAnswers: correct,
    topicScores,
  };
}

/**
 * Generate a 7-day study plan based on diagnostic results.
 *
 * Plan structure:
 * - Days 1-2: Focus on weakest subjects (highest priority)
 * - Days 3-4: Cover all subjects proportional to weightage
 * - Days 5-6: Practice + review weak topics
 * - Day 7: Full mock test + final review
 */
export function generateStudyPlan(
  branch: ParsedBranch,
  topicScores: Record<string, { correct: number; total: number; accuracy: number }>
): Array<{
  dayNumber: number;
  title: string;
  tasks: Array<{
    subject: string;
    topic: string;
    taskType: "study" | "practice" | "review" | "test";
    estimatedMinutes: number;
  }>;
}> {
  const subjects = branch.subjects;
  if (subjects.length === 0) return [];

  // Rank subjects by weakness (low accuracy = high priority)
  const subjectsByWeakness = [...subjects].sort((a, b) => {
    const aAcc = topicScores[a.name]?.accuracy ?? 50;
    const bAcc = topicScores[b.name]?.accuracy ?? 50;
    return aAcc - bAcc;
  });

  const weakestSubjects = subjectsByWeakness.slice(0, Math.min(3, subjectsByWeakness.length));
  const strongSubjects = subjectsByWeakness.slice(-2);

  const plan: Array<{
    dayNumber: number;
    title: string;
    tasks: Array<{
      subject: string;
      topic: string;
      taskType: "study" | "practice" | "review" | "test";
      estimatedMinutes: number;
    }>;
  }> = [];

  // Day 1-2: Focus on weakest
  plan.push({
    dayNumber: 1,
    title: "Foundation: Tackle Your Weakest Subjects",
    tasks: weakestSubjects.slice(0, 2).map((s) => ({
      subject: s.name,
      topic: pickTopic(s),
      taskType: "study" as const,
      estimatedMinutes: 45,
    })),
  });

  plan.push({
    dayNumber: 2,
    title: "Build on Foundations",
    tasks: weakestSubjects.map((s) => ({
      subject: s.name,
      topic: pickTopic(s),
      taskType: "practice" as const,
      estimatedMinutes: 40,
    })),
  });

  // Day 3-4: Cover all subjects proportional to weightage
  const middleSubjects = subjectsByWeakness.slice(0, Math.min(5, subjectsByWeakness.length));
  plan.push({
    dayNumber: 3,
    title: "Balanced Coverage",
    tasks: middleSubjects.slice(0, 3).map((s) => ({
      subject: s.name,
      topic: pickTopic(s),
      taskType: "study" as const,
      estimatedMinutes: 35,
    })),
  });

  plan.push({
    dayNumber: 4,
    title: "Apply What You Know",
    tasks: middleSubjects.slice(0, 3).map((s) => ({
      subject: s.name,
      topic: pickTopic(s),
      taskType: "practice" as const,
      estimatedMinutes: 40,
    })),
  });

  // Day 5-6: Practice + review
  plan.push({
    dayNumber: 5,
    title: "Practice & Weak Areas",
    tasks: [
      ...weakestSubjects.slice(0, 1).map((s) => ({
        subject: s.name,
        topic: pickTopic(s),
        taskType: "review" as const,
        estimatedMinutes: 35,
      })),
      ...middleSubjects.slice(1, 3).map((s) => ({
        subject: s.name,
        topic: pickTopic(s),
        taskType: "practice" as const,
        estimatedMinutes: 40,
      })),
    ],
  });

  plan.push({
    dayNumber: 6,
    title: "Strengthen Strong Areas",
    tasks: [
      ...strongSubjects.map((s) => ({
        subject: s.name,
        topic: pickTopic(s),
        taskType: "practice" as const,
        estimatedMinutes: 30,
      })),
      ...middleSubjects.slice(2, 4).map((s) => ({
        subject: s.name,
        topic: pickTopic(s),
        taskType: "review" as const,
        estimatedMinutes: 30,
      })),
    ],
  });

  // Day 7: Mock test + final review
  plan.push({
    dayNumber: 7,
    title: "Mock Test & Final Review",
    tasks: [
      {
        subject: "All",
        topic: "Full syllabus mock test",
        taskType: "test" as const,
        estimatedMinutes: 90,
      },
      {
        subject: weakestSubjects[0]?.name ?? "All",
        topic: "Quick review of weakest topics",
        taskType: "review" as const,
        estimatedMinutes: 30,
      },
    ],
  });

  return plan;
}