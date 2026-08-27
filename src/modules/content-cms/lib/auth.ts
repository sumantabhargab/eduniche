/**
 * Admin authentication utilities.
 *
 * Login/logout operations use a raw Supabase client (no cookie management)
 * because they run in Route Handlers where cookies() is read-only.
 * Session verification (getAdminSession, requireAdmin) uses the SSR-aware
 * client which properly reads sessions from cookies in Server Components
 * and middleware.
 */

import { NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { redirect } from "next/navigation";
import type { AdminSession } from "../types";

// Raw client for login/logout (no cookie management needed)
function createRawClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

// SSR-aware client for Server Components and middleware
// Must be called with an async cookies() context
export async function createSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;

  const cookieStore = await import("next/headers").then((m) => m.cookies());

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      },
    },
  });
}

/**
 * Create SSR-aware client for a Route Handler, reading cookies from the
 * request and writing cookie updates to the NextResponse.
 */
export function createRouteSupabaseClient(
  request: Request,
  response: NextResponse
) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        const cookieHeader = request.headers.get("cookie") || "";
        return cookieHeader
          .split(";")
          .map((c) => {
            const [name, ...rest] = c.trim().split("=");
            return { name, value: rest.join("=") };
          })
          .filter((c) => c.name);
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });
}

/**
 * Get the current session and verify admin role.
 * Returns the session if admin, null otherwise.
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

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
 * Pass an SSR-aware Supabase client so session cookies are persisted
 * to the response via onAuthStateChange → applyServerStorage.
 */
export async function adminLogin(
  supabase: SupabaseClient,
  email: string,
  password: string
): Promise<{ session: AdminSession | null; error: string | null }> {
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
  const supabase = createRawClient();
  if (supabase) {
    await supabase.auth.signOut();
  }
}
