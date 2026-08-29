/**
 * GET /api/study/stats
 * Returns user's study statistics.
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
      .eq("validation_status", "valid");

    if (error) {
      console.error("Stats fetch error:", error);
      return NextResponse.json({ error: "Failed to load stats." }, { status: 500 });
    }

    const allSessions = sessions ?? [];

    // Calculate stats
    const totalSeconds = allSessions.reduce((sum, s) => sum + (s.duration_seconds || 0), 0);
    const totalHours = Math.floor(totalSeconds / 3600);
    const totalMinutes = Math.floor((totalSeconds % 3600) / 60);

    // Period-specific
    let periodSeconds = totalSeconds;
    let periodSessions = allSessions.length;

    if (period !== "all") {
      const cutoff = new Date();
      if (period === "today") {
        cutoff.setHours(0, 0, 0, 0);
      } else if (period === "week") {
        cutoff.setDate(cutoff.getDate() - 7);
      } else if (period === "month") {
        cutoff.setDate(cutoff.getDate() - 30);
      }

      const filtered = allSessions.filter(s => new Date(s.started_at) >= cutoff);
      periodSeconds = filtered.reduce((sum, s) => sum + (s.duration_seconds || 0), 0);
      periodSessions = filtered.length;
    }

    const pHours = Math.floor(periodSeconds / 3600);
    const pMinutes = Math.floor((periodSeconds % 3600) / 60);

    // Get user's goal
    const { data: profile } = await supabase
      .from("profiles")
      .select("daily_goal_minutes, timezone")
      .eq("id", session.user.id)
      .maybeSingle();

    const dailyGoal = profile?.daily_goal_minutes ?? 120;

    // Calculate today's progress
    const { data: todaySessions } = await supabase
      .from("study_sessions")
      .select("duration_seconds")
      .eq("user_id", session.user.id)
      .eq("validation_status", "valid")
      .gte("started_at", new Date(new Date().toISOString().split('T')[0]).toISOString());

    const todaySeconds = (todaySessions ?? []).reduce((sum, s) => sum + (s.duration_seconds || 0), 0);
    const todayMinutes = Math.floor(todaySeconds / 60);
    const goalProgress = Math.min(100, Math.round((todayMinutes / dailyGoal) * 100));

    // Calculate streak
    const { data: streakSessions } = await supabase
      .from("study_sessions")
      .select("started_at")
      .eq("user_id", session.user.id)
      .eq("validation_status", "valid")
      .order("started_at", { ascending: true });

    const streak = calculateStreak(streakSessions ?? [], profile?.timezone ?? 'Asia/Kolkata');

    return NextResponse.json({
      period,
      total: { hours: totalHours, minutes: totalMinutes, seconds: totalSeconds },
      periodTotal: { hours: pHours, minutes: pMinutes, seconds: periodSeconds },
      sessions: periodSessions,
      dailyGoal,
      goalProgress,
      todayMinutes,
      streak,
    });
  } catch (e) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}

function calculateStreak(sessions: { started_at: string }[], timezone: string): { current: number; longest: number } {
  if (sessions.length === 0) return { current: 0, longest: 0 };

  const MIN_SESSION_MINUTES = 15;
  const daySet = new Set<string>();

  for (const s of sessions) {
    const date = new Date(s.started_at);
    const localDate = new Date(date.toLocaleString("en-US", { timeZone: timezone }));
    daySet.add(localDate.toISOString().split('T')[0]);
  }

  const days = Array.from(daySet).sort().reverse();
  const today = new Date(new Date().toLocaleString("en-US", { timeZone: timezone }))
    .toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000)
    .toLocaleString("en-US", { timeZone: timezone }).split('T')[0];

  let currentStreak = 0;
  let checkDate = today;

  if (days[0] !== today && days[0] !== yesterday) {
    return { current: 0, longest: days.length > 0 ? 1 : 0 };
  }

  for (const day of days) {
    if (day === checkDate) {
      currentStreak++;
      const prev = new Date(checkDate + 'T00:00:00');
      prev.setDate(prev.getDate() - 1);
      checkDate = prev.toISOString().split('T')[0];
    } else if (day === new Date(Date.now() - 86400000).toISOString().split('T')[0] && currentStreak === 0) {
      currentStreak++;
      const prev = new Date(checkDate + 'T00:00:00');
      prev.setDate(prev.getDate() - 1);
      checkDate = prev.toISOString().split('T')[0];
    } else {
      break;
    }
  }

  return { current: currentStreak, longest: days.length };
}
