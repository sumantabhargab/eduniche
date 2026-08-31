/**
 * Virtual Library World — /library/world
 *
 * The main 2D explorable multiplayer library experience.
 * "Enter the library" → full-screen canvas with WASD movement,
 * real-time multiplayer presence, room chat, and study timer.
 */

"use client";

import { Suspense } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import VirtualLibraryWorld from "@/modules/virtual-library/world/VirtualLibraryWorld";

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center">
        <div className="w-16 h-16 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-muted">Entering the library...</p>
      </div>
    </div>
  );
}

function LibraryWorldGate() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Dev bypass: ?dev=1 skips auth (local testing only)
  const [devMode] = useState(() => typeof window !== "undefined" && new URLSearchParams(window.location.search).has("dev"));

  useEffect(() => {
    if (!loading && !user && !devMode) {
      router.push("/login?redirect=/library/world");
    }
  }, [loading, user, router, devMode]);

  if (loading) return <LoadingFallback />;
  if (!user && !devMode) return null;

  return <VirtualLibraryWorld devMode={devMode} />;
}

export default function LibraryWorldPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <LibraryWorldGate />
    </Suspense>
  );
}
