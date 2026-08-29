/**
 * Supabase browser client.
 *
 * Returns a stable singleton instance for the lifetime of the page.
 * Multiple calls from the same page return the same client, preventing
 * GoTrueClient duplicate-instance warnings and useCallback dependency churn.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null | undefined;

export function createBrowserClient(): SupabaseClient | null {
  if (cached !== undefined) return cached;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    cached = null;
    return null;
  }

  cached = createClient(supabaseUrl, supabaseKey);
  return cached;
}
