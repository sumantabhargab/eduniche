/**
 * Supabase SSR-aware server client for server components and route handlers.
 * Uses @supabase/ssr for proper cookie-based session management.
 * Handles session persistence across requests via HTTP-only cookies.
 */

import { createClient } from "@supabase/supabase-js";
import { createServerClient as createSsrClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Creates a Supabase server client with cookie-based session management.
 * Use in Server Components, Route Handlers, and Server Actions.
 * This client reads sessions from cookies and writes cookie updates
 * back to the response via the Next.js cookies() API.
 *
 * IMPORTANT: This function is async — always await it.
 */
export async function createServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

  const cookieStore = await cookies();

  return createSsrClient(supabaseUrl, supabaseKey, {
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
 * Supabase service-role client for server-side operations that need
 * to bypass RLS (e.g. API route handlers writing to the database).
 * Never expose this client to the browser.
 * No cookie handling needed — uses service role key directly.
 */

export function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
