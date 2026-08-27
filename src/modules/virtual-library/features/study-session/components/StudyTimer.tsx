/**
 * StudyTimer — presentational timer display with controls.
 *
 * Receives all state and callbacks as props — purely presentational.
 */

import { motion } from "framer-motion";

interface StudyTimerProps {
  /** Current session status */
  status: "idle" | "running" | "paused" | "completed";
  /** Current focus time in seconds */
  focusSeconds: number;
  /** Start a new session */
  onStart: () => void;
  /** Pause the current session */
  onPause: () => void;
  /** Resume a paused session */
  onResume: () => void;
  /** End the current session */
  onEnd: () => void;
  /** Optional topic being studied */
  topic?: string;
}

function formatTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

export function StudyTimer({
  status,
  focusSeconds,
  onStart,
  onPause,
  onResume,
  onEnd,
  topic,
}: StudyTimerProps) {
  const isRunning = status === "running";
  const isPaused = status === "paused";
  const isIdle = status === "idle";

  return (
    <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 text-center space-y-6">
      {/* Topic label */}
      {topic && (
        <p className="text-sm text-muted">
          Studying: <span className="text-foreground font-medium">{topic}</span>
        </p>
      )}

      {/* Timer display */}
      <div className="space-y-2">
        <p className="text-sm text-muted uppercase tracking-wider font-medium">
          {isIdle && "Ready to focus"}
          {isRunning && "In session"}
          {isPaused && "Paused"}
          {status === "completed" && "Session complete"}
        </p>

        <motion.div
          className="text-5xl sm:text-7xl font-mono font-bold tracking-tighter"
          animate={isRunning ? { scale: [1, 1.02, 1] } : { scale: 1 }}
          transition={
            isRunning
              ? { duration: 2, repeat: Infinity, ease: "easeInOut" }
              : { duration: 0.3 }
          }
        >
          {formatTime(focusSeconds)}
        </motion.div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3">
        {isIdle && (
          <button
            onClick={onStart}
            className="px-6 py-2.5 bg-foreground text-background rounded-xl font-semibold hover:opacity-90 transition-opacity"
          >
            Start Session
          </button>
        )}

        {isRunning && (
          <>
            <button
              onClick={onPause}
              className="px-5 py-2.5 bg-accent border border-border rounded-xl font-medium hover:bg-foreground/5 transition-colors"
            >
              Pause
            </button>
            <button
              onClick={onEnd}
              className="px-5 py-2.5 border border-border rounded-xl font-medium hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-600 transition-colors"
            >
              End
            </button>
          </>
        )}

        {isPaused && (
          <>
            <button
              onClick={onResume}
              className="px-6 py-2.5 bg-foreground text-background rounded-xl font-semibold hover:opacity-90 transition-opacity"
            >
              Resume
            </button>
            <button
              onClick={onEnd}
              className="px-5 py-2.5 border border-border rounded-xl font-medium hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-600 transition-colors"
            >
              End
            </button>
          </>
        )}
      </div>

      {/* Session selector hint */}
      {isIdle && (
        <p className="text-xs text-muted">
          Pick a subject and topic before you start to track progress.
        </p>
      )}
    </div>
  );
}
