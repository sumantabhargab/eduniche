/**
 * /library/world/game — Game challenge mode in the Virtual Library.
 *
 * Redirects to the main world with a dev-mode flag for debugging.
 */
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LibraryWorldGamePage() {
  const router = useRouter();

  useEffect(() => {
    // Open the world in the same tab with game mode flag
    router.replace("/library/world?game=1");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <p className="text-sm text-muted">Loading game mode…</p>
    </div>
  );
}
