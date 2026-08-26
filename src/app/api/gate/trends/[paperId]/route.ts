import { NextResponse } from "next/server";
import { TOC_RAW_DATA, TOC_TOTAL_MARKS_BY_YEAR } from "@/data/gate-cse-analysis";
import { getPaperById } from "@/lib/gate/config";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ paperId: string }> }
) {
  const { paperId } = await params;
  try {
    const paper = getPaperById(paperId);
    if (!paper || paper.processingStatus !== "available") {
      return NextResponse.json({ error: "Paper not available." }, { status: 404 });
    }

    // Overall paper marks trend
    const overallTrend = TOC_TOTAL_MARKS_BY_YEAR.map((y) => ({
      year: y.year,
      totalMarks: y.totalMarks,
    }));

    // Per-subject trends
    const subjectTrends = TOC_RAW_DATA.map((raw) => ({
      id: raw.id,
      name: raw.name,
      yearlyData: raw.yearlyData.map((d) => ({
        year: d.year,
        count: d.count,
        marks: d.marks,
      })),
    }));

    // Marks distribution by question type
    const questionTypeDistribution = {
      mcq: { count: 185, marks: 275 },
      msq: { count: 80, marks: 120 },
      nat: { count: 75, marks: 140 },
    };

    return NextResponse.json({
      paperId,
      paperName: paper.name,
      overallTrend,
      subjectTrends,
      questionTypeDistribution,
      yearsAvailable: [
        2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013,
        2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023,
        2024, 2025, 2026,
      ],
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to load trends." },
      { status: 500 }
    );
  }
}
