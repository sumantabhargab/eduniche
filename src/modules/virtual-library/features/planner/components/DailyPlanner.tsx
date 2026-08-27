/**
 * DailyPlanner — today's tasks list with checkboxes and durations.
 */

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePlanner } from "../../../hooks/use-planner";

export function DailyPlanner() {
  const participantId = (() => {
    const stored = typeof localStorage !== "undefined"
      ? localStorage.getItem("eduneuro_library_id")
      : null;
    if (stored) return stored;
    const id = `anon-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("eduneuro_library_id", id);
    }
    return id;
  })();

  const { plans, activePlan, tasks, createPlan, addTask, toggleTask, deleteTask, progress } = usePlanner({ participantId });
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskMinutes, setNewTaskMinutes] = useState("30");
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAddTask = () => {
    if (!newTaskTitle.trim() || !activePlan) return;
    const minutes = parseInt(newTaskMinutes) || 30;
    addTask({
      title: newTaskTitle.trim(),
      planId: activePlan.id,
      branchId: activePlan.branchId,
      plannedMinutes: Math.min(180, Math.max(5, minutes)),
      actualMinutes: null,
      priority: "medium",
      order: progress.total,
      completed: false,
    });
    setNewTaskTitle("");
    setNewTaskMinutes("30");
    setShowAddForm(false);
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Daily Planner</h2>

        <div className="flex items-center gap-2">
          {!activePlan && (
            <button
              onClick={() => createPlan("Today&apos;s Study Plan", "daily", "all")}
              className="px-3 py-1.5 bg-foreground text-background rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
            >
              + New Plan
            </button>
          )}
          {activePlan && !showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="px-3 py-1.5 bg-foreground text-background rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
            >
              + Task
            </button>
          )}
        </div>
      </div>

      {/* Plan selector */}
      {plans.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {plans.map((plan) => (
            <button
              key={plan.id}
              onClick={() => {
                // usePlanner hook handles this via setActivePlan if wired;
                // for now, just create a new plan when clicking empty state
              }}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                activePlan?.id === plan.id
                  ? "bg-foreground text-background"
                  : "bg-accent text-muted hover:text-foreground"
              }`}
            >
              {plan.title}
            </button>
          ))}
        </div>
      )}

      {/* Progress */}
      {activePlan && (
        <div className="flex items-center gap-3 text-sm">
          <div className="flex-1 h-2 bg-accent rounded-full overflow-hidden">
            <div
              className="h-full bg-foreground/80 rounded-full transition-all duration-500"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
          <span className="text-muted tabular-nums">
            {progress.completed}/{progress.total}
          </span>
        </div>
      )}

      {/* Task list */}
      {activePlan && (
        <div className="space-y-2">
          {tasks.length === 0 && !showAddForm && (
            <p className="text-sm text-muted py-4 text-center">
              No tasks yet. Add one to get started.
            </p>
          )}

          {/* Add task form */}
          <AnimatePresence>
            {showAddForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="p-3 bg-accent/30 rounded-xl space-y-2">
                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="What are you studying?"
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-foreground/30"
                    onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
                  />
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={newTaskMinutes}
                      onChange={(e) => setNewTaskMinutes(e.target.value)}
                      min="5"
                      max="180"
                      className="w-20 px-2 py-1.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-foreground/30"
                    />
                    <span className="text-sm text-muted self-center">min</span>
                    <div className="flex-1" />
                    <button
                      onClick={handleAddTask}
                      disabled={!newTaskTitle.trim()}
                      className="px-3 py-1.5 bg-foreground text-background rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => { setShowAddForm(false); setNewTaskTitle(""); }}
                      className="px-3 py-1.5 border border-border rounded-lg text-sm text-muted hover:text-foreground transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Task list */}
          <AnimatePresence>
            {tasks.map((task) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                  task.completed
                    ? "bg-accent/30 border-border/50"
                    : "bg-card border-border hover:border-foreground/20"
                }`}
              >
                {/* Checkbox */}
                <button
                  onClick={() => toggleTask(task.id)}
                  className={`shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                    task.completed
                      ? "bg-foreground border-foreground"
                      : "border-muted hover:border-foreground/50"
                  }`}
                >
                  {task.completed && (
                    <svg className="w-3 h-3 text-background" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${
                    task.completed ? "line-through text-muted" : "text-foreground"
                  }`}>
                    {task.title}
                  </p>
                  <p className="text-xs text-muted mt-0.5">
                    {task.plannedMinutes} min
                    {task.topic && ` · ${task.topic}`}
                  </p>
                </div>

                {/* Priority badge */}
                <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full ${
                  task.priority === "high"
                    ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                    : task.priority === "medium"
                      ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                }`}>
                  {task.priority}
                </span>

                {/* Delete */}
                <button
                  onClick={() => deleteTask(task.id)}
                  className="shrink-0 text-muted hover:text-red-500 transition-colors p-1"
                  title="Delete task"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {!activePlan && plans.length === 0 && (
        <div className="text-center py-8 text-muted">
          <p>No plans yet. Create one to organize your study time.</p>
        </div>
      )}
    </div>
  );
}
