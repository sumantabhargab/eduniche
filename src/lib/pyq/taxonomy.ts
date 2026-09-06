/**
 * PYQ Taxonomy helpers
 *
 * Subject and topic lookups for each branch.
 * Centralizes the mapping from display names to internal IDs.
 */

import { getSubjectsForBranch, getSubjectByName } from "./branches";

export interface SubjectRef {
  id: string;
  subjectName: string;
  displayName: string;
  displayOrder: number;
  topicCount: number;
  questionCount: number;
}

/**
 * Get all subjects for a branch with computed IDs.
 */
export function getSubjectsForBranchWithIds(branchCode: string): SubjectRef[] {
  const subjects = getSubjectsForBranch(branchCode);
  return subjects.map((s) => {
    const id = `subj-${branchCode.toLowerCase()}-${s.subjectName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
    const topicCount = s.topics.length;
    const questionCount = s.topics.reduce((sum, t) => sum + t.questionCount, 0);
    return { ...s, id, topicCount, questionCount };
  });
}

/**
 * Get topics for a subject.
 */
export function getTopicsForSubject(branchCode: string, subjectName: string) {
  const subject = getSubjectByName(branchCode, subjectName);
  return subject?.topics || [];
}

/**
 * Resolve a topic display name to canonical name.
 */
export function resolveTopicName(branchCode: string, subjectName: string, topicName: string): string | null {
  const topics = getTopicsForSubject(branchCode, subjectName);
  const found = topics.find(
    (t) =>
      t.topicName.toLowerCase() === topicName.toLowerCase() ||
      t.displayName.toLowerCase() === topicName.toLowerCase()
  );
  return found?.topicName || null;
}

/**
 * Get all topic names for a branch (flat list with subject context).
 */
export function getAllTopicsForBranch(branchCode: string): { subjectName: string; topic: { topicName: string; displayName: string } }[] {
  const subjects = getSubjectsForBranch(branchCode);
  const result: { subjectName: string; topic: { topicName: string; displayName: string } }[] = [];
  for (const s of subjects) {
    for (const t of s.topics) {
      result.push({ subjectName: s.subjectName, topic: { topicName: t.topicName, displayName: t.displayName } });
    }
  }
  return result;
}

/**
 * Generate a stable subject ID from branch code and subject name.
 */
export function generateSubjectId(branchCode: string, subjectName: string): string {
  return `subj-${branchCode.toLowerCase()}-${subjectName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

/**
 * Generate a stable topic ID from subject ID and topic name.
 */
export function generateTopicId(subjectId: string, topicName: string): string {
  return `${subjectId}-${topicName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}
