/**
 * StreakDisplay — shows the user's doubt-streak and daily goal progress.
 * Appears at the top of the doubt engine page.
 */

"use client";

import { type DoubtStreak, getDoubtStreakStatus } from "../hooks/use-doubt-streak";

interface StreakDisplayProps {
  streak: DoubtStreak;
  compact?: boolean;
}

export function StreakDisplay({ streak, compact }: StreakDisplayProps) {
  const status = getDoubtStreakStatus(streak);
  const goalPercent = Math.round((streak.todayCount / streak.dailyGoal) * 100);

  if (compact) {
    return (
      <div className="flex items-center gap-3 text-xs">
        {streak.current > 0 && (
          <div className={`flex items-center gap-1 ${status === "alive" ? "text-amber-500" : "text-muted"}`}>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 22c-4.97 0-9-3.03-9-7 0-2.9 1.73-5.43 4.25-6.62.38-.17.57-.6.44-.99-.25-.75.35-1.5 1.12-1.34C10.57 6.5 11.5 8.5 11.5 10.5c0 .5.05 1 .14 1.48.09.5.54.85 1.05.85h.04c1.1 0 2-.9 2-2 0-.5-.15-1-.4-1.4-.1-.2-.1-.4 0-.6.2-.4.7-.5 1.1-.3.3.2.7.3 1.1.3C17.5 8 19 9.5 19 11.5c0 3.97-4.03 7-9 7z" />
            </svg>
            <span className="font-semibold">{streak.current}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <div className="w-16 h-1.5 bg-muted/30 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${streak.goalMet ? "bg-green-500" : "bg-foreground/60"}`}
              style={{ width: `${Math.min(100, goalPercent)}%` }}
            />
          </div>
          <span className="text-muted">{streak.todayCount}/{streak.dailyGoal}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {streak.current > 0 ? (
            <div className="flex items-center gap-2">
              <svg className={`w-6 h-6 ${status === "alive" ? "text-amber-500 animate-pulse" : "text-muted"}`} viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 22c-4.97 0-9-3.03-9-7 0-2.9 1.73-5.43 4.25-6.62.38-.17.57-.6.44-.99-.25-.75.35-1.5 1.12-1.34C10.57 6.5 11.5 8.5 11.5 10.5c0 .5.05 1 .14 1.48.09.5.54.85 1.05.85h.04c1.1 0 2-.9 2-2 0-.5-.15-1-.4-1.4-.1-.2-.1-.4 0-.6.2-.4.7-.5 1.1-.3.3.2.7.3 1.1.3C17.5 8 19 9.5 19 11.5c0 3.97-4.03 7-9 7z" />
              </svg>
              <div>
                <div className="text-lg font-bold">
                  {streak.current} day{streak.current !== 1 ? "s" : ""}
                </div>
                <div className="text-xs text-muted">
                  {status === "alive" ? "Streak alive!" : status === "broken" ? "Streak broken" : "No streak yet"}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted">Ask your first doubt to start a streak</div>
          )}

          {streak.longest > 0 && (
            <div className="text-xs text-muted">
              Best: {streak.longest} days
            </div>
          )}
        </div>

        <div className="text-right">
          <div className="text-xs text-muted">Today&apos;s goal</div>
          <div className="text-sm font-medium">
            {streak.todayCount}/{streak.dailyGoal}
          </div>
        </div>
      </div>

      {/* Goal progress bar */}
      <div className="relative">
        <div className="h-2 bg-muted/20 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              streak.goalMet ? "bg-green-500" : goalPercent >= 60 ? "bg-amber-500" : "bg-foreground/60"
            }`}
            style={{ width: `${Math.min(100, goalPercent)}%` }}
          />
        </div>
        {streak.goalMet && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[10px] font-bold text-green-700 dark:text-green-300">Goal met!</span>
          </div>
        )}
      </div>
    </div>
  );
}
