/**
 * Leaderboard page at /leaderboard
 * Shows global study-time leaderboard (premium feature).
 */

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/hooks/useAuth";

interface LeaderboardEntry {
  rank: number;
  user_id: string;
  username: string;
  display_time: string;
  total_hours: number;
  total_minutes: number;
  isCurrentUser?: boolean;
}

export default function LeaderboardPage() {
  const { user, loading } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await fetch("/api/leaderboard?limit=50");
        if (res.ok) {
          const data = await res.json();
          setLeaderboard(data.leaderboard || []);
        }
      } catch (e) {
        // ignore
      } finally {
        setLoadingData(false);
      }
    };

    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-pulse text-muted">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-16 text-center">
        <h1 className="text-3xl font-bold mb-4">Leaderboard</h1>
        <p className="text-muted mb-8">Sign in to see the global leaderboard.</p>
        <a href="/login" className="px-6 py-3 bg-foreground text-background rounded-xl font-semibold">
          Sign In
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-bold mb-3">🏆 Global Leaderboard</h1>
        <p className="text-muted">Ranked by total verified study time</p>
      </div>

      {loadingData ? (
        <div className="text-center py-12">
          <div className="animate-pulse text-muted">Loading leaderboard...</div>
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="text-center py-12 bg-card border border-border rounded-2xl">
          <p className="text-muted text-lg">No study data yet.</p>
          <p className="text-sm text-muted mt-2">Be the first to start studying!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Top 3 podium */}
          {leaderboard.length >= 3 && (
            <div className="flex items-end justify-center gap-4 mb-8">
              {/* 2nd place */}
              <PodiumCard entry={leaderboard[1]} rank={2} />
              {/* 1st place */}
              <PodiumCard entry={leaderboard[0]} rank={1} isWinner />
              {/* 3rd place */}
              {leaderboard[2] && <PodiumCard entry={leaderboard[2]} rank={3} />}
            </div>
          )}

          {/* Rest of leaderboard */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            {leaderboard.map((entry, i) => (
              <LeaderboardRow
                key={entry.user_id}
                entry={entry}
                rank={entry.rank || i + 1}
                isCurrentUser={entry.user_id === user.id}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PodiumCard({ entry, rank, isWinner }: { entry: LeaderboardEntry; rank: number; isWinner?: boolean }) {
  const medals = ["🥇", "🥈", "🥉"];
  const heights = ["h-24", "h-20", "h-16"];

  return (
    <div className={`flex flex-col items-center ${isWinner ? "order-2" : rank === 2 ? "order-1" : "order-3"}`}>
      <div className={`w-16 h-16 rounded-full bg-card border-2 flex items-center justify-center text-2xl mb-2 ${
        isWinner ? "border-yellow-500" : rank === 2 ? "border-gray-400" : "border-amber-600"
      }`}>
        {medals[rank - 1]}
      </div>
      <div className="text-sm font-medium truncate max-w-[100px]">
        {entry.username}
      </div>
      <div className="text-xs text-muted font-mono">{entry.display_time}</div>
    </div>
  );
}

function LeaderboardRow({ entry, rank, isCurrentUser }: { entry: LeaderboardEntry; rank: number; isCurrentUser: boolean }) {
  return (
    <div className={`flex items-center gap-4 px-4 py-3 ${
      isCurrentUser ? "bg-foreground/5" : ""
    } ${rank > 1 ? "border-t border-border" : ""}`}>
      <div className="w-8 text-center font-mono text-sm text-muted">
        #{rank}
      </div>
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-medium truncate ${isCurrentUser ? "text-accent" : ""}`}>
          {entry.username}
          {isCurrentUser && <span className="text-xs ml-2">(you)</span>}
        </div>
      </div>
      <div className="text-sm font-mono font-medium">
        {entry.display_time}
      </div>
    </div>
  );
}
