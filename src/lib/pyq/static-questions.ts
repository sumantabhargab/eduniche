/**
 * Static PYQ question bank — loaded when the Supabase database
 * is empty or unavailable. Gives every user a working practice
 * experience without requiring a database connection.
 *
 * Uses pre-processed JSON files from `data/pyq/processed/*.json`
 * which contain real GATE questions for all 20 branches.
 */

import { TOC_QUESTIONS } from "@/data/questions-cse-toc";
import { ECE_TOC_QUESTIONS } from "@/data/questions-ece-toc";

import { readFileSync, existsSync } from "fs";
import { join } from "path";

const PROCESSED_DIR = join(process.cwd(), "data", "pyq", "processed");

// ─── Load processed branch data from JSON files ────────────────────────────────

interface ProcessedQuestion {
  id: string;
  question_number: number;
  question_text: string;
  subject: string;
  topic: string;
  options: string[];
  answer: string | null;
  question_type: string;
  marks: number;
  negative_marks: number;
  branch: string;
  year: number;
  session: string;
  difficulty: string;
  tags: string[];
  explanation: string;
  source: string;
  source_file: string;
}

interface ProcessedBranchData {
  branch: string;
  totalQuestions: number;
  yearRange: { min: number; max: number };
  sessions: string[];
  generatedAt: string;
  questions: ProcessedQuestion[];
}

const processedCache = new Map<string, ProcessedBranchData | null>();

function loadProcessedBranch(branchCode: string): ProcessedBranchData | null {
  const code = branchCode.toUpperCase();

  if (processedCache.has(code)) {
    return processedCache.get(code)!;
  }

  const filePath = join(PROCESSED_DIR, `${code}.json`);
  if (!existsSync(filePath)) {
    processedCache.set(code, null);
    return null;
  }

  try {
    const raw = readFileSync(filePath, "utf-8");
    const data = JSON.parse(raw) as ProcessedBranchData;
    processedCache.set(code, data);
    return data;
  } catch {
    processedCache.set(code, null);
    return null;
  }
}

/** Convert processed question format to PYQ API format */
function fromProcessed(q: ProcessedQuestion): StaticQuestion {
  return {
    id: q.id,
    branchCode: q.branch,
    subjectName: q.subject,
    topicName: q.topic,
    year: q.year,
    session: q.session,
    questionNumber: q.question_number,
    questionType: q.question_type,
    marks: q.marks,
    questionText: q.question_text,
    options: q.options,
    correctAnswer: q.answer || "",
    answerExplanation: q.explanation || "",
    difficulty: q.difficulty,
    source: { primary: q.source || "GATE Official Question Paper" },
    answerVerified: q.answer !== null && q.answer !== "",
  };
}

/** Convert CSE data-file format → PYQ API format */
function toPYQ(q: {
  id: string;
  subject: string;
  subjectId: string;
  topic: string;
  year: number;
  set?: string;
  marks: number;
  type: string;
  question: string;
  options?: string[];
  answer: string;
  explanation: string;
  difficulty: string;
  tags: string[];
}): {
  id: string;
  questionId: string;
  questionNumber: number;
  subjectName: string;
  topicName: string;
  questionType: string;
  marks: number;
  questionText: string;
  options: string[];
  correctAnswer: string;
  answerExplanation: string;
  difficulty: string;
  year: number;
  session?: string;
  source?: { primary: string };
  answerVerified: boolean;
} {
  return {
    id: q.id,
    questionId: q.id,
    questionNumber: 1,
    subjectName: q.subject,
    topicName: q.topic,
    questionType: q.type,
    marks: q.marks,
    questionText: q.question,
    options: q.options ?? [],
    correctAnswer: q.answer,
    answerExplanation: q.explanation,
    difficulty: q.difficulty,
    year: q.year,
    session: q.set,
    source: { primary: "GATE Previous Papers" },
    answerVerified: true,
  };
}

export interface StaticQuestion {
  id: string;
  branchCode: string;
  subjectName: string;
  topicName: string;
  year: number;
  session?: string;
  questionNumber: number;
  questionType: string;
  marks: number;
  questionText: string;
  options: string[];
  correctAnswer: string;
  answerExplanation: string;
  difficulty: string;
  source: { primary: string };
  answerVerified: boolean;
}

export function getStaticQuestionsForBranch(branchCode: string): StaticQuestion[] {
  // Priority 1: processed JSON files (all 20 branches with real questions)
  const processed = loadProcessedBranch(branchCode);
  if (processed) {
    return processed.questions.map((q) => ({ ...fromProcessed(q), branchCode: processed.branch }));
  }

  // Priority 2: in-memory static banks (CSE/ECE)
  switch (branchCode) {
    case "CS":
    case "CSE":
      return TOC_QUESTIONS.map((q) => ({
        ...toPYQ(q),
        branchCode: "CS",
        source: { primary: "GATE Previous Papers" },
      }));
    case "EC":
    case "ECE":
      return ECE_TOC_QUESTIONS.map((q) => ({
        ...toPYQ(q),
        branchCode: "EC",
        source: { primary: "GATE Previous Papers" },
      }));
    default:
      return [];
  }
}

export function getStaticSubjectsForBranch(branchCode: string): {
  subjectName: string;
  displayName: string;
  displayOrder: number;
  questionCount: number;
  topicCount: number;
  topics: { topicName: string; displayName: string; questionCount: number }[];
}[] {
  const all = getStaticQuestionsForBranch(branchCode);
  if (all.length === 0) return [];

  const subjectMap = new Map<string, {
    questionCount: number;
    topics: Map<string, number>;
  }>();

  for (const q of all) {
    if (!subjectMap.has(q.subjectName)) {
      subjectMap.set(q.subjectName, { questionCount: 0, topics: new Map() });
    }
    const s = subjectMap.get(q.subjectName)!;
    s.questionCount++;
    s.topics.set(q.topicName, (s.topics.get(q.topicName) ?? 0) + 1);
  }

  return Array.from(subjectMap.entries()).map(([name, data], idx) => ({
    subjectName: name,
    displayName: name,
    displayOrder: idx + 1,
    questionCount: data.questionCount,
    topicCount: data.topics.size,
    topics: Array.from(data.topics.entries()).map(([topicName, count]) => ({
      topicName,
      displayName: topicName,
      questionCount: count,
    })),
  }));
}

export function getStaticBranchStats(): {
  branchCode: string;
  questionCount: number;
  yearMin: number;
  yearMax: number;
}[] {
  const branches = ["CS", "EC", "EE", "ME", "CE", "IN", "PI", "CH", "BT", "MT", "XE", "XL", "TF", "PE", "EY", "MA", "AR", "AG", "GG", "PH"] as const;
  return branches.map((code) => {
    const questions = getStaticQuestionsForBranch(code);
    const years = questions.map((q) => q.year);
    return {
      branchCode: code,
      questionCount: questions.length,
      yearMin: years.length ? Math.min(...years) : 2024,
      yearMax: years.length ? Math.max(...years) : 2024,
    };
  });
}
