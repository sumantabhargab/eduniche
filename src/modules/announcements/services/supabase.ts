/**
 * Supabase client accessor for the Announcements module.
 *
 * Returns the singleton browser client from src/lib/supabase/client.ts.
 * Returns null when Supabase env vars are missing so callers can degrade gracefully.
 */

import { createBrowserClient } from "@/lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";

export type { SupabaseClient };

let cached: SupabaseClient | null | undefined;

export function getAnnouncementsSupabase(): SupabaseClient | null {
  if (cached !== undefined) return cached;
  cached = createBrowserClient();
  return cached;
}
