/**
 * StudyPlanSummary — today's plan overview.
 *
 * Shows tasks, durations, and completion progress.
 */

"use client";

import { useMemo } from "react";
import { usePlanner } from "../../../hooks/use-planner";
import Link from "next/link";

export function StudyPlanSummary() {
  const participantId = useMemo(() => {
    const stored = typeof localStorage !== "undefined"
      ? localStorage.getItem("eduneuro_library_id")
      : null;
    if (stored) return stored;
    const id = `anon-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("eduneuro_library_id", id);
    }
    return id;
  }, []);

  const { plans, progress } = usePlanner({ participantId });
  const todayPlan = plans[0];

  return (
    <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Today&apos;s Plan</h2>
        <span className="text-sm text-muted">
          {progress.percent}% complete
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-accent rounded-full overflow-hidden">
        <div
          className="h-full bg-foreground/80 rounded-full transition-all duration-500"
          style={{ width: `${progress.percent}%` }}
        />
      </div>

      {/* Tasks or empty state */}
      {todayPlan ? (
        <div className="space-y-2">
          {progress.total > 0 ? (
            <div className="flex items-baseline gap-4 text-sm">
              <span className="text-foreground font-medium">
                {progress.completed}/{progress.total} tasks
              </span>
              <span className="text-muted">
                {todayPlan.totalPlannedMinutes} min planned
              </span>
            </div>
          ) : (
            <p className="text-sm text-muted">No tasks yet. Start by adding one!</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted">
            No plan for today. Create one to stay focused.
          </p>
          <Link
            href="/library?tab=planner"
            className="inline-block px-4 py-2 bg-foreground text-background rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Create a Plan
          </Link>
        </div>
      )}
    </div>
  );
}
