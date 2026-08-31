/**
 * Client-side data loading for GATE paper pages.
 *
 * Provides data for ALL 20 branches — uses real question banks for CSE/ECE
 * and synthesizes from markdown for others, fetched via API.
 *
 * This module does NOT import 'fs' — it only fetches from the API.
 */

import { getPaperDataSource } from "./paper-data";

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

export interface RawSubject {
  id: string;
  name: string;
  topic?: string;
  totalQuestions: number;
  totalMarks: number;
  yearlyData: { year: number; count: number; marks: number }[];
  questionTypes: Record<string, number>;
}

export interface PaperData {
  paper: {
    id: string;
    code: string;
    name: string;
    shortName: string;
    availableYears: number[];
    questionCount: number;
    subjectCount: number;
  };
  rawData: RawSubject[];
  allYears: number[];
  questions: Question[];
}

const DATA_CACHE = new Map<string, { data: PaperData; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function fetchPaperData(paperId: string): Promise<PaperData> {
  // Check cache
  const cached = DATA_CACHE.get(paperId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  let data: PaperData;

  // Try API first (for all 20 branches)
  try {
    const res = await fetch(`/api/gate/papers/${paperId}`);
    if (res.ok) {
      const apiData = await res.json();
      data = {
        paper: apiData.paper,
        rawData: apiData.subjects || [],
        allYears: apiData.allYears || [],
        questions: apiData.questions || [],
      };
    } else {
      data = fetchStaticPaperData(paperId);
    }
  } catch {
    data = fetchStaticPaperData(paperId);
  }

  DATA_CACHE.set(paperId, { data, timestamp: Date.now() });
  return data;
}

export function getCachedPaperData(paperId: string): PaperData | null {
  const cached = DATA_CACHE.get(paperId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
}

/**
 * Static fallback for when API is unavailable.
 * CSE and ECE have built-in question banks; other branches have empty question lists.
 */
function fetchStaticPaperData(paperId: string): PaperData {
  const src = getPaperDataSource(paperId);
  if (src) {
    return {
      paper: {
        id: paperId,
        code: src.paper.code,
        name: src.paper.name,
        shortName: src.paper.shortName,
        availableYears: src.allYears,
        questionCount: src.questions.length,
        subjectCount: src.rawData.filter(Boolean).length,
      },
      rawData: src.rawData,
      allYears: src.allYears,
      questions: src.questions,
    };
  }
  // Unknown branch — empty fallback
  return {
    paper: {
      id: paperId,
      code: paperId.toUpperCase(),
      name: paperId.toUpperCase(),
      shortName: paperId.toUpperCase(),
      availableYears: [],
      questionCount: 0,
      subjectCount: 0,
    },
    rawData: [],
    allYears: [],
    questions: [],
  };
}
