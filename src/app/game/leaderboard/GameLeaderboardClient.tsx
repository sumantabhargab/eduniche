/**
 * Game leaderboard client — top 10 arcade scores with branch filter.
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { BRANCHES } from "@/modules/game/branches";

interface ArcadeLeaderboardEntry {
  rank: number;
  user_id: string;
  username: string;
  branch: string;
  score: number;
  correct: number;
  total: number;
  accuracy: string;
  bestCombo: number;
}

function MedalEmoji({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-xl">🥇</span>;
  if (rank === 2) return <span className="text-lg">🥈</span>;
  if (rank === 3) return <span className="text-lg">🥉</span>;
  return <span className="text-sm font-mono text-muted">#{rank}</span>;
}

export default function GameLeaderboardClient() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const branchParam = searchParams.get("branch");

  const [leaderboard, setLeaderboard] = useState<ArcadeLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState<string>(branchParam || "all");

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const url = selectedBranch === "all"
          ? "/api/game/leaderboard"
          : `/api/game/leaderboard?branch=${encodeURIComponent(selectedBranch)}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setLeaderboard(data.leaderboard || []);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [selectedBranch]);

  const currentUserId = user?.id;

  return (
    <div className="min-h-screen bg-[#0a0e17] text-gray-200">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        {/* Header */}
        <div className="text-center mb-8">
          <Link
            href="/game"
            className="inline-block text-xs text-cyan-500 hover:text-cyan-400 mb-4 transition-colors"
          >
            ← Back to Arcade
          </Link>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-1">ARCADE</h1>
          <p className="text-sm text-gray-500">Top 10 Players</p>
        </div>

        {/* Branch filter */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2 justify-center">
            <button
              onClick={() => setSelectedBranch("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedBranch === "all"
                  ? "bg-cyan-500 text-gray-900"
                  : "border border-gray-700 text-gray-400 hover:text-gray-200 hover:border-gray-600"
              }`}
            >
              All Branches
            </button>
            {BRANCHES.map((b) => (
              <button
                key={b.id}
                onClick={() => setSelectedBranch(b.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  selectedBranch === b.id
                    ? "bg-cyan-500 text-gray-900"
                    : "border border-gray-700 text-gray-400 hover:text-gray-200 hover:border-gray-600"
                }`}
              >
                {b.code}
              </button>
            ))}
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-16">
            <div className="text-xs text-cyan-500 font-mono tracking-widest animate-pulse">LOADING LEADERBOARD…</div>
          </div>
        )}

        {/* Empty state */}
        {!loading && leaderboard.length === 0 && (
          <div className="text-center py-16 border border-gray-800 rounded-2xl">
            <p className="text-gray-500 text-lg">No scores yet.</p>
            <p className="text-gray-600 text-sm mt-2">Be the first to play and top the leaderboard!</p>
            <Link
              href="/game"
              className="inline-block mt-6 px-6 py-2.5 bg-cyan-500 text-gray-900 font-bold text-sm rounded-lg hover:bg-cyan-400 transition-colors"
            >
              PLAY NOW
            </Link>
          </div>
        )}

        {/* Leaderboard */}
        {!loading && leaderboard.length > 0 && (
          <div className="space-y-2">
            {/* Top 3 podium */}
            {leaderboard.length >= 3 && (
              <div className="flex items-end justify-center gap-4 mb-8">
                {/* 2nd */}
                <PodiumCard entry={leaderboard[1]} rank={2} />
                {/* 1st */}
                <PodiumCard entry={leaderboard[0]} rank={1} />
                {/* 3rd */}
                <PodiumCard entry={leaderboard[2]} rank={3} />
              </div>
            )}

            {/* Rest of the list */}
            <div className="border border-gray-800 rounded-2xl overflow-hidden">
              {leaderboard.map((entry, i) => {
                const isCurrentUser = currentUserId === entry.user_id;
                const showPodium = i < 3 && leaderboard.length >= 3;
                if (showPodium) return null;

                return (
                  <LeaderboardRow
                    key={entry.user_id}
                    entry={entry}
                    isCurrentUser={isCurrentUser}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PodiumCard({ entry, rank }: { entry: ArcadeLeaderboardEntry; rank: number }) {
  const borderColors = ["border-yellow-500", "border-gray-400", "border-amber-600"];
  const glowColors = ["shadow-[0_0_20px_-4px_rgba(234,179,8,0.3)]", "", "shadow-[0_0_20px_-4px_rgba(180,83,9,0.2)]"];

  const branchInfo = BRANCHES.find(b => b.id === entry.branch);

  return (
    <div className={`flex flex-col items-center ${rank === 1 ? "order-2" : rank === 2 ? "order-1" : "order-3"}`}>
      <div className={`w-16 h-16 rounded-full bg-gray-900 border-2 flex items-center justify-center mb-2 ${borderColors[rank - 1]} ${glowColors[rank - 1]}`}>
        <MedalEmoji rank={rank} />
      </div>
      <div className="text-sm font-medium text-white truncate max-w-[120px]">
        {entry.username}
      </div>
      {branchInfo && (
        <div className="text-[10px] text-gray-500 font-mono">{branchInfo.code}</div>
      )}
      <div className="text-sm font-mono font-bold text-cyan-400">
        {entry.score.toLocaleString()}
      </div>
    </div>
  );
}

function LeaderboardRow({ entry, isCurrentUser }: { entry: ArcadeLeaderboardEntry; isCurrentUser: boolean }) {
  const branchInfo = BRANCHES.find(b => b.id === entry.branch);

  return (
    <div className={`flex items-center gap-3 px-4 py-3 transition-colors ${
      isCurrentUser ? "bg-cyan-500/10" : "bg-gray-900/30"
    } border-b border-gray-800 last:border-b-0`}>
      <div className="w-8 text-center">
        <span className="font-mono text-sm text-gray-500">#{entry.rank}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-medium truncate ${isCurrentUser ? "text-cyan-400" : "text-gray-200"}`}>
          {entry.username}
          {isCurrentUser && <span className="text-xs ml-2 text-cyan-500">(you)</span>}
        </div>
        {branchInfo && (
          <div className="text-[10px] text-gray-600 font-mono">{branchInfo.code}</div>
        )}
      </div>
      <div className="text-right">
        <div className="text-sm font-mono font-bold text-cyan-400">
          {entry.score.toLocaleString()}
        </div>
        <div className="text-[10px] text-gray-600">
          {entry.accuracy} · ×{entry.bestCombo}
        </div>
      </div>
    </div>
  );
}
