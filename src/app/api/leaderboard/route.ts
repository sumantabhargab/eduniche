/**
 * GET /api/leaderboard
 * Returns global leaderboard based on validated study time.
 */

import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const supabase = await createServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Server not configured." }, { status: 500 });
    }

    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 100);

    // Get top users by total valid study time
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    const currentUserId = sessionData?.session?.user?.id;

    // Aggregate study time per user
    const { data: userStats, error: statsError } = await supabase
      .from("study_sessions")
      .select("user_id, duration_seconds")
      .eq("validation_status", "valid");

    if (statsError) {
      console.error("Leaderboard stats error:", statsError);
      return NextResponse.json({ error: "Failed to load leaderboard." }, { status: 500 });
    }

    // Aggregate by user
    const userTotals: Record<string, number> = {};
    for (const s of (userStats ?? [])) {
      userTotals[s.user_id] = (userTotals[s.user_id] || 0) + (s.duration_seconds || 0);
    }

    // Get profiles for these users
    const userIds = Object.keys(userTotals);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url")
      .in("id", userIds);

    const profileMap = new Map((profiles ?? []).map(p => [p.id, p]));

    // Build leaderboard
    interface LeaderboardEntry {
      user_id: string;
      username: string;
      avatar_url: string | null;
      total_seconds: number;
      total_hours: number;
      total_minutes: number;
      display_time: string;
      rank: number;
      isCurrentUser?: boolean;
    }

    const leaderboard: LeaderboardEntry[] = Object.entries(userTotals)
      .map(([userId, totalSeconds]) => {
        const profile = profileMap.get(userId);
        const totalMinutes = Math.floor(totalSeconds / 60);
        const totalHours = Math.floor(totalMinutes / 60);
        const remainingMinutes = totalMinutes % 60;

        return {
          user_id: userId,
          username: profile?.username || profile?.display_name || "Anonymous",
          avatar_url: profile?.avatar_url || null,
          total_seconds: totalSeconds,
          total_hours: totalHours,
          total_minutes: remainingMinutes,
          display_time: totalHours > 0
            ? `${totalHours}h ${remainingMinutes}m`
            : `${totalMinutes}m`,
        };
      })
      .sort((a, b) => b.total_seconds - a.total_seconds)
      .slice(0, limit)
      .map((entry, i) => ({ ...entry, rank: i + 1 }));

    // Add current user's rank if not in top list
    if (currentUserId && !leaderboard.find(e => e.user_id === currentUserId)) {
      const userTotal = userTotals[currentUserId] || 0;
      const userProfile = profileMap.get(currentUserId);
      const userMinutes = Math.floor(userTotal / 60);
      const userHours = Math.floor(userMinutes / 60);

      leaderboard.push({
        user_id: currentUserId,
        username: userProfile?.username || userProfile?.display_name || "You",
        avatar_url: userProfile?.avatar_url || null,
        total_seconds: userTotal,
        total_hours: userHours,
        total_minutes: userMinutes % 60,
        display_time: userHours > 0 ? `${userHours}h ${userMinutes % 60}m` : `${userMinutes}m`,
        rank: leaderboard.length + 1,
        isCurrentUser: true,
      });
    }

    return NextResponse.json({ leaderboard: leaderboard as any[] });
  } catch (e) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
