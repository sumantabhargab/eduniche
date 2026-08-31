/**
 * Parses GATE branch analysis markdown files into structured data.
 *
 * Reads markdown files from the gate-pyq-analysis directory and extracts:
 * - Topic weightage tables
 * - Priority classifications
 * - Subject groupings
 * - Exam pattern info
 */

import { PAPERS, getPaperById, type GATEPaper } from "@/lib/gate/config";

// ─── Parsed structures ───

export interface ParsedSubject {
  name: string;
  avgWeightage: number;
  yearData: { year: number; marks: number }[];
  priority: "high" | "medium" | "low";
  category: "must-master" | "important" | "scoring";
  topics: string[];
  difficultyBreakdown: { easy: number; moderate: number; difficult: number };
}

export interface ParsedBranch {
  paperId: string;
  paperCode: string;
  paperName: string;
  shortName: string;
  totalMarks: number;
  questionCount: number;
  examPattern: {
    totalQuestions: number;
    oneMarkMcq: { count: number; marks: number };
    oneMarkNat: { count: number; marks: number };
    twoMarkMcq: { count: number; marks: number };
    twoMarkMsq: { count: number; marks: number };
    twoMarkNat: { count: number; marks: number };
    threeMarkMcq: { count: number; marks: number };
  };
  engineeringMathMarks: { min: number; max: number; average: number };
  generalAptitudeMarks: number;
  subjects: ParsedSubject[];
  strategicTips: string[];
  // XE/XL specific: optional sections
  optionalSections?: { section: string; name: string; marks: number; compulsory: boolean }[];
}

// ─── Parser ───

export function parseBranchMarkdown(paperId: string, markdown: string): ParsedBranch | null {
  const paper = getPaperById(paperId);
  if (!paper) return null;

  const result: ParsedBranch = {
    paperId,
    paperCode: paper.code,
    paperName: paper.name,
    shortName: paper.shortName,
    totalMarks: 100,
    questionCount: 65,
    examPattern: {
      totalQuestions: 65,
      oneMarkMcq: { count: 10, marks: 10 },
      oneMarkNat: { count: 5, marks: 5 },
      twoMarkMcq: { count: 20, marks: 40 },
      twoMarkMsq: { count: 5, marks: 10 },
      twoMarkNat: { count: 10, marks: 20 },
      threeMarkMcq: { count: 5, marks: 15 },
    },
    engineeringMathMarks: { min: 10, max: 13, average: 11 },
    generalAptitudeMarks: 15,
    subjects: [],
    strategicTips: [],
  };

  // Detect XE/XL special structure
  if (paperId === "xe" || paperId === "xl") {
    result.optionalSections = [];
  }

  // Extract subject weightage table rows
  const subjects = extractSubjectTable(markdown, paperId);
  result.subjects = subjects;

  // Extract engineering math marks
  const engMathMatch = markdown.match(/\|\s*Engineering Mathematics\s*\|\s*(\d+)[–-]?(\d+)?\s*\|\s*(\d+)[–-]?(\d+)?%?\s*\|/);
  if (engMathMatch) {
    const min = parseInt(engMathMatch[1]);
    const max = engMathMatch[2] ? parseInt(engMathMatch[2]) : min;
    result.engineeringMathMarks = {
      min,
      max,
      average: Math.round((min + max) / 2),
    };
  }

  // Extract general aptitude marks
  const gaMatch = markdown.match(/\|\s*General Aptitude\s*\|\s*(\d+)\s*\|\s*(\d+)%\s*\|\s*(\d+)\s*\|/);
  if (gaMatch) {
    result.generalAptitudeMarks = parseInt(gaMatch[1]);
  }

  // Extract strategic tips
  const tipsSection = markdown.match(/## Strategic Preparation Tips\n([\s\S]*?)(?:\n---|\n## |\Z)/);
  if (tipsSection) {
    const tips = tipsSection[1]
      .split("\n")
      .filter((line) => line.trim().match(/^\d+\./))
      .map((line) => line.replace(/^\d+\.\s*/, "").trim())
      .filter(Boolean);
    result.strategicTips = tips;
  }

  // Extract XE/XL optional sections
  if (paperId === "xe" || paperId === "xl") {
    const sectionRegex = /\|\s*\*\*([A-Z])\*\*\s*\|\s*([^|]+?)\s*\|\s*(Compulsory|Optional)\s*\|\s*~?(\d+)\s*\|/g;
    let match;
    while ((match = sectionRegex.exec(markdown)) !== null) {
      result.optionalSections?.push({
        section: match[1],
        name: match[2].trim(),
        marks: parseInt(match[3]),
        compulsory: match[4] === "Compulsory",
      });
    }
  }

  return result;
}

function extractSubjectTable(markdown: string, paperId: string): ParsedSubject[] {
  const subjects: ParsedSubject[] = [];
  const lines = markdown.split("\n");

  // Find the topic weightage table
  let inTable = false;
  let tableHeaderFound = false;
  let engMathRow = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip engineering math row — it's not a core subject
    if (line.includes("Engineering Mathematics") && line.includes("|")) {
      engMathRow = true;
      continue;
    }
    if (engMathRow) {
      engMathRow = false;
      continue;
    }

    // Skip general aptitude row
    if (line.includes("General Aptitude") && line.includes("|")) {
      continue;
    }

    // Detect table header
    if (line.includes("Subject/Topic") || line.includes("2024 Marks")) {
      inTable = true;
      tableHeaderFound = true;
      continue;
    }

    // Skip separator rows
    if (inTable && /^\|[\s\-:|]+\|$/.test(line)) {
      continue;
    }

    // Parse table rows
    if (inTable && line.startsWith("|")) {
      const cells = line.split("|").filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
      // Markdown tables have a # column as the first data column; skip it
      const dataStart = cells.length > 0 && cells[0].trim().match(/^\d+$/) ? 1 : 0;
      if (cells.length - dataStart >= 4) {
        // Strip markdown emphasis markers like **, *, _, ~~
        const name = cells[dataStart].trim().replace(/\*\*?|_|~~|`/g, "");
        if (!name) continue;

        const marks2024 = parseFloat(cells[dataStart + 1].trim()) || 0;
        const marks2023 = parseFloat(cells[dataStart + 2].trim()) || 0;
        const marks2022 = parseFloat(cells[dataStart + 3].trim()) || 0;
        const avgWeightage = parseFloat(cells[dataStart + 4]?.trim().replace("%", "")) || 0;

        // Extract year data
        const yearData = [
          { year: 2024, marks: marks2024 },
          { year: 2023, marks: marks2023 },
          { year: 2022, marks: marks2022 },
        ];

        // Classify priority based on weightage
        let priority: "high" | "medium" | "low" = "low";
        let category: "must-master" | "important" | "scoring" = "scoring";
        if (avgWeightage >= 8) {
          priority = "high";
          category = "must-master";
        } else if (avgWeightage >= 5) {
          priority = "medium";
          category = "important";
        }

        // Extract topics from High Priority section — simplified
        const topics = [name];

        subjects.push({
          name,
          avgWeightage,
          yearData,
          priority,
          category,
          topics,
          difficultyBreakdown: { easy: 34, moderate: 51, difficult: 15 },
        });
      }
    }

    // End of table
    if (inTable && !line.startsWith("|") && tableHeaderFound) {
      inTable = false;
    }
  }

  return subjects;
}

// ─── In-memory cache ───

const branchCache = new Map<string, ParsedBranch>();

export function getParsedBranch(paperId: string): ParsedBranch | null {
  if (branchCache.has(paperId)) {
    return branchCache.get(paperId)!;
  }
  return null;
}

export function cacheParsedBranch(branch: ParsedBranch): void {
  branchCache.set(branch.paperId, branch);
}

export function getAllParsedBranches(): ParsedBranch[] {
  return Array.from(branchCache.values());
}
