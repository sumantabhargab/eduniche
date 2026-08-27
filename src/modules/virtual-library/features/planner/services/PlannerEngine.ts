/**
 * PlannerEngine — deterministic planning logic.
 *
 * Generates daily study plans from subject weights and available time.
 * Pure function — no side effects, no dependencies.
 */

import type { PlanGranularity, StudyTask, TaskPriority } from "../../../types/index";

export interface PlannerEngineInput {
  /** Available study minutes per day */
  dailyMinutes: number;
  /** Subjects to include with their weight (importance 0-1) */
  subjects: Array<{ subjectId: string; name: string; weight: number }>;
  /** Number of days to plan for */
  days: number;
  /** Focus area hint (optional) */
  focusSubjectId?: string;
}

export interface GeneratedPlan {
  tasks: StudyTask[];
  totalMinutes: number;
  utilizationPercent: number;
}

/**
 * Generate a daily plan by distributing study time across subjects
 * proportional to their weight.
 */
export function generateDailyPlan(input: PlannerEngineInput): GeneratedPlan {
  const { dailyMinutes, subjects, focusSubjectId } = input;

  // Filter and weight subjects
  const weighted = subjects.map((s) => ({
    ...s,
    effectiveWeight: focusSubjectId && s.subjectId === focusSubjectId
      ? s.weight * 1.5
      : s.weight,
  }));

  const totalWeight = weighted.reduce((sum, s) => sum + s.effectiveWeight, 0);
  if (totalWeight === 0) {
    return { tasks: [], totalMinutes: 0, utilizationPercent: 0 };
  }

  // Distribute minutes
  let remainingMinutes = dailyMinutes;
  const tasks: StudyTask[] = [];
  const now = new Date().toISOString();

  for (const subj of weighted) {
    const proportion = subj.effectiveWeight / totalWeight;
    const minutes = Math.max(15, Math.round((dailyMinutes * proportion) / 15) * 15);
    const allocated = Math.min(minutes, remainingMinutes);

    if (allocated < 15) continue;

    tasks.push({
      id: `engine-task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      planId: "", // filled by caller
      participantId: "",
      title: `Study ${subj.name}`,
      branchId: "",
      subjectId: subj.subjectId,
      plannedMinutes: allocated,
      actualMinutes: null,
      priority: subj.effectiveWeight > 0.8 ? "high" : subj.effectiveWeight > 0.5 ? "medium" : "low",
      order: tasks.length,
      completed: false,
      createdAt: now,
    });

    remainingMinutes -= allocated;
  }

  return {
    tasks,
    totalMinutes: dailyMinutes - remainingMinutes,
    utilizationPercent: Math.round(((dailyMinutes - remainingMinutes) / dailyMinutes) * 100),
  };
}

/**
 * Calculate priority score for a subject based on weight and recency.
 */
export function computeSubjectPriority(
  weight: number,
  lastStudiedDaysAgo: number,
): number {
  const recencyFactor = Math.max(0, 1 - lastStudiedDaysAgo / 30);
  return Math.round((weight * 0.7 + recencyFactor * 0.3) * 100);
}

/**
 * Suggest study order for a set of subjects.
 */
export function suggestStudyOrder(
  subjects: Array<{ subjectId: string; weight: number; lastStudiedDaysAgo: number }>,
): string[] {
  return subjects
    .map((s) => ({
      id: s.subjectId,
      priority: computeSubjectPriority(s.weight, s.lastStudiedDaysAgo),
    }))
    .sort((a, b) => b.priority - a.priority)
    .map((s) => s.id);
}
