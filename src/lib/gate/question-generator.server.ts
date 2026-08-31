/**
 * Server-side question generator that reads markdown files.
 *
 * This module uses `fs` — only import it in API routes and server components.
 * Client-side code should use `generateQuestionsFromSubjects` from the sibling file.
 */

import { parseBranchMarkdown } from "./markdown-parser";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { generateQuestionsFromSubjects, type SubjectInfo } from "./question-generator";

const MARKDOWN_DIR = join(process.cwd(), "..", "gate-pyq-analysis");

const PAPER_FILE_MAP: Record<string, string> = {
  cse: "01-GATE-CS.md", ece: "02-GATE-ECE.md", me: "03-GATE-ME.md",
  ee: "04-GATE-EE.md", civil: "05-GATE-CE.md", in: "06-GATE-IN.md",
  ch: "07-GATE-CH.md", bt: "08-GATE-BT.md", mt: "09-GATE-MT.md",
  pi: "10-GATE-PI.md", xe: "11-GATE-XE.md", xl: "12-GATE-XL.md",
  tf: "13-GATE-TF.md", pe: "14-GATE-PE.md", ey: "15-GATE-EY.md",
  ma: "16-GATE-MA.md", ar: "17-GATE-AR.md", ag: "18-GATE-AG.md",
  gg: "19-GATE-GG.md", ph: "20-GATE-PH.md",
};

/**
 * Load subjects for a paper from markdown intelligence.
 * Returns subjects with name, weightage, and topic info.
 */
export function loadSubjectsFromMarkdown(paperId: string): SubjectInfo[] {
  const mdFileName = PAPER_FILE_MAP[paperId];
  if (!mdFileName) return [];

  const mdPath = join(MARKDOWN_DIR, mdFileName);
  if (!existsSync(mdPath)) return [];

  const markdown = readFileSync(mdPath, "utf-8");
  const parsed = parseBranchMarkdown(paperId, markdown);
  if (!parsed || parsed.subjects.length === 0) return [];

  return parsed.subjects.map((s) => ({
    name: s.name,
    weightage: s.avgWeightage,
    topic: s.topics[0] || s.name,
  }));
}

/**
 * Generate practice questions for a branch (server-side).
 * Reads markdown if needed, then delegates to the pure client-side generator.
 */
export function generateQuestionsForBranch(paperId: string, count: number = 10, mode: string = "historical") {
  const subjects = loadSubjectsFromMarkdown(paperId);
  return generateQuestionsFromSubjects(paperId, subjects, count, mode);
}
