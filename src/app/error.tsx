"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Route Error]", error.message, error.digest);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <h2 className="text-2xl font-bold mb-3">Something went wrong</h2>
        <p className="text-sm text-muted mb-2">
          We encountered an unexpected error.
        </p>
        <p className="text-xs text-muted mb-6 font-mono">
          {error.message}
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex px-6 py-3 bg-foreground text-background rounded-xl font-medium text-sm"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex px-6 py-3 border border-border rounded-xl font-medium text-sm"
          >
            Go to Homepage
          </a>
        </div>
      </div>
    </div>
  );
}
