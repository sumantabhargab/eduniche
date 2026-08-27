/**
 * Admin authentication utilities.
 *
 * All functions here operate server-side only.
 * They use the Supabase server client and never expose
 * credentials to the browser.
 */

import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import type { AdminSession } from "../types";

/**
 * Get the current session and verify admin role.
 * Returns the session if admin, null otherwise.
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  const supabase = createServerClient();
  if (!supabase) return null;

  const cookieStore = await cookies();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session?.user) return null;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .maybeSingle();

  if (profileError || !profile || profile.role !== "admin") return null;

  return {
    user: {
      id: session.user.id,
      email: session.user.email ?? "",
      role: profile.role,
    },
  };
}

/**
 * Require admin session — redirects to login if not authenticated.
 * Use in Server Components and Route Handlers.
 */
export async function requireAdmin(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }
  return session;
}

/**
 * Admin login with email + password.
 * Returns session data on success, null on failure.
 */
export async function adminLogin(
  email: string,
  password: string
): Promise<{ session: AdminSession | null; error: string | null }> {
  const supabase = createServerClient();
  if (!supabase) {
    return { session: null, error: "Server not configured." };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    return { session: null, error: error?.message ?? "Invalid credentials." };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle();

  if (profileError || !profile || profile.role !== "admin") {
    await supabase.auth.signOut();
    return { session: null, error: "Access denied. Admin only." };
  }

  return {
    session: {
      user: {
        id: data.user.id,
        email: data.user.email ?? "",
        role: profile.role,
      },
    },
    error: null,
  };
}

/**
 * Log out the current session.
 */
export async function adminLogout(): Promise<void> {
  const supabase = createServerClient();
  if (supabase) {
    await supabase.auth.signOut();
  }
}
