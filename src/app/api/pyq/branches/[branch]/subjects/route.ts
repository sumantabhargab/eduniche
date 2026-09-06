/**
 * GET /api/pyq/branches/[branch]/subjects
 *
 * Returns subjects for a specific branch with topic counts.
 */

import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(request: Request, { params }: { params: Promise<{ branch: string }> }) {
  try {
    const branchCode = (await params).branch.toUpperCase();

    const supabase = await createServiceClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    }

    // Get subjects with question counts from the pyq_questions table
    const { data: questions, error } = await supabase
      .from("pyq_questions")
      .select("subject_name, topic_name, topic_id")
      .eq("branch_code", branchCode)
      .eq("is_duplicate", false);

    if (error) {
      console.error("[PYQ] Subjects query error:", error);
      return NextResponse.json({ error: "Failed to fetch subjects" }, { status: 500 });
    }

    // Group by subject
    const subjectMap = new Map<string, {
      subjectName: string;
      displayName: string;
      displayOrder: number;
      questionCount: number;
      topicCount: number;
      topics: { topicName: string; displayName: string; questionCount: number }[];
    }>();

    for (const q of questions || []) {
      const subjectName = q.subject_name;
      if (!subjectMap.has(subjectName)) {
        subjectMap.set(subjectName, {
          subjectName,
          displayName: subjectName,
          displayOrder: subjectMap.size + 1,
          questionCount: 0,
          topicCount: 0,
          topics: [],
        });
      }

      const subject = subjectMap.get(subjectName)!;
      subject.questionCount++;

      if (q.topic_name && !subject.topics.find((t) => t.topicName === q.topic_name)) {
        subject.topics.push({
          topicName: q.topic_name,
          displayName: q.topic_name,
          questionCount: 1,
        });
        subject.topicCount++;
      } else if (q.topic_name) {
        const topic = subject.topics.find((t) => t.topicName === q.topic_name);
        if (topic) topic.questionCount++;
      }
    }

    const subjects = Array.from(subjectMap.values()).sort((a, b) => a.displayOrder - b.displayOrder);

    return NextResponse.json({ subjects, total: subjects.length });
  } catch (error) {
    console.error("[PYQ] Subjects error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
