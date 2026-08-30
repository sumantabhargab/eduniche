/**
 * Dashboard page at /dashboard
 * Shows study stats, timer, goals, streak, and quick actions.
 */

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";

type Period = "today" | "week" | "month" | "all";

interface Stats {
  period: string;
  total: {
    hours: number;
    minutes: number;
    seconds: number;
  };
  periodTotal: {
    hours: number;
    minutes: number;
  };
  sessions: number;
  dailyGoal: number;
  goalProgress: number;
  todayMinutes: number;
  streak: {
    current: number;
    longest: number;
  };
}

const QUOTES = [
  {
    text: "The secret of getting ahead is getting started.",
    author: "Mark Twain",
  },
  {
    text: "Success is the sum of small efforts, repeated day in and day out.",
    author: "Robert Collier",
  },
  {
    text: "Don't watch the clock; do what it does. Keep going.",
    author: "Sam Levenson",
  },
  {
    text: "The expert in anything was once a beginner.",
    author: "Helen Hayes",
  },
  {
    text: "Your future is created by what you do today, not tomorrow.",
    author: "Robert Kiyosaki",
  },
  {
    text: "Small daily improvements over time lead to stunning results.",
    author: "Robin Sharma",
  },
  {
    text: "Consistency is what transforms average into excellence.",
    author: "Unknown",
  },
  {
    text: "Focus on being productive instead of busy.",
    author: "Tim Ferriss",
  },
];

function getDailyQuote() {
  const dayOfYear = Math.floor(
    (Date.now() -
      new Date(new Date().getFullYear(), 0, 0).getTime()) /
      86400000
  );

  return QUOTES[dayOfYear % QUOTES.length];
}

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState<Stats | null>(null);
  const [period, setPeriod] = useState<Period>("today");

  // Redirect unauthenticated users.
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/");
    }
  }, [loading, user, router]);

  // Fetch study statistics.
  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      try {
        const res = await fetch(
          `/api/study/stats?period=${period}`
        );

        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Failed to fetch study stats:", error);
      }
    };

    fetchStats();
  }, [user, period]);

  // IMPORTANT:
  // This hook must be called on every render, before any
  // conditional return.
  const handleSessionEnd = useCallback(() => {
    fetch(`/api/study/stats?period=${period}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setStats(data);
        }
      })
      .catch(() => {});
  }, [period]);

  // Loading state.
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-pulse text-muted">
          Loading...
        </div>
      </div>
    );
  }

  // User is being redirected.
  if (!user) {
    return null;
  }

  const quote = getDailyQuote();
  const displayName =
    user.display_name || user.username || "there";

  const formatTime = (hours: number, minutes: number) => {
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }

    return `${minutes}m`;
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
      {/* Welcome header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">
          Welcome back, {displayName}
        </h1>

        <p className="text-muted mt-1">
          {stats ? (
            <>
              You&apos;ve studied{" "}
              <span className="text-foreground font-medium">
                {formatTime(
                  stats.periodTotal.hours,
                  stats.periodTotal.minutes
                )}
              </span>{" "}
              {period === "today"
                ? "today"
                : period === "week"
                ? "this week"
                : period === "month"
                ? "this month"
                : "all time"}
            </>
          ) : (
            "Let's make today count."
          )}
        </p>
      </div>

      {/* Period selector */}
      <div className="flex gap-2 flex-wrap">
        {(["today", "week", "month", "all"] as Period[]).map(
          (p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                period === p
                  ? "bg-foreground text-background"
                  : "bg-card border border-border hover:border-foreground/30"
              }`}
            >
              {p === "all"
                ? "All Time"
                : p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          )
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Study Time"
          value={
            stats
              ? formatTime(
                  stats.periodTotal.hours,
                  stats.periodTotal.minutes
                )
              : "—"
          }
        />

        <StatCard
          label="Sessions"
          value={stats?.sessions?.toString() ?? "—"}
        />

        <StatCard
          label="Streak"
          value={
            stats ? `${stats.streak.current} days` : "—"
          }
          accent="🔥"
        />

        <StatCard
          label="Goal"
          value={
            stats ? `${stats.goalProgress}%` : "—"
          }
        />
      </div>

      {/* Daily goal progress bar */}
      {stats && (
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">
              Daily Goal
            </span>

            <span className="text-sm text-muted">
              {stats.todayMinutes}m / {stats.dailyGoal}m
            </span>
          </div>

          <div className="h-2 bg-accent rounded-full overflow-hidden">
            <div
              className="h-full bg-foreground rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(
                  100,
                  Math.max(0, stats.goalProgress)
                )}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Study Timer */}
      <div>
        <h2 className="text-lg font-semibold mb-4">
          Study Timer
        </h2>

        <StudyTimerDisplay
          userId={user.id}
          onSessionEnd={handleSessionEnd}
        />
      </div>

      {/* Quote of the day */}
      <div className="bg-card border border-border rounded-2xl p-6 md:p-8">
        <div className="text-sm text-muted uppercase tracking-wider font-medium mb-4">
          Daily Quote
        </div>

        <blockquote className="text-lg md:text-xl font-light leading-relaxed text-foreground/90">
          &ldquo;{quote.text}&rdquo;
        </blockquote>

        <p className="text-sm text-muted mt-3">
          — {quote.author}
        </p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <QuickAction
          href="/library"
          label="Library"
          emoji="📚"
        />

        <QuickAction
          href="/leaderboard"
          label="Leaderboard"
          emoji="🏆"
        />

        <QuickAction
          href="/pricing"
          label="Upgrade"
          emoji="⭐"
        />

        <QuickAction
          href="/profile"
          label="Profile"
          emoji="👤"
        />
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4 md:p-6">
      <div className="text-xs text-muted uppercase tracking-wider font-medium mb-2">
        {label}
      </div>

      <div className="text-2xl md:text-3xl font-bold font-mono">
        {accent && (
          <span className="mr-1">{accent}</span>
        )}

        {value}
      </div>
    </div>
  );
}

function QuickAction({
  href,
  label,
  emoji,
}: {
  href: string;
  label: string;
  emoji: string;
}) {
  return (
    <a
      href={href}
      className="bg-card border border-border rounded-2xl p-6 text-center hover:border-foreground/30 transition-colors group"
    >
      <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
        {emoji}
      </div>

      <div className="text-sm font-medium">
        {label}
      </div>
    </a>
  );
}

function StudyTimerDisplay({
  userId,
  onSessionEnd,
}: {
  userId: string;
  onSessionEnd: () => void;
}) {
  const [status, setStatus] = useState<
    "idle" | "running" | "paused"
  >("idle");

  const [focusSeconds, setFocusSeconds] = useState(0);

  const [sessionId, setSessionId] = useState<
    string | null
  >(null);

  const [pageVisible, setPageVisible] = useState(true);

  const tickRef = useRef<
    ReturnType<typeof setInterval> | null
  >(null);

  const startTimeRef = useRef(0);
  const pauseElapsedRef = useRef(0);

  // Prevent unused parameter warnings while keeping the
  // component API ready for user-specific sessions.
  void userId;

  // Track page visibility.
  useEffect(() => {
    const handleVisibility = () => {
      const visible = !document.hidden;

      setPageVisible(visible);

      if (document.hidden && status === "running") {
        pauseTimer();
      }
    };

    document.addEventListener(
      "visibilitychange",
      handleVisibility
    );

    return () => {
      document.removeEventListener(
        "visibilitychange",
        handleVisibility
      );
    };
  }, [status]);

  const startTimer = async () => {
    try {
      const res = await fetch("/api/study/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          branch_id: "general",
          subject_id: "general",
        }),
      });

      if (!res.ok) {
        console.error(
          "Failed to start session:",
          res.status
        );
        return;
      }

      const data = await res.json();

      setSessionId(data.session.id);
      setStatus("running");

      startTimeRef.current = Date.now();
      pauseElapsedRef.current = 0;

      startTick();
    } catch (error) {
      console.error(
        "Failed to start session:",
        error
      );
    }
  };

  const pauseTimer = () => {
    if (status !== "running") {
      return;
    }

    pauseElapsedRef.current +=
      Date.now() - startTimeRef.current;

    setStatus("paused");

    stopTick();

    setFocusSeconds(
      Math.floor(pauseElapsedRef.current / 1000)
    );
  };

  const resumeTimer = () => {
    if (status !== "paused") {
      return;
    }

    setStatus("running");

    startTimeRef.current = Date.now();

    startTick();
  };

  const endTimer = async () => {
    stopTick();

    if (sessionId) {
      try {
        const elapsed =
          pauseElapsedRef.current +
          (status === "running"
            ? Date.now() - startTimeRef.current
            : 0);

        const res = await fetch(
          `/api/study/sessions/${sessionId}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              duration_seconds: Math.floor(
                elapsed / 1000
              ),
            }),
          }
        );

        if (!res.ok) {
          console.error(
            "Failed to save session:",
            res.status
          );
        }

        onSessionEnd();
      } catch (error) {
        console.error(
          "Failed to end session:",
          error
        );
      }
    }

    setStatus("idle");
    setFocusSeconds(0);
    setSessionId(null);

    pauseElapsedRef.current = 0;
    startTimeRef.current = 0;
  };

  const startTick = () => {
    stopTick();

    tickRef.current = setInterval(() => {
      const elapsed =
        pauseElapsedRef.current +
        (Date.now() - startTimeRef.current);

      setFocusSeconds(
        Math.floor(elapsed / 1000)
      );
    }, 1000);
  };

  const stopTick = () => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  };

  // Cleanup interval when component unmounts.
  useEffect(() => {
    return () => {
      if (tickRef.current) {
        clearInterval(tickRef.current);
        tickRef.current = null;
      }
    };
  }, []);

  return (
    <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 text-center space-y-6">
      {!pageVisible && status === "running" && (
        <div className="text-sm text-amber-600 dark:text-amber-400">
          ⏸️ Timer paused — switch back to EduNeuro
          to resume
        </div>
      )}

      <div className="space-y-2">
        <p className="text-sm text-muted uppercase tracking-wider font-medium">
          {status === "idle" && "Ready to focus"}
          {status === "running" && "In session"}
          {status === "paused" && "Paused"}
        </p>

        <div className="text-5xl sm:text-7xl font-mono font-bold tracking-tighter">
          {formatStudyTime(focusSeconds)}
        </div>
      </div>

      <div className="flex items-center justify-center gap-3">
        {/* Idle */}
        {status === "idle" && (
          <button
            onClick={startTimer}
            className="px-8 py-3 bg-foreground text-background rounded-xl font-semibold hover:opacity-90 transition-opacity"
          >
            Start Session
          </button>
        )}

        {/* Running */}
        {status === "running" && (
          <>
            <button
              onClick={pauseTimer}
              className="px-5 py-2.5 bg-accent border border-border rounded-xl font-medium hover:bg-foreground/5 transition-colors"
            >
              Pause
            </button>

            <button
              onClick={endTimer}
              className="px-5 py-2.5 border border-border rounded-xl font-medium hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              End
            </button>
          </>
        )}

        {/* Paused */}
        {status === "paused" && (
          <>
            <button
              onClick={resumeTimer}
              className="px-8 py-3 bg-foreground text-background rounded-xl font-semibold hover:opacity-90 transition-opacity"
            >
              Resume
            </button>

            <button
              onClick={endTimer}
              className="px-5 py-2.5 border border-border rounded-xl font-medium hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              End Session
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function formatStudyTime(
  totalSeconds: number
): string {
  const hours = Math.floor(
    totalSeconds / 3600
  );

  const minutes = Math.floor(
    (totalSeconds % 3600) / 60
  );

  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  }

  return `${minutes
    .toString()
    .padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
}