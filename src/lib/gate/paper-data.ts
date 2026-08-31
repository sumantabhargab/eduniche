/**
 * Paper-level data dispatcher.
 *
 * Maps `paperId` to the correct data imports so gate pages can be
 * paper-agnostic. For branches with real question banks (CSE, ECE),
 * returns the actual data. For all others, returns null — client
 * components should use the API endpoint instead.
 */

import { PAPERS, type GATEPaper } from "@/lib/gate/config";

// CSE
import { TOC_QUESTIONS as CSE_QUESTIONS } from "@/data/questions-cse-toc";
import { TOC_RAW_DATA as CSE_RAW_DATA, ALL_AVAILABLE_YEARS as CSE_YEARS } from "@/data/gate-cse-analysis";

// ECE
import { ECE_TOC_QUESTIONS, type Question as ECEQuestion } from "@/data/questions-ece-toc";
import {
  ECE_RAW_DATA,
  ALL_AVAILABLE_YEARS as ECE_YEARS,
  getSubjectRawData,
  getQuestionsForSubject,
  getTopicsForSubject,
} from "@/data/ece-analysis";

export interface PaperDataSource {
  paper: GATEPaper;
  questions: ECEQuestion[];
  rawData: {
    id: string;
    name: string;
    topic?: string;
    totalQuestions: number;
    totalMarks: number;
    yearlyData: { year: number; count: number; marks: number }[];
    questionTypes: Record<string, number>;
  }[];
  allYears: number[];
  getSubjectQuestions: (subjectId: string) => ECEQuestion[];
  getSubjectTopics: (subjectId: string) => string[];
}

export function getPaperDataSource(paperId: string): PaperDataSource | null {
  const paper = PAPERS.find((p) => p.id === paperId);
  if (!paper || paper.processingStatus !== "available") return null;

  switch (paperId) {
    case "cse":
      return {
        paper,
        questions: CSE_QUESTIONS as unknown as ECEQuestion[],
        rawData: CSE_RAW_DATA as PaperDataSource["rawData"],
        allYears: CSE_YEARS,
        getSubjectQuestions: () => [],
        getSubjectTopics: () => [],
      };

    case "ece":
      return {
        paper,
        questions: ECE_TOC_QUESTIONS,
        rawData: ECE_RAW_DATA,
        allYears: ECE_YEARS,
        getSubjectQuestions: getQuestionsForSubject,
        getSubjectTopics: getTopicsForSubject,
      };

    default:
      return null;
  }
}

export function getPaperQuestions(paperId: string): ECEQuestion[] {
  const src = getPaperDataSource(paperId);
  return src ? src.questions : [];
}

export function getPaperRawData(paperId: string): PaperDataSource["rawData"] {
  const src = getPaperDataSource(paperId);
  return src ? src.rawData : [];
}

export function getPaperYears(paperId: string): number[] {
  const src = getPaperDataSource(paperId);
  return src ? src.allYears : [];
}
