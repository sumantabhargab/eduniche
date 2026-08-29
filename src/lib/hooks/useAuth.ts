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
      const res = await fetch("/api/auth/profile");
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUser(data.user as AuthUser);
          setNeedsUsername(data.user.hasUsername === false);
        }
      }
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const refresh = useCallback(() => {
    setLoading(true);
    fetchProfile();
  }, [fetchProfile]);

  const isPremium = user?.isPremium ?? false;

  return { user, loading, needsUsername, setNeedsUsername, refresh, isPremium };
}
