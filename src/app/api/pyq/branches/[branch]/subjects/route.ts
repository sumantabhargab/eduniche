/**
 * GET /api/pyq/branches/[branch]/subjects
 *
 * Returns subjects for a specific branch with topic counts.
 * Falls back to the static subject registry if the database
 * tables are not yet populated.
 */

import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { resolveBranch, getSubjectsForBranch } from "@/lib/pyq/branches";
import { getStaticSubjectsForBranch } from "@/lib/pyq/static-questions";

export async function GET(request: Request, { params }: { params: Promise<{ branch: string }> }) {
  try {
    const branchCode = (await params).branch.toUpperCase();

    const branch = resolveBranch(branchCode);
    if (!branch) {
      return NextResponse.json({ error: "Branch not found" }, { status: 404 });
    }

    const supabase = await createServiceClient();

    let dbSubjects: { subject_name: string; topic_name: string }[] = [];

    if (supabase) {
      const { data, error } = await supabase
        .from("pyq_questions")
        .select("subject_name, topic_name")
        .eq("branch_code", branch.branchCode)
        .eq("is_duplicate", false);

      if (!error && data) {
        dbSubjects = data;
      }
    }

    // If DB has data, build from DB; otherwise fall back to static bank
    if (dbSubjects.length > 0) {
      const subjectMap = new Map<string, {
        subjectName: string;
        displayName: string;
        displayOrder: number;
        questionCount: number;
        topicCount: number;
        topics: { topicName: string; displayName: string; questionCount: number }[];
      }>();

      for (const q of dbSubjects) {
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
      return NextResponse.json({ subjects, total: subjects.length, branch: { branchName: branch.branchName, displayName: branch.displayName } });
    }

    // Fallback 1: use static question bank if available
    const bankSubjects = getStaticSubjectsForBranch(branch.branchCode);
    if (bankSubjects.length > 0) {
      return NextResponse.json({ subjects: bankSubjects, total: bankSubjects.length, branch: { branchName: branch.branchName, displayName: branch.displayName } });
    }

    // Fallback 2: use the static registry with subject metadata
    const registrySubjects = getSubjectsForBranch(branch.branchCode);
    const subjects = registrySubjects.map((s, idx) => ({
      subjectName: s.subjectName,
      displayName: s.displayName,
      displayOrder: s.displayOrder || idx + 1,
      questionCount: 0,
      topicCount: s.topics.length,
      topics: s.topics.map((t) => ({
        topicName: t.topicName,
        displayName: t.displayName || t.topicName,
        questionCount: t.questionCount || 0,
      })),
    }));

    return NextResponse.json({ subjects, total: subjects.length, branch: { branchName: branch.branchName, displayName: branch.displayName } });
  } catch (error) {
    console.error("[PYQ] Subjects error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
