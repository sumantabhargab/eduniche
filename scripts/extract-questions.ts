/**
 * GATE PYQ Text Extractor — improved parser
 *
 * Handles:
 * - Form feeds between pages
 * - "Computer Science and Information Technology Set 1 (CS1)" headers
 * - Q.N boundary detection
 * - GA vs Branch section detection
 * - Marks detection from "Carry ONE/TWO mark(s)" markers
 * - MCQ/MSQ/NAT classification
 * - Option extraction with cleanup
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

const BRANCH_CONFIG: Record<string, { name: string; papers: { year: number; id: string; session: string }[] }> = {
  CS: {
    name: "Computer Science and IT",
    papers: [
      { year: 2025, id: "CS12025", session: "1" },
      { year: 2025, id: "CS22025", session: "2" },
      { year: 2024, id: "CS124S5", session: "1" },
      { year: 2024, id: "CS224S6", session: "2" },
      { year: 2023, id: "cs_2023", session: "1" },
      { year: 2022, id: "cs_2022", session: "1" },
      { year: 2021, id: "cs_2021", session: "1" },
      { year: 2020, id: "cs_2020", session: "1" },
      { year: 2019, id: "cs_2019", session: "1" },
    ],
  },
};

interface Question {
  question_number: number;
  section: string;
  marks: number;
  question_type: string;
  question_text: string;
  options: string[] | null;
  branch: string;
  year: number;
  session: string;
  answer: string | null;
  source_text: string; // keep raw for debugging
}

/**
 * Extract questions from raw pdftotext output
 */
function extractQuestions(rawText: string, branch: string, year: number, session: string): Question[] {
  // Detect branch from header if present
  const headerMatch = rawText.match(/(Computer Science|Electronics|Electrical|Mechanical|Civil)[\s\S]*?Set\s*\d+\s*\(([^)]+)\)/i);
  const detectedSession = headerMatch ? headerMatch[2] : session;

  // Use pdftotext with -nopgbrk -layout for clean extraction
  // Remove headers/footers that repeat on each page
  const normalized = rawText
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/Organizing\s+Institute:[^\n]*\n?/g, "")
    .replace(/Computer\s+Science\s+and\s+Information\s+Technology\s+Set\s*\d+\s*\([^)]+\)\n?/gi, "")
    .replace(/Page\s+\d+\s+of\s+\d+\n?/gi, "")
    .replace(/General\s+Aptitude\s*\(GA\)\n?/gi, "")
    .replace(/Q\.\s*\d+\s*[–\-]\s*Q\.\s*\d+\s+Carry\s+(?:ONE|TWO)\s+marks?\s+Each\s*\n?/gi, "META_HEADER\n")
    .replace(/^\s+$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  // Split on Q.N pattern at start of line (with optional indentation)
  // Exclude range headers like "Q.1 – Q.5 Carry ONE mark Each"
  const parts = normalized.split(/\n(?=\s*Q\.\s*\d+\s)/);
  const questions: Question[] = [];

  // Track GA vs Branch section
  let currentSection = branch;
  let inGA = false;
  let currentMarks = 1;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i].trim();
    if (!part) continue;

    // Match Q.N
    const qMatch = part.match(/^Q\.\s*(\d+)\s*([:\s])/);
    if (!qMatch) continue;

    const qNum = parseInt(qMatch[1]);
    if (isNaN(qNum) || qNum < 1) continue;

    // Skip range header fragments like "Q.1 – Q.5"
    if (part.match(/^Q\.\s*\d+\s*[–\-]/)) continue;
    // Skip phantom fragments that are too short to be real questions
    if (part.length < 50 && !part.includes("(A)") && !part.includes("____")) continue;

    // Detect marks — look ahead for "Carry ONE/TWO marks" in this question
    const partLower = part.toLowerCase();
    const twoMarkMatch = partLower.match(/carry\s+two\s+marks/);
    const oneMarkMatch = partLower.match(/carry\s+one\s+mark/);
    currentMarks = twoMarkMatch ? 2 : (oneMarkMatch ? 1 : currentMarks);

    // Detect section
    const gaIndicator = part.match(/general\s+aptitude|GA\)/i);
    if (gaIndicator) {
      currentSection = "GA";
      inGA = true;
    } else if (part.match(/(Computer Science|Electronics|Electrical|Mechanical|Civil|Instrumentation|Chemical|Production)/i)) {
      // If we see a branch header, switch back
      const branchHeader = part.match(/(Computer Science|Electronics and Communication|Electrical Engineering|Mechanical Engineering|Civil Engineering)/i);
      if (branchHeader) {
        currentSection = branch;
        inGA = false;
      }
    }
    // Once we're past Q.5, GA is over (GA is always Q.1-Q.5)
    if (inGA && qNum > 5) {
      currentSection = branch;
      inGA = false;
    }

    // Extract the question text — everything up to options
    // Options start with (A) at the beginning of a line
    const textAndOptions = part.replace(/^Q\.\s*\d+[\s:]*/, "");

    // Split text from options
    const optionStart = textAndOptions.search(/\n\([A-D]\)/);
    let textOnly: string;
    let optionsBlock: string | null = null;

    if (optionStart > 0) {
      textOnly = textAndOptions.substring(0, optionStart);
      optionsBlock = textAndOptions.substring(optionStart + 1);
    } else {
      textOnly = textAndOptions;
      optionsBlock = null;
    }

    // Clean up text
    textOnly = textOnly
      .replace(/Carry\s+(?:ONE|TWO)\s+marks?\s*(?:Each)?\s*/gi, "")
      .replace(/\(GA\)/gi, "")
      .replace(/\(CS\d*\)/gi, "")
      .replace(/Organizing\s+Institute:.*$/gm, "")
      .replace(/Page\s+\d+\s+of\s+\d+/gi, "")
      .replace(/Set\s*\d+\s*\([^)]+\)/gi, "")
      .replace(/\r/g, "")
      .replace(/\s+/g, " ")
      .trim();

    // Extract options
    let options: string[] | null = null;
    if (optionsBlock) {
      options = [];
      const optRegex = /^\(([A-D])\)\s*(.+?)(?=\n\([A-D]\)|$)/gs;
      let m;
      while ((m = optRegex.exec(optionsBlock)) !== null) {
        const optText = m[2]
          .replace(/Organizing\s+Institute:.*$/gm, "")
          .replace(/Page\s+\d+\s+of\s+\d+/gi, "")
          .replace(/Set\s*\d+\s*\([^)]+\)/gi, "")
          .replace(/\s+/g, " ")
          .trim();
        if (optText) options.push(optText);
      }
      if (options.length === 0) options = null;
    }

    // Detect question type
    let qType = "MCQ";
    const hasMultipleCorrect = partLower.match(/(?:one or more|multiple).*(?:correct|answer)/i);
    const isNAT = !options && /\b\d+\b/.test(textOnly) && !partLower.match(/\(A\).*\(B\)/);
    if (hasMultipleCorrect) qType = "MSQ";
    else if (isNAT && qNum > 5) qType = "NAT"; // NAT questions after Q.5 are usually numerical

    if (textOnly.length < 5) continue;

    questions.push({
      question_number: qNum,
      section: currentSection,
      marks: currentMarks,
      question_type: qType,
      question_text: textOnly,
      options,
      branch,
      year,
      session: detectedSession,
      answer: null,
      source_text: part.substring(0, 500),
    });
  }

  return questions;
}

// ─── Simple standalone test ─────────────────────────────────────────────────

const testFile = process.argv[2];
if (testFile) {
  const text = readFileSync(testFile, "utf-8");
  const qs = extractQuestions(text, "CS", 2024, "1");
  console.log(`Extracted ${qs.length} questions`);
  for (const q of qs.slice(0, 5)) {
    console.log(`\nQ${q.question_number} [${q.section}] ${q.marks}m ${q.question_type}`);
    console.log(`  Text: ${q.question_text.substring(0, 100)}...`);
    console.log(`  Options: ${q.options ? q.options.length : "none"}`);
    if (q.options) q.options.forEach((o, i) => console.log(`    (${String.fromCharCode(65+i)}) ${o.substring(0, 60)}`));
  }
  // Save all
  writeFileSync("tmp/gate-extracted/test_output.json", JSON.stringify(qs, null, 2));
  console.log(`\nSaved to tmp/gate-extracted/test_output.json`);
} else {
  console.log("Usage: tsx extract-questions.ts <txt-file>");
}
