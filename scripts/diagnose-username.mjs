/**
 * Diagnostic: inspect Supabase database for username creation failure
 */

import { createClient } from "@supabase/supabase-js";
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
const service = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  console.log("=== Supabase Diagnostic ===\n");

  // 1. Auth users
  console.log("[1] Auth users:");
  const { data: { users: authUsers } } = await service.auth.admin.listUsers();
  console.log(`  Total: ${authUsers?.length ?? 0}`);
  for (const u of authUsers) {
    console.log(`  - ${u.id} | ${u.email ?? "(none)"} | provider: ${u.app_metadata?.provider}`);
  }

  // 2. Profiles
  console.log("\n[2] Profiles:");
  const { data: profiles } = await service.from("profiles").select("*");
  console.log(`  Total: ${profiles?.length ?? 0}`);
  for (const p of profiles) {
    console.log(`  - ${p.id} | username: ${p.username ?? "(none)"} | role: ${p.role}`);
  }

  // 3. Orphaned auth users
  console.log("\n[3] Users without profiles:");
  const profileIds = new Set((profiles ?? []).map(p => p.id));
  const orphans = authUsers.filter(u => !profileIds.has(u.id));
  console.log(`  Count: ${orphans.length}`);
  for (const u of orphans) {
    console.log(`  - ${u.id} | ${u.email ?? "(none)"}`);
  }

  // 4. RLS policies
  console.log("\n[4] RLS policies on profiles:");
  try {
    const { data: policies } = await service
      .rpc("get_policies", { table_name: "profiles" });
    console.log(`  ${JSON.stringify(policies)}`);
  } catch {
    console.log("  (policy check skipped — using direct RPC)");
  }

  // 5. Try INSERT for orphaned user (service role, bypasses RLS)
  if (orphans.length > 0) {
    const testUser = orphans[0];
    console.log(`\n[5] Testing INSERT for orphaned user: ${testUser.email}`);
    const testUsername = "test_diagnostic_" + Date.now();
    const { data, error } = await service.from("profiles").insert({
      id: testUser.id,
      username: testUsername,
      display_name: testUser.user_metadata?.full_name || testUser.user_metadata?.name || "Test",
      role: "student",
      daily_goal_minutes: 120,
      timezone: "Asia/Kolkata",
      updated_at: new Date().toISOString(),
    }).select("*");

    if (error) {
      console.log(`  ❌ FAILED: ${error.code} — ${error.message}`);
      if (error.details) console.log(`     Details: ${error.details}`);
      if (error.hint) console.log(`     Hint: ${error.hint}`);
    } else {
      console.log(`  ✅ SUCCESS: ${JSON.stringify(data)}`);
      // Clean up
      await service.from("profiles").delete().eq("id", testUser.id);
      console.log("  Cleaned up.");
    }
  }

  // 6. Check auth trigger
  console.log("\n[6] Auth triggers (checking via raw SQL)...");
  // We can't query pg_trigger with anon client — skip
  console.log("  (Skipped — check via Supabase Dashboard SQL editor)");

  // 7. Test with service role INSERT (should always work)
  console.log("\n[7] Testing raw INSERT with service role...");
  const testId = "00000000-0000-0000-0000-000000000001";
  const { data: rawData, error: rawError } = await service.from("profiles").insert({
    id: testId,
    username: "test_raw_del_" + Date.now(),
    display_name: "RawTest",
    role: "student",
    daily_goal_minutes: 120,
    timezone: "Asia/Kolkata",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).select("*");

  if (rawError) {
    console.log(`  ❌ RAW INSERT FAILED: ${rawError.code} — ${rawError.message}`);
    if (rawError.details) console.log(`     Details: ${rawError.details}`);
  } else {
    console.log(`  ✅ RAW INSERT succeeded`);
    await service.from("profiles").delete().eq("id", testId);
    console.log("  Cleaned up.");
  }

  // 8. Check if auth trigger creates profiles on new user signup
  console.log("\n[8] Auth triggers on auth.users (via Supabase Dashboard SQL editor):");
  console.log("  Run this in Supabase Dashboard > SQL Editor:");
  console.log("  SELECT tgname, pg_get_triggerdef(oid) FROM pg_trigger WHERE tgrelid = 'auth.users'::regclass;");

  console.log("\n=== Done ===");
}

main().catch(console.error);
