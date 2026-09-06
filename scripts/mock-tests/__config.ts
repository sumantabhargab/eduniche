/**
 * EduNeuro Premium Mock Test — Configuration
 *
 * Branch definitions, constants, and shared types.
 * Question data lives in generators.ts; PDF rendering lives in pdf-renderer.ts.
 */

import PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';

// ── Output Root ─────────────────────────────────────────────────────────────
export const ROOT = path.resolve(__dirname, '..', '..', 'premium_mock_tests');

// ── Branch Configuration ────────────────────────────────────────────────────
export const BRANCHES = [
  { code: 'cse', name: 'Computer Science and Information Technology', short: 'CSE', examCode: 'CS', totalMarks: 100, duration: 180 },
  { code: 'ece', name: 'Electronics and Communication Engineering', short: 'ECE', examCode: 'EC', totalMarks: 100, duration: 180 },
  { code: 'me', name: 'Mechanical Engineering', short: 'ME', examCode: 'ME', totalMarks: 100, duration: 180 },
  { code: 'civil', name: 'Civil Engineering', short: 'CE', examCode: 'CE', totalMarks: 100, duration: 180 },
  { code: 'ee', name: 'Electrical Engineering', short: 'EE', examCode: 'EE', totalMarks: 100, duration: 180 },
  { code: 'in', name: 'Instrumentation Engineering', short: 'IN', examCode: 'IN', totalMarks: 100, duration: 180 },
  { code: 'pi', name: 'Production and Industrial Engineering', short: 'PI', examCode: 'PI', totalMarks: 100, duration: 180 },
  { code: 'ch', name: 'Chemical Engineering', short: 'CH', examCode: 'CH', totalMarks: 100, duration: 180 },
  { code: 'bt', name: 'Biotechnology', short: 'BT', examCode: 'BT', totalMarks: 100, duration: 180 },
  { code: 'mt', name: 'Metallurgical Engineering', short: 'MT', examCode: 'MT', totalMarks: 100, duration: 180 },
  { code: 'xe', name: 'Engineering Sciences', short: 'XE', examCode: 'XE', totalMarks: 100, duration: 180 },
  { code: 'xl', name: 'Life Sciences', short: 'XL', examCode: 'XL', totalMarks: 100, duration: 180 },
  { code: 'tf', name: 'Textile Engineering', short: 'TF', examCode: 'TF', totalMarks: 100, duration: 180 },
  { code: 'pe', name: 'Petroleum Engineering', short: 'PE', examCode: 'PE', totalMarks: 100, duration: 180 },
  { code: 'ey', name: 'Ecology and Evolution', short: 'EY', examCode: 'EY', totalMarks: 100, duration: 180 },
  { code: 'ma', name: 'Mathematics', short: 'MA', examCode: 'MA', totalMarks: 100, duration: 180 },
  { code: 'ar', name: 'Architecture and Planning', short: 'AR', examCode: 'AR', totalMarks: 100, duration: 180 },
  { code: 'ag', name: 'Agricultural Engineering', short: 'AG', examCode: 'AG', totalMarks: 100, duration: 180 },
  { code: 'gg', name: 'Geology and Geophysics', short: 'GG', examCode: 'GG', totalMarks: 100, duration: 180 },
  { code: 'ph', name: 'Engineering Physics', short: 'PH', examCode: 'PH', totalMarks: 100, duration: 180 },
];

// ── Shared Types ─────────────────────────────────────────────────────────────
export type QuestionType = 'mcq' | 'msq' | 'nat';
export type Difficulty = 'easy' | 'moderate' | 'hard';

export interface Question {
  id: string;
  type: QuestionType;
  subject: string;
  topic: string;
  marks: number;
  difficulty: Difficulty;
  question: string;
  options?: string[];
  answer: string | string[];
  solution: string;
  year_ref?: string;
}

export interface PaperMetadata {
  platform: string;
  branch: string;
  branch_code: string;
  branch_name: string;
  mock_number: number;
  title: string;
  type: string;
  generation_basis: string;
  question_count: number;
  maximum_marks: number;
  duration_minutes: number;
  subjects: string[];
  difficulty_distribution: { easy: number; moderate: number; hard: number };
  created_at: string;
  created_for: string;
}

// ── PDF Page Constants ──────────────────────────────────────────────────────
export const PAGE_W = 595.28;
export const PAGE_H = 841.89;
export const MARGIN = 60;
export const CONTENT_W = PAGE_W - 2 * MARGIN;
