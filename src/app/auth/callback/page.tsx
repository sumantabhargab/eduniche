/**
 * Auth callback page at /auth/callback
 * Handles OAuth redirects and checks for username setup.
 *
 * Listens for SIGNED_IN event (which fires after Google OAuth redirect)
 * and also checks for an existing session (for email sign-in where
 * the user is already authenticated but needs to complete setup).
 */

"use client";

import { useEffect, Suspense, useRef } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createBrowserClient } from "@/lib/supabase/client";
import { EduNeuroLoader } from "@/components/loading";
import { useRouter, useSearchParams } from "next/navigation";

type AuthClient = NonNullable<ReturnType<typeof createBrowserClient>>;

function AuthCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase: AuthClient | null = createBrowserClient();
  const handledRef = useRef(false);

  if (!supabase) {
    router.push("/login?error=" + encodeURIComponent("Authentication failed."));
    return null;
  }

  const redirectTo = searchParams.get("redirect") || "/dashboard";

  useEffect(() => {
    if (handledRef.current) return;

    const handleAuth = async (session: { user?: { id: string } } | null) => {
      if (handledRef.current) return;
      handledRef.current = true;

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
    };

    const handleEvent = async (event: string, session: { user?: { id: string } } | null) => {
      if (event === "SIGNED_IN" || event === "INITIAL_SESSION") {
        await handleAuth(session);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleEvent);

    // Immediately check for an existing session (for email/password where
    // the user is already authenticated but we need to verify profile)
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await handleAuth(session);
      }
    })();

    // Safety timeout
    const timeout = setTimeout(() => {
      if (!handledRef.current) {
        handledRef.current = true;
        router.push(`/login?error=${encodeURIComponent("Authentication timed out.")}`);
      }
    }, 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [supabase, router, redirectTo]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <EduNeuroLoader size="md" variant="auth" />
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[60vh] flex items-center justify-center">
        <EduNeuroLoader size="md" variant="auth" />
      </div>
    }>
      <AuthCallbackInner />
    </Suspense>
  );
}