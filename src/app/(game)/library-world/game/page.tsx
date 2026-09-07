/**
 * /library-world/game — Among Us style multiplayer game in the virtual library.
 *
 * Uses the (game) route group so it doesn't inherit the /library layout.
 * GameWorld is self-contained with its own state and UI.
 */

"use client";

import { Suspense, useMemo } from "react";
import { GameWorld } from "@/modules/virtual-library/world/among-us";

function LoadingFallback() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="w-16 h-16 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-muted">Loading game...</p>
      </div>
    </div>
  );
}

export default function LibraryGamePage() {
  // Read initial lobby code from URL query params
  const initialLobbyCode = useMemo(() => {
    if (typeof window === "undefined") return undefined;
    const params = new URLSearchParams(window.location.search);
    return params.get("join") || undefined;
  }, []);

  return (
    <Suspense fallback={<LoadingFallback />}>
      <GameWorldWrapper initialLobbyCode={initialLobbyCode} />
    </Suspense>
  );
}

function GameWorldWrapper({ initialLobbyCode }: { initialLobbyCode?: string }) {
  return (
    <GameWorld
      onLeave={() => {
        if (typeof window !== "undefined") {
          window.location.href = "/library";
        }
      }}
      initialLobbyCode={initialLobbyCode}
    />
  );
}
