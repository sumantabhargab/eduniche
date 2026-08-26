import { NextResponse } from "next/server";
import {
  TOC_RAW_DATA,
  ALL_AVAILABLE_YEARS,
} from "@/data/gate-cse-analysis";
import {
  GATE_CSE_SYLLABUS,
  getChildren,
  GATE_CSE_NODE_MAP,
} from "@/data/gate-cse-syllabus";
import { computeTrend } from "@/lib/analytics/trends";
import { computePriority } from "@/lib/analytics/priority";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ subjectId: string }> }
) {
  const { subjectId } = await params;

  try {
    // First check if it's a raw data topic (FA, CFL, TM, etc.)
    const rawData = TOC_RAW_DATA.find((s) => s.id === subjectId);
    const node = GATE_CSE_NODE_MAP.get(subjectId);

    if (!rawData && !node) {
      return NextResponse.json({ error: "Subject not found." }, { status: 404 });
    }

    const name = rawData?.name ?? node?.name ?? subjectId;
    const topic = rawData?.topic ?? node?.name ?? "";
    const totalQuestions = rawData?.totalQuestions ?? 0;
    const totalMarks = rawData?.totalMarks ?? 0;
    const yearlyData = rawData?.yearlyData ?? [];
    const questionTypes = rawData?.questionTypes ?? {};

    // Compute trend if we have data
    let trend = null;
    let priority = null;
    if (yearlyData.length > 0) {
      trend = computeTrend(yearlyData, ALL_AVAILABLE_YEARS);
      priority = computePriority({ yearlyOccurrences: yearlyData, allAvailableYears: ALL_AVAILABLE_YEARS });
    }

    // Get children (subtopics)
    const children = getChildren(subjectId, GATE_CSE_NODE_MAP, require("@/data/gate-cse-syllabus").GATE_CSE_CHILDREN_MAP);

    // For raw data items, also include peer topics under the same parent
    const subtopics = rawData
      ? TOC_RAW_DATA.filter((s) => s.topic === rawData.topic)
      : [];

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
      children: children.map((c) => ({
        id: c.id,
        name: c.name,
        nodeType: c.nodeType,
        description: c.description,
      })),
      subtopics: subtopics.map((s) => ({
        id: s.id,
        name: s.name,
        totalQuestions: s.totalQuestions,
        totalMarks: s.totalMarks,
      })),
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to load subject." },
      { status: 500 }
    );
  }
}
