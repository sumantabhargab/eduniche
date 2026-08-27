/**
 * ECE (Electronics and Communication Engineering) — Master Data Index
 *
 * Aggregates all subject-level question banks into a single export
 * that the app's doubt engine, paper generator, and predicted-papers
 * modules can consume.
 *
 * Each subject file exports:
 *   - QUESTIONS: Question[] — the full question bank
 *   - META: { totalQuestions, yearRange, questionTypes, topics }
 *
 * Usage:
 *   import { ECE_DATA, ECE_SUBJECTS, getQuestionsForSubject } from '@/data/ece-data';
 */

import { ECE_ANALOG_QUESTIONS, ECE_ANALOG_META } from "./questions-ece-analog";
import { ECE_DIGITAL_QUESTIONS, ECE_DIGITAL_META } from "./questions-ece-digital";
import { ECE_CONTROL_QUESTIONS, ECE_CONTROL_META } from "./questions-ece-control";
import { ECE_COMM_QUESTIONS, ECE_COMM_META } from "./questions-ece-communication";
import { ECE_EM_QUESTIONS, ECE_EM_META } from "./questions-ece-em";
import { ECE_NETWORK_QUESTIONS, ECE_NETWORK_META } from "./questions-ece-networks";
import { ECE_MATH_QUESTIONS, ECE_MATH_META } from "./questions-ece-math";
import { ECE_SS_QUESTIONS, ECE_SS_META } from "./questions-ece-signals";
import { ECE_APTITUDE_QUESTIONS, ECE_APTITUDE_META } from "./questions-ece-aptitude";
import { ECE_DEVICES_QUESTIONS, ECE_DEVICES_META } from "./questions-ece-devices";

// ── Subject registry ──────────────────────────────────────────────
export interface SubjectInfo {
  id: string;
  name: string;
  icon: string;
  questionCount: number;
  yearRange: string;
  topics: string[];
  mcq: number;
  msq: number;
  nat: number;
}

export const ECE_SUBJECTS: SubjectInfo[] = [
  {
    id: "ece-networks",
    name: "Network Theory",
    icon: "🔌",
    questionCount: ECE_NETWORK_META.totalQuestions,
    yearRange: ECE_NETWORK_META.yearRange,
    topics: ECE_NETWORK_META.topics,
    mcq: ECE_NETWORK_META.questionTypes.mcq,
    msq: ECE_NETWORK_META.questionTypes.msq,
    nat: ECE_NETWORK_META.questionTypes.nat,
  },
  {
    id: "ece-signals",
    name: "Signals & Systems",
    icon: "📡",
    questionCount: ECE_SS_META.totalQuestions,
    yearRange: ECE_SS_META.yearRange,
    topics: ECE_SS_META.topics,
    mcq: ECE_SS_META.questionTypes.mcq,
    msq: ECE_SS_META.questionTypes.msq,
    nat: ECE_SS_META.questionTypes.nat,
  },
  {
    id: "ece-control",
    name: "Control Systems",
    icon: "🎛️",
    questionCount: ECE_CONTROL_META.totalQuestions,
    yearRange: ECE_CONTROL_META.yearRange,
    topics: ECE_CONTROL_META.topics,
    mcq: ECE_CONTROL_META.questionTypes.mcq,
    msq: ECE_CONTROL_META.questionTypes.msq,
    nat: ECE_CONTROL_META.questionTypes.nat,
  },
  {
    id: "ece-digital",
    name: "Digital Electronics",
    icon: "💾",
    questionCount: ECE_DIGITAL_META.totalQuestions,
    yearRange: ECE_DIGITAL_META.yearRange,
    topics: ECE_DIGITAL_META.topics,
    mcq: ECE_DIGITAL_META.questionTypes.mcq,
    msq: ECE_DIGITAL_META.questionTypes.msq,
    nat: ECE_DIGITAL_META.questionTypes.nat,
  },
  {
    id: "ece-analog",
    name: "Analog Circuits",
    icon: "⚡",
    questionCount: ECE_ANALOG_META.totalQuestions,
    yearRange: ECE_ANALOG_META.yearRange,
    topics: ECE_ANALOG_META.topics,
    mcq: ECE_ANALOG_META.questionTypes.mcq,
    msq: ECE_ANALOG_META.questionTypes.msq,
    nat: ECE_ANALOG_META.questionTypes.nat,
  },
  {
    id: "ece-communications",
    name: "Communication Systems",
    icon: "📶",
    questionCount: ECE_COMM_META.totalQuestions,
    yearRange: ECE_COMM_META.yearRange,
    topics: ECE_COMM_META.topics,
    mcq: ECE_COMM_META.questionTypes.mcq,
    msq: ECE_COMM_META.questionTypes.msq,
    nat: ECE_COMM_META.questionTypes.nat,
  },
  {
    id: "ece-electromagnetics",
    name: "Electromagnetics",
    icon: "🌐",
    questionCount: ECE_EM_META.totalQuestions,
    yearRange: ECE_EM_META.yearRange,
    topics: ECE_EM_META.topics,
    mcq: ECE_EM_META.questionTypes.mcq,
    msq: ECE_EM_META.questionTypes.msq,
    nat: ECE_EM_META.questionTypes.nat,
  },
  {
    id: "ece-devices",
    name: "Electronic Devices",
    icon: "🔬",
    questionCount: ECE_DEVICES_META.totalQuestions,
    yearRange: ECE_DEVICES_META.yearRange,
    topics: ECE_DEVICES_META.topics,
    mcq: ECE_DEVICES_META.questionTypes.mcq,
    msq: ECE_DEVICES_META.questionTypes.msq,
    nat: ECE_DEVICES_META.questionTypes.nat,
  },
  {
    id: "ece-math",
    name: "Engineering Mathematics",
    icon: "📐",
    questionCount: ECE_MATH_META.totalQuestions,
    yearRange: ECE_MATH_META.yearRange,
    topics: ECE_MATH_META.topics,
    mcq: ECE_MATH_META.questionTypes.mcq,
    msq: ECE_MATH_META.questionTypes.msq,
    nat: ECE_MATH_META.questionTypes.nat,
  },
  {
    id: "ece-apt",
    name: "General Aptitude",
    icon: "🧮",
    questionCount: ECE_APTITUDE_META.totalQuestions,
    yearRange: ECE_APTITUDE_META.yearRange,
    topics: ECE_APTITUDE_META.topics,
    mcq: ECE_APTITUDE_META.questionTypes.mcq,
    msq: ECE_APTITUDE_META.questionTypes.msq,
    nat: ECE_APTITUDE_META.questionTypes.nat,
  },
];

// ── Master question bank ──────────────────────────────────────────
export interface Question {
  id: string;
  subject: string;
  subjectId: string;
  topic: string;
  year: number;
  set?: string;
  marks: number;
  type: "MCQ" | "MSQ" | "NAT";
  question: string;
  options?: string[];
  answer: string;
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
  tags: string[];
}

export const ECE_ALL_QUESTIONS: Question[] = [
  ...ECE_NETWORK_QUESTIONS,
  ...ECE_SS_QUESTIONS,
  ...ECE_CONTROL_QUESTIONS,
  ...ECE_DIGITAL_QUESTIONS,
  ...ECE_ANALOG_QUESTIONS,
  ...ECE_COMM_QUESTIONS,
  ...ECE_EM_QUESTIONS,
  ...ECE_MATH_QUESTIONS,
  ...ECE_APTITUDE_QUESTIONS,
];

// ── Overall stats ─────────────────────────────────────────────────
export const ECE_TOTAL_QUESTIONS = ECE_ALL_QUESTIONS.length;
export const ECE_YEAR_RANGE = `${Math.min(...ECE_ALL_QUESTIONS.map(q => q.year))}–${Math.max(...ECE_ALL_QUESTIONS.map(q => q.year))}`;
export const ECE_QUESTION_TYPES = {
  mcq: ECE_ALL_QUESTIONS.filter(q => q.type === "MCQ").length,
  msq: ECE_ALL_QUESTIONS.filter(q => q.type === "MSQ").length,
  nat: ECE_ALL_QUESTIONS.filter(q => q.type === "NAT").length,
};
export const ECE_ALL_TOPICS = [...new Set(ECE_ALL_QUESTIONS.map(q => q.topic))];

// ── Helper functions ──────────────────────────────────────────────

/**
 * Get all questions for a specific subject
 */
export function getQuestionsForSubject(subjectId: string): Question[] {
  return ECE_ALL_QUESTIONS.filter(q => q.subjectId === subjectId);
}

/**
 * Get questions filtered by multiple criteria
 */
export function filterQuestions({
  subjectId,
  topic,
  year,
  type,
  difficulty,
  marks,
  tags,
  search,
}: {
  subjectId?: string;
  topic?: string;
  year?: number | number[];
  type?: "MCQ" | "MSQ" | "NAT";
  difficulty?: "easy" | "medium" | "hard";
  marks?: number;
  tags?: string[];
  search?: string;
}): Question[] {
  return ECE_ALL_QUESTIONS.filter(q => {
    if (subjectId && q.subjectId !== subjectId) return false;
    if (topic && q.topic !== topic) return false;
    if (year) {
      const years = Array.isArray(year) ? year : [year];
      if (!years.includes(q.year)) return false;
    }
    if (type && q.type !== type) return false;
    if (difficulty && q.difficulty !== difficulty) return false;
    if (marks && q.marks !== marks) return false;
    if (tags && !tags.some(t => q.tags.includes(t))) return false;
    if (search) {
      const s = search.toLowerCase();
      return (
        q.question.toLowerCase().includes(s) ||
        q.explanation.toLowerCase().includes(s) ||
        q.topic.toLowerCase().includes(s) ||
        q.tags.some(t => t.toLowerCase().includes(s))
      );
    }
    return true;
  });
}

/**
 * Get questions by year range
 */
export function getQuestionsByYears(minYear: number, maxYear: number): Question[] {
  return ECE_ALL_QUESTIONS.filter(q => q.year >= minYear && q.year <= maxYear);
}

/**
 * Get all unique topics across all subjects
 */
export function getAllTopics(): { subjectId: string; subject: string; topics: string[] }[] {
  const subjects: Record<string, { subject: string; topics: Set<string> }> = {};
  ECE_ALL_QUESTIONS.forEach(q => {
    if (!subjects[q.subjectId]) {
      subjects[q.subjectId] = { subject: q.subject, topics: new Set() };
    }
    subjects[q.subjectId].topics.add(q.topic);
  });
  return Object.entries(subjects).map(([id, { subject, topics }]) => ({
    subjectId: id,
    subject,
    topics: [...topics].sort(),
  }));
}

/**
 * Get year-wise question counts
 */
export function getYearWiseCounts(): { year: number; count: number }[] {
  const counts: Record<number, number> = {};
  ECE_ALL_QUESTIONS.forEach(q => {
    counts[q.year] = (counts[q.year] || 0) + 1;
  });
  return Object.entries(counts)
    .map(([year, count]) => ({ year: Number(year), count }))
    .sort((a, b) => a.year - b.year);
}

/**
 * Get topic-wise distribution for a subject
 */
export function getTopicDistribution(subjectId: string): { topic: string; count: number }[] {
  const counts: Record<string, number> = {};
  const questions = getQuestionsForSubject(subjectId);
  questions.forEach(q => {
    counts[q.topic] = (counts[q.topic] || 0) + 1;
  });
  return Object.entries(counts)
    .map(([topic, count]) => ({ topic, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Get frequently asked topics (weighted by recency and frequency)
 */
export function getFrequentlyAskedTopics(subjectId?: string, limit = 10): { topic: string; count: number; recentWeight: number }[] {
  const questions = subjectId ? getQuestionsForSubject(subjectId) : ECE_ALL_QUESTIONS;
  const currentYear = 2026;

  const topicData: Record<string, { count: number; recencySum: number }> = {};
  questions.forEach(q => {
    if (!topicData[q.topic]) topicData[q.topic] = { count: 0, recencySum: 0 };
    topicData[q.topic].count++;
    topicData[q.topic].recencySum += (q.year - 2000); // Weight by year (higher = more recent)
  });

  return Object.entries(topicData)
    .map(([topic, data]) => ({
      topic,
      count: data.count,
      recentWeight: data.recencySum,
    }))
    .sort((a, b) => {
      // Score = count × 0.6 + recencyWeight × 0.4
      const scoreA = a.count * 0.6 + a.recentWeight * 0.4;
      const scoreB = b.count * 0.6 + b.recentWeight * 0.4;
      return scoreB - scoreA;
    })
    .slice(0, limit);
}

/**
 * Generate a practice test with specified parameters
 */
export function generateTest({
  subjectId,
  totalMarks = 10,
  distribution = { easy: 0.4, medium: 0.4, hard: 0.2 },
  mcqRatio = 0.7,
}: {
  subjectId?: string;
  totalMarks?: number;
  distribution?: { easy: number; medium: number; hard: number };
  mcqRatio?: number;
}): Question[] {
  const pool = subjectId ? getQuestionsForSubject(subjectId) : ECE_ALL_QUESTIONS;
  const shuffled = [...pool].sort(() => Math.random() - 0.5);

  const easyCount = Math.round(totalMarks * distribution.easy / 2); // avg 2 marks each
  const mediumCount = Math.round(totalMarks * distribution.medium / 2);
  const hardCount = Math.round(totalMarks * distribution.hard / 2);

  const easy = shuffled.filter(q => q.difficulty === "easy").slice(0, easyCount);
  const medium = shuffled.filter(q => q.difficulty === "medium").slice(0, mediumCount);
  const hard = shuffled.filter(q => q.difficulty === "hard").slice(0, hardCount);

  return [...easy, ...medium, ...hard];
}

/**
 * Predict likely topics for upcoming exam based on historical frequency
 */
export function predictImportantTopics(subjectId: string, topN = 5): { topic: string; probability: number; reason: string }[] {
  const freq = getFrequentlyAskedTopics(subjectId, topN * 2);
  const maxCount = Math.max(...freq.map(f => f.count));

  return freq.slice(0, topN).map(f => {
    const probability = Math.round((f.count / maxCount) * 100);
    let reason = "";
    if (f.count >= 5) reason = "Highly frequently asked";
    else if (f.count >= 3) reason = "Regularly appears";
    else reason = "Occasional appearance";

    // Boost probability for recent appearances
    if (f.recentWeight > 470) reason += " — very recent";
    else if (f.recentWeight > 450) reason += " — recent";

    return { topic: f.topic, probability, reason };
  });
}

export const ECE_DATA = {
  subjects: ECE_SUBJECTS,
  allQuestions: ECE_ALL_QUESTIONS,
  totalQuestions: ECE_TOTAL_QUESTIONS,
  yearRange: ECE_YEAR_RANGE,
  questionTypes: ECE_QUESTION_TYPES,
  allTopics: ECE_ALL_TOPICS,
};

export default ECE_DATA;
