/**
 * PlannerService — CRUD for study tasks and plans.
 *
 * Manages daily task lists, plan assembly, and completion tracking.
 * Uses in-memory storage for mock mode.
 */

import type {
  StudyPlan,
  StudyTask,
  TaskPriority,
  PlanGranularity,
} from "../types/index";
import { emitLibraryEvent } from "./event-emitter";

// ─── In-memory store (mock) ─────────────────────────────────────────────────

type MockMark<T> = T & { __mock?: boolean };

const plans: Map<string, MockMark<StudyPlan>> = new Map();
const tasks: Map<string, MockMark<StudyTask>> = new Map();
const taskOrder: Map<string, string[]> = new Map(); // planId -> ordered task IDs

let planCounter = 0;
let taskCounter = 0;

// ─── Service ────────────────────────────────────────────────────────────────

export class PlannerService {
  // ─── Plans ────────────────────────────────────────────────────────────

  /** Get plans for a participant, optionally filtered by date. */
  getPlans(participantId: string, date?: string): StudyPlan[] {
    const result: MockMark<StudyPlan>[] = [];
    for (const plan of plans.values()) {
      if (plan.participantId !== participantId) continue;
      if (date && plan.date !== date) continue;
      result.push(plan);
    }
    return result
      .map(({ __mock, ...p }) => p)
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  /** Get a single plan by ID. */
  getPlan(planId: string): StudyPlan | undefined {
    const p = plans.get(planId);
    if (!p) return undefined;
    const { __mock, ...rest } = p;
    return rest;
  }

  /** Create a new study plan. */
  createPlan(input: {
    participantId: string;
    title: string;
    granularity: PlanGranularity;
    branchId: string;
    date: string;
  }): StudyPlan {
    const id = `plan-${Date.now()}-${++planCounter}`;
    const plan: MockMark<StudyPlan> = {
      id,
      participantId: input.participantId,
      title: input.title,
      granularity: input.granularity,
      branchId: input.branchId,
      date: input.date,
      totalPlannedMinutes: 0,
      totalActualMinutes: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completedCount: 0,
      taskCount: 0,
      __mock: true,
    };
    plans.set(id, plan);
    emitLibraryEvent("plan_created", { participantId: input.participantId, branchId: input.branchId }, {
      granularity: input.granularity,
      date: input.date,
    });
    const { __mock, ...rest } = plan;
    return rest;
  }

  // ─── Tasks ────────────────────────────────────────────────────────────

  /** Get tasks for a participant, optionally filtered by plan. */
  getTasks(participantId: string, planId?: string): StudyTask[] {
    const result: MockMark<StudyTask>[] = [];
    for (const task of tasks.values()) {
      if (task.participantId !== participantId) continue;
      if (planId && task.planId !== planId) continue;
      result.push(task);
    }
    return result
      .map(({ __mock, ...t }) => t)
      .sort((a, b) => a.order - b.order);
  }

  /** Get tasks for a specific plan. */
  getPlanTasks(planId: string): StudyTask[] {
    const ids = taskOrder.get(planId) ?? [];
    return ids
      .map((id) => tasks.get(id))
      .filter((t): t is MockMark<StudyTask> => t !== undefined)
      .map(({ __mock, ...t }) => t)
      .sort((a, b) => a.order - b.order);
  }

  /** Save (create or update) a task. */
  saveTask(
    input: Omit<StudyTask, "id" | "createdAt"> & { id?: string },
  ): StudyTask {
    const existingId = input.id;
    if (existingId && tasks.has(existingId)) {
      const existing = tasks.get(existingId)!;
      const updated: MockMark<StudyTask> = {
        ...existing,
        ...input,
        __mock: true,
      };
      tasks.set(existingId, updated);

      // Recalculate plan totals
      this._recalcPlan(updated.planId);

      if (updated.completed && !existing.completed) {
        emitLibraryEvent("plan_task_completed", {
          participantId: updated.participantId,
          branchId: updated.branchId,
          subjectId: updated.subjectId,
          topic: updated.topic,
        });
      }

      const { __mock, ...rest } = updated;
      return rest;
    }

    const id = `task-${Date.now()}-${++taskCounter}`;
    const now = new Date().toISOString();
    const task: MockMark<StudyTask> = {
      id,
      planId: input.planId,
      participantId: input.participantId,
      title: input.title,
      branchId: input.branchId,
      subjectId: input.subjectId,
      topic: input.topic,
      plannedMinutes: input.plannedMinutes,
      actualMinutes: input.actualMinutes ?? null,
      priority: input.priority,
      order: input.order,
      completed: input.completed,
      completedAt: input.completedAt,
      createdAt: now,
      __mock: true,
    };

    tasks.set(id, task);

    // Track ordering
    if (!taskOrder.has(task.planId)) {
      taskOrder.set(task.planId, []);
    }
    taskOrder.get(task.planId)!.push(id);

    this._recalcPlan(task.planId);
    const { __mock, ...rest } = task;
    return rest;
  }

  /** Toggle task completion. */
  toggleTask(taskId: string, completed: boolean): StudyTask | undefined {
    const task = tasks.get(taskId);
    if (!task) return undefined;

    const updated: MockMark<StudyTask> = {
      ...task,
      completed,
      completedAt: completed ? new Date().toISOString() : undefined,
      __mock: true,
    };
    tasks.set(taskId, updated);
    this._recalcPlan(updated.planId);

    if (completed) {
      emitLibraryEvent("plan_task_completed", {
        participantId: updated.participantId,
        branchId: updated.branchId,
        subjectId: updated.subjectId,
        topic: updated.topic,
      });
    }

    const { __mock, ...rest } = updated;
    return rest;
  }

  /** Delete a task. */
  deleteTask(taskId: string): boolean {
    const task = tasks.get(taskId);
    if (!task) return false;

    const planId = task.planId;
    tasks.delete(taskId);

    // Remove from ordering
    const ids = taskOrder.get(planId) ?? [];
    const filtered = ids.filter((id) => id !== taskId);
    taskOrder.set(planId, filtered);

    this._recalcPlan(planId);
    return true;
  }

  /** Get completion percentage for a plan. */
  getPlanProgress(planId: string): { completed: number; total: number; percent: number } {
    const planTasks = this.getPlanTasks(planId);
    const completed = planTasks.filter((t) => t.completed).length;
    return {
      completed,
      total: planTasks.length,
      percent: planTasks.length > 0 ? Math.round((completed / planTasks.length) * 100) : 0,
    };
  }

  // ─── Private ──────────────────────────────────────────────────────────

  private _recalcPlan(planId: string): void {
    const plan = plans.get(planId);
    if (!plan) return;

    const planTasks = this.getPlanTasks(planId);
    const completed = planTasks.filter((t) => t.completed).length;
    const totalPlanned = planTasks.reduce((sum, t) => sum + t.plannedMinutes, 0);
    const totalActual = planTasks
      .filter((t) => t.completed && t.actualMinutes)
      .reduce((sum, t) => sum + (t.actualMinutes ?? 0), 0);

    plans.set(planId, {
      ...plan,
      totalPlannedMinutes: totalPlanned,
      totalActualMinutes: totalActual,
      completedCount: completed,
      taskCount: planTasks.length,
      updatedAt: new Date().toISOString(),
    });
  }
}

/** Singleton service instance. */
export const plannerService = new PlannerService();
