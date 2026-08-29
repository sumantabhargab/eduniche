/**
 * Success page for payment/upgrade confirmation.
 */

"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

function SuccessInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = searchParams.get("type") || "general";
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timer);
          return 0;
        }
        return c - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <div className="text-6xl mb-6">✓</div>
        <h1 className="text-3xl font-bold mb-3">
          {type === "subscription" ? "Welcome to Premium!" : "Success!"}
        </h1>
        <p className="text-muted mb-8">
          {type === "subscription"
            ? "Your premium subscription is now active. Enjoy all premium features!"
            : "Your action was completed successfully."}
        </p>

        {type === "subscription" && (
          <div className="bg-card border border-border rounded-2xl p-6 mb-8 text-left">
            <h3 className="font-semibold mb-3">What&apos;s unlocked:</h3>
            <ul className="space-y-2 text-sm text-muted">
              <li className="flex items-center gap-2">
                <span className="text-green-600 dark:text-green-400">✓</span>
                Access to all premium content
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-600 dark:text-green-400">✓</span>
                AI Doubt Engine
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-600 dark:text-green-400">✓</span>
                Global live chat
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-600 dark:text-green-400">✓</span>
                Global leaderboard
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-600 dark:text-green-400">✓</span>
                Cosmetic badges
              </li>
            </ul>
          </div>
        )}

        <div className="space-y-3">
          <a
            href="/dashboard"
            className="block w-full px-6 py-3 bg-foreground text-background rounded-xl font-semibold hover:opacity-90 transition-opacity"
          >
            Go to Dashboard
          </a>
          <p className="text-xs text-muted">
            Redirecting in {countdown}...
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[60vh] flex items-center justify-center px-6">
        <div className="animate-pulse text-muted">Loading...</div>
      </div>
    }>
      <SuccessInner />
    </Suspense>
  );
}
