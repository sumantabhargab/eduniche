/**
 * GET /api/study/stats
 * Returns user's study statistics with period filtering.
 */

import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const supabase = await createServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Server not configured." }, { status: 500 });
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const url = new URL(request.url);
    const period = url.searchParams.get("period") || "all";

    // Get valid sessions for this user
    const { data: sessions, error } = await supabase
      .from("study_sessions")
      .select("*")
      .eq("user_id", session.user.id)
      .eq("validation_status", "valid")
      .order("started_at", { ascending: true });

    if (error) {
      console.error("Stats fetch error:", error);
      return NextResponse.json({ error: "Failed to load stats." }, { status: 500 });
    }

    const allSessions = sessions ?? [];

    // Calculate total stats
    const totalSeconds = allSessions.reduce((sum, s) => sum + (s.duration_seconds || 0), 0);
    const totalHours = Math.floor(totalSeconds / 3600);
    const totalMinutes = Math.floor((totalSeconds % 3600) / 60);

    // Period filtering (server-side for accuracy)
    let periodSessions = allSessions;
    let cutoff: Date | null = null;

    if (period === "today") {
      cutoff = new Date();
      cutoff.setHours(0, 0, 0, 0);
    } else if (period === "week") {
      cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 7);
    } else if (period === "month") {
      cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 30);
    }

    if (cutoff) {
      periodSessions = allSessions.filter(s => new Date(s.started_at) >= cutoff);
    }

    const periodSeconds = periodSessions.reduce((sum, s) => sum + (s.duration_seconds || 0), 0);
    const pHours = Math.floor(periodSeconds / 3600);
    const pMinutes = Math.floor((periodSeconds % 3600) / 60);

    // Get user's goal
    const { data: profile } = await supabase
      .from("profiles")
      .select("daily_goal_minutes, timezone")
      .eq("id", session.user.id)
      .maybeSingle();

    const dailyGoal = profile?.daily_goal_minutes ?? 120;
    const userTimezone = profile?.timezone || "Asia/Kolkata";

    // Calculate today's progress (timezone-aware)
    const todayStr = new Date().toLocaleDateString("en-CA", { timeZone: userTimezone }); // YYYY-MM-DD in user's TZ
    const todaySessions = allSessions.filter(s => {
      const sessionDate = new Date(s.started_at).toLocaleDateString("en-CA", { timeZone: userTimezone });
      return sessionDate === todayStr;
    });
    const todaySeconds = todaySessions.reduce((sum, s) => sum + (s.duration_seconds || 0), 0);
    const todayMinutes = Math.floor(todaySeconds / 60);
    const goalProgress = Math.min(100, Math.round((todayMinutes / dailyGoal) * 100));

    // Calculate streak (timezone-aware)
    const streak = calculateStreak(allSessions, userTimezone);

    return NextResponse.json({
      period,
      total: { hours: totalHours, minutes: totalMinutes },
      periodTotal: { hours: pHours, minutes: pMinutes },
      sessions: periodSessions.length,
      dailyGoal,
      goalProgress,
      todayMinutes,
      streak,
    });
  } catch (e) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}

/**
 * Calculates current and longest study streak in days.
 * Uses timezone-aware date grouping — respects the user's local timezone.
 */
function calculateStreak(sessions: { started_at: string }[], timezone: string): { current: number; longest: number } {
  if (sessions.length === 0) return { current: 0, longest: 0 };

  const MIN_SESSION_MINUTES = 15;

  // Group sessions by local date
  const daySet = new Set<string>();
  for (const s of sessions) {
    const localDate = new Date(s.started_at).toLocaleDateString("en-CA", { timeZone: timezone }); // YYYY-MM-DD
    daySet.add(localDate);
  }

  const days = Array.from(daySet).sort().reverse();
  const today = new Date().toLocaleDateString("en-CA", { timeZone: timezone });

  // Check if streak is alive (today or yesterday)
  const yesterday = new Date(Date.now() - 86400000).toLocaleDateString("en-CA", { timeZone: timezone });
  if (days[0] !== today && days[0] !== yesterday) {
    return { current: 0, longest: days.length > 0 ? 1 : 0 };
  }

  // Count consecutive days
  let currentStreak = 0;
  let checkDate = today;

  for (const day of days) {
    if (day === checkDate) {
      currentStreak++;
      // Go back one day
      const d = new Date(checkDate + "T12:00:00Z");
      d.setUTCDate(d.getUTCDate() - 1);
      checkDate = d.toISOString().split('T')[0];
    } else {
      break;
    }
  }

  return { current: currentStreak, longest: days.length };
}
