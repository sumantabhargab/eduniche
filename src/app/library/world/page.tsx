/**
 * /library/world — Virtual Library World
 *
 * Renders the full-screen interactive 2D multiplayer library.
 * Uses the same VirtualLibraryWorld component as /library-world.
 */

"use client";

import { useState, useEffect, Suspense } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useRouter } from "next/navigation";
import VirtualLibraryWorld from "@/modules/virtual-library/world/VirtualLibraryWorld";

function LoadingFallback() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
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

  const [devMode] = useState(() =>
    typeof window !== "undefined" && new URLSearchParams(window.location.search).has("dev")
  );

  useEffect(() => {
    if (!loading && !user && !devMode) {
      // World is accessible without login — allow guest entry
      // VirtualLibraryWorld handles demo mode internally
    }
  }, [loading, user, router, devMode]);

  if (loading) return <LoadingFallback />;

  return <VirtualLibraryWorld devMode={devMode} />;
}

export default function LibraryWorldPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <LibraryWorldGate />
    </Suspense>
  );
}
