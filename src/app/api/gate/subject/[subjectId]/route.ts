import { NextRequest, NextResponse } from "next/server";
import { getPaperById } from "@/lib/gate/config";
import { getPaperRawData } from "@/lib/gate/paper-data";
import { computeTrend } from "@/lib/analytics/trends";
import { computePriority } from "@/lib/analytics/priority";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ subjectId: string }> }
) {
  const { subjectId } = await params;
  const url = new URL(request.url);
  const paperId = url.searchParams.get("paperId") || "cse";

  try {
    // Infer paper from subject ID prefix
    let paperId = "cse";
    if (subjectId.startsWith("ece-")) {
      paperId = "ece";
    } else if (subjectId.startsWith("cset-")) {
      paperId = "cse";
    }

    const paper = getPaperById(paperId);
    const rawData = getPaperRawData(paperId).find((s) => s.id === subjectId);

    if (!rawData) {
      return NextResponse.json({ error: "Subject not found." }, { status: 404 });
    }

    const name = rawData.name;
    const topic = rawData.topic || "";
    const totalQuestions = rawData.totalQuestions;
    const totalMarks = rawData.totalMarks;
    const yearlyData = rawData.yearlyData;
    const questionTypes = rawData.questionTypes || {};

    // Compute trend if we have data
    let trend = null;
    let priority = null;
    const allYears = paper?.availableYears || [];
    if (yearlyData.length > 0) {
      trend = computeTrend(yearlyData, allYears);
      priority = computePriority({
        yearlyOccurrences: yearlyData,
        allAvailableYears: allYears,
      });
    }

    // Get peer topics (same topic group)
    const rawDataAll = getPaperRawData(paperId);
    const subtopics = rawDataAll
      .filter((s) => s.topic && s.topic === rawData.topic && s.id !== subjectId)
      .map((s) => ({
        id: s.id,
        name: s.name,
        totalQuestions: s.totalQuestions,
        totalMarks: s.totalMarks,
      }));

    return NextResponse.json({
      id: subjectId,
      name,
      topic,
      totalQuestions,
      totalMarks,
      questionTypes,
      yearlyData,
      trend,
      priority,
      children: [],
      subtopics,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to load subject." },
      { status: 500 }
    );
  }
}
