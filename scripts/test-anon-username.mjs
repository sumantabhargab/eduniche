/**
 * Simulates the exact /api/auth/username flow using anon client with cookies
 * to find the real RLS error during INSERT.
 */

import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { readFileSync } from "fs";
import { resolve } from "path";

function loadEnv() {
  try {
    const envContent = readFileSync(resolve(".env.local"), "utf-8");
    const vars = {};
    for (const line of envContent.split("\n")) {
      if (line.startsWith("#") || !line.includes("=")) continue;
      const [key, ...rest] = line.split("=");
      vars[key.trim()] = rest.join("=").trim().replace(/^["']|["']$/g, "");
    }
    return vars;
  } catch {
    return { ...process.env };
  }
}

const env = loadEnv();
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

const service = createClient(url, serviceKey);

async function main() {
  console.log("=== Anon-client INSERT test ===\n");

  // Get the orphaned user
  const { data: { users: authUsers } } = await service.auth.admin.listUsers();
  const { data: profiles } = await service.from("profiles").select("id");
  const profileIds = new Set((profiles ?? []).map(p => p.id));
  const orphans = authUsers.filter(u => !profileIds.has(u.id));

  if (orphans.length === 0) {
    console.log("No orphaned users to test against. Create a new OAuth user first.");
    return;
  }

  const testUser = orphans[0];
  console.log("Test user:", testUser.id, testUser.email);

  // Create an anon client that signs in as this user via impersonation
  // We can't easily do this — but we can create an SSR client and test RLS that way

  // Approach: use generateLink to create a magic link, then sign in
  const { data: linkData, error: linkError } = await service.auth.admin.generateLink({
    type: "magiclink",
    email: testUser.email,
  });

  if (linkError) {
    console.log("Can't generate magic link:", linkError.message);
    console.log("Will test by simulating RLS with anon key directly...\n");

    // Test: anon key INSERT should fail with RLS error
    const anon = createClient(url, key);
    console.log("[Anon INSERT test — should fail with RLS]:");
    const { data: anonInsert, error: anonError } = await anon.from("profiles").insert({
      id: testUser.id,
      username: "test_anon_" + Date.now(),
      display_name: "Anon Test",
      role: "student",
      daily_goal_minutes: 120,
      timezone: "Asia/Kolkata",
      updated_at: new Date().toISOString(),
    }).select("*");

    if (anonError) {
      console.log(`  ❌ Error: ${anonError.code} — ${anonError.message}`);
      if (anonError.details) console.log(`     Details: ${anonError.details}`);
      if (anonError.hint) console.log(`     Hint: ${anonError.hint}`);
    } else {
      console.log(`  ✅ Anon INSERT succeeded (no RLS blocking):`, anonInsert);
      await anon.from("profiles").delete().eq("id", testUser.id);
    }

    return;
  }

  console.log("Got link, but will not follow it (security). Exiting.");
}

main().catch(console.error);
