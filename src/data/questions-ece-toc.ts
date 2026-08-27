/**
 * GATE ECE — Unified question bank (all subjects)
 *
 * Aggregates questions from all ECE subject files into a single
 * array, mirroring the CSE `questions-cse-toc.ts` interface.
 */

import { ECE_NETWORK_QUESTIONS } from "./questions-ece-networks";
import { ECE_SS_QUESTIONS } from "./questions-ece-signals";
import { ECE_CONTROL_QUESTIONS } from "./questions-ece-control";
import { ECE_DIGITAL_QUESTIONS } from "./questions-ece-digital";
import { ECE_ANALOG_QUESTIONS } from "./questions-ece-analog";
import { ECE_COMM_QUESTIONS } from "./questions-ece-communication";
import { ECE_EM_QUESTIONS } from "./questions-ece-em";
import { ECE_DEVICES_QUESTIONS } from "./questions-ece-devices";
import { ECE_MATH_QUESTIONS } from "./questions-ece-math";
import { ECE_APTITUDE_QUESTIONS } from "./questions-ece-aptitude";

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

export const ECE_TOC_QUESTIONS: Question[] = [
  ...ECE_NETWORK_QUESTIONS,
  ...ECE_SS_QUESTIONS,
  ...ECE_CONTROL_QUESTIONS,
  ...ECE_DIGITAL_QUESTIONS,
  ...ECE_ANALOG_QUESTIONS,
  ...ECE_COMM_QUESTIONS,
  ...ECE_EM_QUESTIONS,
  ...ECE_DEVICES_QUESTIONS,
  ...ECE_MATH_QUESTIONS,
  ...ECE_APTITUDE_QUESTIONS,
];
