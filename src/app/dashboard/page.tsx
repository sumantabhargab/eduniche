/**
 * Dashboard page at /dashboard
 * Shows study stats, timer, goals, streak, and quick actions.
 */

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { EduNeuroLoader, StatCardSkeleton } from "@/components/loading";
import BillboardSlot from "@/components/BillboardSlot";

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

// Inline SVG icons — replaces emoji system with consistent visual language.
function IconFire({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22c-4.97 0-9-3.03-9-7 0-2.9 1.73-5.43 4.25-6.62.38-.17.57-.6.44-.99-.25-.75.35-1.5 1.12-1.34C10.57 6.5 11.5 8.5 11.5 10.5c0 .5.05 1 .14 1.48.09.5.54.85 1.05.85h.04c1.1 0 2-.9 2-2 0-.5-.15-1-.4-1.4-.1-.2-.1-.4 0-.6.2-.4.7-.5 1.1-.3.3.2.7.3 1.1.3C17.5 8 19 9.5 19 11.5c0 3.97-4.03 7-9 7z" fill="currentColor" fillOpacity="0.15" />
    </svg>
  );
}

function IconClipboard({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    </svg>
  );
}

function IconTarget({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

function IconChat({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function IconPencil({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 4 21l.5-3.5L17 3z" />
    </svg>
  );
}

function IconBook({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

function IconTrophy({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  );
}

function IconUser({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState<Stats | null>(null);
  const [period, setPeriod] = useState<Period>("today");
  const [gateData, setGateData] = useState<{
    activePlan: { id: string; paperId: string; paperShortName: string; progress: number; completedItems: number; totalItems: number; title: string } | null;
    hasDiagnostic: boolean;
    doubtUsage: { used: number; limit: number; remaining: number } | null;
  }>({ activePlan: null, hasDiagnostic: false, doubtUsage: null });

  // Fetch GATE-specific data (active plan, diagnostic status, doubt usage)
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    async function loadGateData() {
      try {
        const plansRes = await fetch("/api/gate/plans?status=active");
        let activePlan: typeof gateData.activePlan = null;
        if (plansRes.ok) {
          const plansData = await plansRes.json();
          const plan = plansData.plans?.[0];
          if (plan) {
            activePlan = {
              id: plan.id,
              paperId: plan.paper_id,
              paperShortName: plan.paper_short_name || plan.paper_id?.toUpperCase() || "GATE",
              progress: plan.progress || 0,
              completedItems: plan.completedItems || 0,
              totalItems: plan.totalItems || 0,
              title: plan.title || "Active Plan",
            };
          }
        }

        const doubtRes = await fetch("/api/ai/doubt/free");
        let doubtUsage: typeof gateData.doubtUsage = null;
        if (doubtRes.ok) {
          const doubtData = await doubtRes.json();
          if (doubtData.limit !== undefined) {
            doubtUsage = {
              used: doubtData.used || 0,
              limit: doubtData.limit,
              remaining: doubtData.remaining ?? doubtData.limit - (doubtData.used || 0),
            };
          }
        }

        if (!cancelled) {
          setGateData({
            activePlan,
            hasDiagnostic: activePlan !== null,
            doubtUsage,
          });
        }
      } catch {
        // silently fail
      }
    }

    loadGateData();
    return () => { cancelled = true; };
  }, [user]);

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

  // Loading state — use EduNeuroLoader instead of generic spinner.
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <EduNeuroLoader size="md" variant="page" />
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
          icon={<IconFire className="w-4 h-4 text-amber-500" />}
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

      {/* GATE Preparation Hub */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">
          GATE Preparation
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Active Plan Card */}
          {gateData.activePlan ? (
            <Link href={`/gate/${gateData.activePlan.paperId}/plan`} className="block bg-card border border-border rounded-2xl p-5 hover:border-foreground/30 transition-colors">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-muted"><IconClipboard /></span>
                <h3 className="text-sm font-medium">Study Plan</h3>
              </div>
              <p className="text-xs text-muted mb-2">{gateData.activePlan.paperShortName}</p>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent rounded-full"
                    style={{ width: `${gateData.activePlan.progress}%` }}
                  />
                </div>
                <span className="text-xs text-muted">{gateData.activePlan.progress}%</span>
              </div>
              <p className="text-xs text-muted-light">
                {gateData.activePlan.completedItems}/{gateData.activePlan.totalItems} tasks done
              </p>
            </Link>
          ) : (
            <Link href="/gate" className="block bg-card border border-border rounded-2xl p-5 hover:border-foreground/30 transition-colors group">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-muted"><IconTarget /></span>
                <h3 className="text-sm font-medium">Take Diagnostic</h3>
              </div>
              <p className="text-xs text-muted mb-3">
                Take a free 10-question diagnostic test to understand your strengths and weaknesses.
              </p>
              <span className="text-xs text-accent group-hover:underline">Start now &rarr;</span>
            </Link>
          )}

          {/* Doubt Engine Card */}
          <Link href="/chat" className="block bg-card border border-border rounded-2xl p-5 hover:border-foreground/30 transition-colors group">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-muted"><IconChat /></span>
              <h3 className="text-sm font-medium">AI Doubt Engine</h3>
            </div>
            {gateData.doubtUsage ? (
              <>
                <p className="text-xs text-muted mb-2">
                  {gateData.doubtUsage.remaining > 0
                    ? `${gateData.doubtUsage.remaining} free doubts remaining today`
                    : "Daily limit reached"}
                </p>
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent rounded-full transition-all"
                    style={{ width: `${(gateData.doubtUsage.used / gateData.doubtUsage.limit) * 100}%` }}
                  />
                </div>
              </>
            ) : (
              <p className="text-xs text-muted mb-2">Get instant AI-powered help with your GATE doubts.</p>
            )}
            <span className="text-xs text-accent group-hover:underline">Ask a doubt &rarr;</span>
          </Link>

          {/* Practice Card */}
          <Link href="/gate" className="block bg-card border border-border rounded-2xl p-5 hover:border-foreground/30 transition-colors group">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-muted"><IconPencil /></span>
              <h3 className="text-sm font-medium">Practice Papers</h3>
            </div>
            <p className="text-xs text-muted mb-3">
              Generate practice papers from real GATE PYQs across 20 branches.
            </p>
            <span className="text-xs text-accent group-hover:underline">Choose branch &rarr;</span>
          </Link>
        </div>
      </section>

      {/* Sponsored Partner */}
      <BillboardSlot slotId="dashboard_featured" intervalMs={14_000} />

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
          href="/gate"
          label="GATE Prep"
          icon={<IconTarget className="w-6 h-6" />}
        />

        <QuickAction
          href="/library"
          label="Library"
          icon={<IconBook className="w-6 h-6" />}
        />

        <QuickAction
          href="/leaderboard"
          label="Leaderboard"
          icon={<IconTrophy className="w-6 h-6" />}
        />

        <QuickAction
          href="/profile"
          label="Profile"
          icon={<IconUser className="w-6 h-6" />}
        />
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4 md:p-6">
      <div className="text-xs text-muted uppercase tracking-wider font-medium mb-2">
        {label}
      </div>

      <div className="text-2xl md:text-3xl font-bold font-mono flex items-center gap-1.5">
        {icon}
        {value}
      </div>
    </div>
  );
}

function QuickAction({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className="bg-card border border-border rounded-2xl p-6 text-center hover:border-foreground/30 transition-colors group"
    >
      <div className="flex justify-center mb-3 text-muted group-hover:text-foreground transition-colors group-hover:scale-110 transition-transform">
        {icon}
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
        <div className="text-sm text-amber-600 dark:text-amber-400 flex items-center justify-center gap-2">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
          Timer paused — switch back to EduNeuro to resume
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