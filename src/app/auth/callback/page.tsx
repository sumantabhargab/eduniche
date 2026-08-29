/**
 * Auth callback page at /auth/callback
 * Handles OAuth redirects and checks for username setup.
 */

"use client";

import { useEffect, Suspense } from "react";
import { createBrowserClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";

function AuthCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createBrowserClient();

  useEffect(() => {
    if (!supabase) {
      router.push("/login?error=" + encodeURIComponent("Authentication failed."));
      return;
    }

    const handleCallback = async () => {
      const redirectTo = searchParams.get("redirect") || "/dashboard";

      // Exchange code for session
      const { data, error } = await supabase.auth.getSession();

      if (error || !data?.session) {
        router.push(`/login?error=${encodeURIComponent("Authentication failed.")}`);
        return;
      }

      // Check if profile needs username
      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", data.session.user.id)
        .maybeSingle();

      if (!profile?.username) {
        router.push(`/login?redirect=${encodeURIComponent(redirectTo)}`);
      } else {
        router.push(redirectTo);
      }
    };

    handleCallback();
  }, [supabase, router, searchParams]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="animate-pulse text-muted">Signing you in...</div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-pulse text-muted">Signing you in...</div>
      </div>
    }>
      <AuthCallbackInner />
    </Suspense>
  );
}
