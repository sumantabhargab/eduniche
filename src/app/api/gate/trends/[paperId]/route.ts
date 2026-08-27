import { NextResponse } from "next/server";
import { getPaperById } from "@/lib/gate/config";
import { getPaperRawData, getPaperQuestions } from "@/lib/gate/paper-data";
import { getPaperYears } from "@/lib/gate/paper-data";

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

    const rawData = getPaperRawData(paperId);
    const allQuestions = getPaperQuestions(paperId);
    const allYears = getPaperYears(paperId);

    // Overall paper marks trend per year
    const overallTrend = allYears.map((year) => {
      const yearMarks = allQuestions
        .filter((q) => q.year === year)
        .reduce((sum, q) => sum + q.marks, 0);
      return { year, totalMarks: yearMarks };
    });

    // Per-subject trends
    const subjectTrends = rawData.map((raw) => ({
      id: raw.id,
      name: raw.name,
      yearlyData: raw.yearlyData.map((d) => ({
        year: d.year,
        count: d.count,
        marks: d.marks,
      })),
    }));

    // Marks distribution by question type
    const mcqCount = allQuestions.filter((q) => q.type === "MCQ").length;
    const msqCount = allQuestions.filter((q) => q.type === "MSQ").length;
    const natCount = allQuestions.filter((q) => q.type === "NAT").length;
    const mcqMarks = allQuestions.filter((q) => q.type === "MCQ").reduce((s, q) => s + q.marks, 0);
    const msqMarks = allQuestions.filter((q) => q.type === "MSQ").reduce((s, q) => s + q.marks, 0);
    const natMarks = allQuestions.filter((q) => q.type === "NAT").reduce((s, q) => s + q.marks, 0);

    return NextResponse.json({
      paperId,
      paperName: paper.name,
      overallTrend,
      subjectTrends,
      questionTypeDistribution: {
        mcq: { count: mcqCount, marks: mcqMarks },
        msq: { count: msqCount, marks: msqMarks },
        nat: { count: natCount, marks: natMarks },
      },
      yearsAvailable: allYears,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to load trends." },
      { status: 500 }
    );
  }
}
