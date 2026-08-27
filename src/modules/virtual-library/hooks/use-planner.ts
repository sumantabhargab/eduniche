/**
 * Hook for planner state management.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { plannerService } from "../services/planner-service";
import type { StudyPlan, StudyTask } from "../types/index";

export interface UsePlannerOptions {
  participantId: string;
  date?: string;
}

export interface UsePlannerReturn {
  /** Current plans */
  plans: StudyPlan[];
  /** Tasks for the active plan */
  tasks: StudyTask[];
  /** Currently selected plan */
  activePlan: StudyPlan | null;
  /** Create a new plan */
  createPlan: (title: string, granularity: "daily" | "weekly" | "monthly", branchId: string) => StudyPlan;
  /** Select a plan */
  setActivePlan: (plan: StudyPlan | null) => void;
  /** Add a task to the active plan */
  addTask: (task: Omit<StudyTask, "id" | "createdAt" | "participantId">) => StudyTask;
  /** Toggle task completion */
  toggleTask: (taskId: string) => void;
  /** Delete a task */
  deleteTask: (taskId: string) => void;
  /** Plan completion progress */
  progress: { completed: number; total: number; percent: number };
}

export function usePlanner(options: UsePlannerOptions): UsePlannerReturn {
  const { participantId, date } = options;
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [activePlan, setActivePlan] = useState<StudyPlan | null>(null);
  const [tasks, setTasks] = useState<StudyTask[]>([]);

  // Load plans
  useEffect(() => {
    const loaded = plannerService.getPlans(participantId, date);
    setPlans(loaded);
    if (loaded.length > 0 && !activePlan) {
      setActivePlan(loaded[0]);
    }
  }, [participantId, date]);

  // Load tasks when active plan changes
  useEffect(() => {
    if (!activePlan) {
      setTasks([]);
      return;
    }
    const planTasks = plannerService.getPlanTasks(activePlan.id);
    setTasks(planTasks);
  }, [activePlan]);

  const createPlan = useCallback(
    (title: string, granularity: "daily" | "weekly" | "monthly", branchId: string) => {
      const today = new Date().toISOString().split("T")[0];
      const plan = plannerService.createPlan({
        participantId,
        title,
        granularity,
        branchId,
        date: today,
      });
      setPlans((prev) => [plan, ...prev]);
      setActivePlan(plan);
      return plan;
    },
    [participantId],
  );

  const addTask = useCallback(
    (taskInput: Omit<StudyTask, "id" | "createdAt" | "participantId">) => {
      if (!activePlan) throw new Error("No active plan");
      const task = plannerService.saveTask({
        ...taskInput,
        planId: activePlan.id,
        participantId,
      });
      setTasks((prev) => [...prev, task]);
      return task;
    },
    [activePlan, participantId],
  );

  const toggleTask = useCallback(
    (taskId: string) => {
      const updated = plannerService.toggleTask(taskId, true);
      if (updated) {
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? updated : t)),
        );
      }
    },
    [],
  );

  const deleteTask = useCallback(
    (taskId: string) => {
      plannerService.deleteTask(taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    },
    [],
  );

  const progress = useCallback(() => {
    if (!activePlan) return { completed: 0, total: 0, percent: 0 };
    return plannerService.getPlanProgress(activePlan.id);
  }, [activePlan])();

  return {
    plans,
    tasks,
    activePlan,
    createPlan,
    setActivePlan,
    addTask,
    toggleTask,
    deleteTask,
    progress,
  };
}
