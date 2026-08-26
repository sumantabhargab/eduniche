/**
 * Supabase browser client.
 */

import { createClient } from "@supabase/supabase-js";

export function createBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    // Return null if not configured — components should handle gracefully
    return null;
  }

  return createClient(supabaseUrl, supabaseKey);
}
