/**
 * Game leaderboard page at /game/leaderboard
 * Shows top 10 arcade scores across all branches or filtered by branch.
 */

import { Suspense } from "react";
import GameLeaderboardClient from "./GameLeaderboardClient";

export default function GameLeaderboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0a0e17] text-gray-200 flex items-center justify-center">
          <div className="text-xs text-cyan-500 font-mono tracking-widest animate-pulse">LOADING…</div>
        </div>
      }
    >
      <GameLeaderboardClient />
    </Suspense>
  );
}
