/**
 * GATE ECE — Pre-computed analysis data derived from question banks.
 *
 * Provides subject-level marks distribution, yearly data, and question
 * type breakdowns for the ECE dashboard, subject intelligence page,
 * and question browser.
 *
 * Paper coverage: GATE ECE 2007–2026
 * Last updated: 2026-08-27
 */

import { ECE_ALL_QUESTIONS, ECE_SUBJECTS } from "./ece-data";

// ─── All available GATE ECE years ───
export const ALL_AVAILABLE_YEARS = [
  2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016,
  2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026,
];

// ─── Subject-level raw data (mirrors CSE's RawSubtopicData) ───
export interface SubjectRawData {
  id: string;
  name: string;
  topic?: string;
  totalQuestions: number;
  totalMarks: number;
  yearlyData: { year: number; count: number; marks: number }[];
  questionTypes: Record<string, number>;
}

function computeSubjectRawData(): SubjectRawData[] {
  return ECE_SUBJECTS.map((subject) => {
    const questions = ECE_ALL_QUESTIONS.filter((q) => q.subjectId === subject.id);

    const totalQuestions = questions.length;
    const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);

    // Yearly data
    const yearMap = new Map<number, { count: number; marks: number }>();
    questions.forEach((q) => {
      const existing = yearMap.get(q.year) || { count: 0, marks: 0 };
      yearMap.set(q.year, { count: existing.count + 1, marks: existing.marks + q.marks });
    });
    const yearlyData = ALL_AVAILABLE_YEARS.map((year) => {
      const entry = yearMap.get(year);
      return { year, count: entry?.count || 0, marks: entry?.marks || 0 };
    });

    // Question type counts
    const questionTypes: Record<string, number> = {};
    questions.forEach((q) => {
      const key = q.type.toLowerCase();
      questionTypes[key] = (questionTypes[key] || 0) + 1;
    });

    return {
      id: subject.id,
      name: subject.name,
      topic: subject.topics[0] || undefined,
      totalQuestions,
      totalMarks,
      yearlyData,
      questionTypes,
    };
  });
}

export const ECE_RAW_DATA: SubjectRawData[] = computeSubjectRawData();

// Alias for compatibility with existing imports
export const TOC_RAW_DATA = ECE_RAW_DATA;

// ─── Quick stats ───
export const ECE_TOTAL_QUESTIONS = ECE_ALL_QUESTIONS.length;
export const ECE_TOTAL_MARKS = ECE_RAW_DATA.reduce((s, x) => s + x.totalMarks, 0);
export const ECE_YEAR_RANGE = `${Math.min(...ECE_ALL_QUESTIONS.map(q => q.year))}–${Math.max(...ECE_ALL_QUESTIONS.map(q => q.year))}`;
export const ECE_QUESTION_TYPES = {
  mcq: ECE_ALL_QUESTIONS.filter(q => q.type === "MCQ").length,
  msq: ECE_ALL_QUESTIONS.filter(q => q.type === "MSQ").length,
  nat: ECE_ALL_QUESTIONS.filter(q => q.type === "NAT").length,
};

// ─── Helpers ───

export function getSubjectRawData(subjectId: string): SubjectRawData | undefined {
  return ECE_RAW_DATA.find((s) => s.id === subjectId);
}

export function getQuestionsForSubject(subjectId: string): typeof ECE_ALL_QUESTIONS {
  return ECE_ALL_QUESTIONS.filter((q) => q.subjectId === subjectId);
}

export function getTopicsForSubject(subjectId: string): string[] {
  const questions = getQuestionsForSubject(subjectId);
  return [...new Set(questions.map((q) => q.topic))];
}
