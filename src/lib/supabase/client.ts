/**
 * Supabase SSR-aware browser client.
 *
 * Uses @supabase/ssr's createBrowserClient which syncs the auth session
 * to cookies so that server-side route handlers (createServerClient)
 * can read it. Plain @supabase/supabase-js createClient stores sessions
 * in localStorage only — server routes cannot see them.
 *
 * Singleton: the same client instance is returned for the lifetime of
 * the page to prevent GoTrueClient duplicate-instance warnings.
 */

import { createBrowserClient as createSsrBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null | undefined;

export function createBrowserClient(): SupabaseClient | null {
  if (cached !== undefined) return cached;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    cached = null;
    return null;
  }

  cached = createSsrBrowserClient(supabaseUrl, supabaseKey);
  return cached;
}
