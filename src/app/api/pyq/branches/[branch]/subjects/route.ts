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

    // If DB has data, build from DB; merge with static topics if DB topics are sparse
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

        if (q.topic_name && q.topic_name.trim() && !subject.topics.find((t) => t.topicName === q.topic_name)) {
          subject.topics.push({
            topicName: q.topic_name,
            displayName: q.topic_name,
            questionCount: 1,
          });
          subject.topicCount++;
        } else if (q.topic_name && q.topic_name.trim()) {
          const topic = subject.topics.find((t) => t.topicName === q.topic_name);
          if (topic) topic.questionCount++;
        }
      }

      // If any subject has 0 topics but DB has questions, try to get topic info from static bank
      // Merge static topic data for subjects where DB has questions but no topics
      const staticSubjects = getStaticSubjectsForBranch(branch.branchCode);
      const staticTopicMap = new Map<string, { topicName: string; displayName: string; questionCount: number }[]>();
      staticSubjects.forEach(s => {
        staticTopicMap.set(s.subjectName, s.topics.map(t => ({
          topicName: t.topicName,
          displayName: t.displayName || t.topicName,
          questionCount: t.questionCount || 0,
        })));
      });

      // Also build a fuzzy topic map from the branches registry — match by subject name
      const registryTopics = new Map<string, { topicName: string; displayName: string; questionCount: number }[]>();
      getSubjectsForBranch(branch.branchCode).forEach(s => {
        registryTopics.set(s.subjectName, s.topics.map(t => ({
          topicName: t.topicName,
          displayName: t.displayName || t.topicName,
          questionCount: t.questionCount || 0,
        })));
      });

      for (const subject of subjectMap.values()) {
        // Replace generic/empty topics with registry topics when available
        const hasOnlyGenericTopics = subject.topics.length <= 1 &&
          (!subject.topics[0]?.topicName || subject.topics[0].topicName.trim() === "" || subject.topics[0].topicName.toLowerCase() === "general");
        if (subject.topicCount === 0 || hasOnlyGenericTopics) {
          const staticTopics = staticTopicMap.get(subject.subjectName);
          const registryTopicList = registryTopics.get(subject.subjectName);
          const mergedTopics = (staticTopics && staticTopics.length > 0) ? staticTopics : registryTopicList;
          if (mergedTopics && mergedTopics.length > 0) {
            subject.topics = mergedTopics.map(t => ({ ...t, questionCount: t.questionCount || 0 }));
            subject.topicCount = mergedTopics.length;
          }
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
