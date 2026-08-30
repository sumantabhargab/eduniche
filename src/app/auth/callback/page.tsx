/**
 * Auth callback page at /auth/callback
 * Handles OAuth redirects and checks for username setup.
 */

"use client";

import { useEffect, Suspense } from "react";
import { createBrowserClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";

type AuthEvent = Parameters<
  ReturnType<ReturnType<typeof createBrowserClient>>["auth"]["onAuthStateChange"]
>[0];

function AuthCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createBrowserClient();

  if (!supabase) {
    router.push("/login?error=" + encodeURIComponent("Authentication failed."));
    return null;
  }

  const redirectTo = searchParams.get("redirect") || "/dashboard";

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthEvent, session) => {
        if (event === "INITIAL_SESSION" || event === "SIGNED_IN") {
          if (session?.user) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("username")
              .eq("id", session.user.id)
              .maybeSingle();

            if (!profile?.username) {
              router.push(`/login?redirect=${encodeURIComponent(redirectTo)}`);
            } else {
              router.push(redirectTo);
            }
          } else {
            router.push(
              `/login?error=${encodeURIComponent("Authentication failed.")}`
            );
          }
          subscription.unsubscribe();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase, router, redirectTo]);

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
