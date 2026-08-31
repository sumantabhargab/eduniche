/**
 * GET /api/gate/papers/[paperId]/data
 * Returns raw data and questions for a specific paper.
 *
 * For branches with question banks (cse, ece), returns real data.
 * For others, constructs synthetic data from parsed markdown files.
 */

import { NextResponse } from "next/server";
import { getPaperById } from "@/lib/gate/config";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { parseBranchMarkdown } from "@/lib/gate/markdown-parser";

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

// Import real data sources (server-side only)
import { TOC_QUESTIONS as CSE_QUESTIONS } from "@/data/questions-cse-toc";
import { TOC_RAW_DATA as CSE_RAW_DATA, ALL_AVAILABLE_YEARS as CSE_YEARS } from "@/data/gate-cse-analysis";

import { ECE_TOC_QUESTIONS, type Question as ECEQuestion } from "@/data/questions-ece-toc";
import { ECE_RAW_DATA, ALL_AVAILABLE_YEARS as ECE_YEARS, getSubjectRawData } from "@/data/ece-analysis";

export const dynamic = "force-dynamic";

interface RawSubject {
  id: string;
  name: string;
  topic?: string;
  totalQuestions: number;
  totalMarks: number;
  yearlyData: { year: number; count: number; marks: number }[];
  questionTypes: Record<string, number>;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ paperId: string }> }
) {
  try {
    const { paperId } = await params;
    const paper = getPaperById(paperId);

    if (!paper || paper.processingStatus !== "available") {
      return NextResponse.json({ error: "Paper not available." }, { status: 404 });
    }

    switch (paperId) {
      case "cse": {
        return NextResponse.json({
          paper: {
            id: paper.id,
            code: paper.code,
            name: paper.name,
            shortName: paper.shortName,
            availableYears: paper.availableYears,
            questionCount: paper.questionCount,
            subjectCount: paper.subjectCount,
          },
          rawData: CSE_RAW_DATA,
          allYears: CSE_YEARS,
          questions: CSE_QUESTIONS,
        });
      }

      case "ece": {
        return NextResponse.json({
          paper: {
            id: paper.id,
            code: paper.code,
            name: paper.name,
            shortName: paper.shortName,
            availableYears: paper.availableYears,
            questionCount: paper.questionCount,
            subjectCount: paper.subjectCount,
          },
          rawData: ECE_RAW_DATA,
          allYears: ECE_YEARS,
          questions: ECE_TOC_QUESTIONS,
        });
      }

      default: {
        // Synthesize from markdown
        const mdFileName = PAPER_FILE_MAP[paperId];
        if (!mdFileName) {
          return NextResponse.json({
            paper: {
              id: paper.id,
              code: paper.code,
              name: paper.name,
              shortName: paper.shortName,
              availableYears: paper.availableYears,
              questionCount: paper.questionCount,
              subjectCount: paper.subjectCount,
            },
            rawData: [],
            allYears: paper.availableYears,
            questions: [],
          });
        }

        const mdPath = join(MARKDOWN_DIR, mdFileName);
        if (!existsSync(mdPath)) {
          console.warn(`Markdown file not found: ${mdPath}`);
          return NextResponse.json({
            paper: {
              id: paper.id,
              code: paper.code,
              name: paper.name,
              shortName: paper.shortName,
              availableYears: paper.availableYears,
              questionCount: paper.questionCount,
              subjectCount: paper.subjectCount,
            },
            rawData: [],
            allYears: paper.availableYears,
            questions: [],
          });
        }

        const markdown = readFileSync(mdPath, "utf-8");
        const parsed = parseBranchMarkdown(paperId, markdown);

        if (!parsed) {
          return NextResponse.json({
            paper: {
              id: paper.id,
              code: paper.code,
              name: paper.name,
              shortName: paper.shortName,
              availableYears: paper.availableYears,
              questionCount: paper.questionCount,
              subjectCount: paper.subjectCount,
            },
            rawData: [],
            allYears: paper.availableYears,
            questions: [],
          });
        }

        const rawData: RawSubject[] = parsed.subjects.map((s, idx) => ({
          id: s.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `subject-${idx}`,
          name: s.name,
          topic: undefined,
          totalQuestions: Math.round(s.yearData.reduce((sum, y) => sum + y.marks / 2, 0)),
          totalMarks: s.yearData[s.yearData.length - 1]?.marks ?? Math.round(s.avgWeightage * 1.5),
          yearlyData: s.yearData.map((y) => ({
            year: y.year,
            count: Math.round(y.marks / 2),
            marks: y.marks,
          })),
          questionTypes: { mcq: 60, msq: 15, nat: 25 },
        }));

        const allYears = paper.availableYears.length
          ? paper.availableYears
          : Array.from(new Set(parsed.subjects.flatMap((s) => s.yearData.map((y) => y.year)))).sort();

        return NextResponse.json({
          paper: {
            id: paper.id,
            code: paper.code,
            name: paper.name,
            shortName: paper.shortName,
            availableYears: paper.availableYears,
            questionCount: paper.questionCount,
            subjectCount: paper.subjectCount,
          },
          rawData,
          allYears,
          questions: [],
        });
      }
    }
  } catch (e) {
    console.error("Paper data error:", e);
    return NextResponse.json({ error: "Failed to load paper data." }, { status: 500 });
  }
}
