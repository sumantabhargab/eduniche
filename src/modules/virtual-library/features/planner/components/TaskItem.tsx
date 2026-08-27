/**
 * TaskItem — individual task row with completion toggle.
 */

import { motion } from "framer-motion";
import type { StudyTask } from "../../../types/index";

interface TaskItemProps {
  task: StudyTask;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function TaskItem({ task, onToggle, onDelete }: TaskItemProps) {
  return (
    <motion.div
      layout
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
        onClick={() => onToggle(task.id)}
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
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-muted">
            {formatDuration(task.plannedMinutes)}
          </span>
          {task.topic && (
            <>
              <span className="text-muted">·</span>
              <span className="text-xs text-muted">{task.topic}</span>
            </>
          )}
        </div>
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
        onClick={() => onDelete(task.id)}
        className="shrink-0 text-muted hover:text-red-500 transition-colors p-1"
        title="Delete task"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </motion.div>
  );
}
