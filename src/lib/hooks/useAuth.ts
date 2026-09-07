"use client";

import { createBrowserClient } from "@/lib/supabase/client";
import { useEffect, useState, useCallback } from "react";

interface AuthUser {
  id: string;
  email?: string;
  display_name?: string;
  avatar_url?: string;
  username?: string;
  hasUsername: boolean;
  daily_goal_minutes: number;
  timezone: string;
  role: string;
  plan: "free" | "monthly_premium" | "weekly_premium";
  isPremium: boolean;
  subscription?: {
    plan: string;
    status: string;
    expires_at: string;
  } | null;
  badge_count: number;
  created_at?: string;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsUsername, setNeedsUsername] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/profile", {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUser(data.user as AuthUser);
          setNeedsUsername(data.user.hasUsername === false);
          return;
        }
      }
      // Not authenticated
      setUser(null);
      setNeedsUsername(false);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();

    // Listen for auth state changes (login, logout, token refresh)
    let unsub: (() => void) | undefined;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;

    const init = async () => {
      try {
        const { createBrowserClient } = await import("@/lib/supabase/client");
        const supabase = createBrowserClient();
        if (!supabase) return;

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (event, session) => {
            if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "INITIAL_SESSION") {
              // Refresh profile when auth state changes
              clearTimeout(retryTimer);
              retryTimer = setTimeout(() => fetchProfile(), 100);
            } else if (event === "SIGNED_OUT") {
              setUser(null);
              setNeedsUsername(false);
              setLoading(false);
            }
          }
        );

        unsub = () => subscription.unsubscribe();
      } catch {
        // supabase client init failed silently
      }
    };

    init();

    return () => {
      if (unsub) unsub();
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [fetchProfile]);

  const refresh = useCallback(() => {
    setLoading(true);
    fetchProfile();
  }, [fetchProfile]);

  const isPremium = user?.isPremium ?? false;

  return { user, loading, needsUsername, setNeedsUsername, refresh, isPremium };
}
