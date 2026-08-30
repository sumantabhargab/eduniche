// Simulate the exact /api/auth/username flow to find the real failure point
// Uses @supabase/supabase-js — must be transpiled, so we use a .ts approach via tsc or tsx with ESM

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function main() {
  console.log("=== Testing username creation flow ===\n");
  console.log("Supabase URL:", url);

  const anon = createClient(url, key);
  const service = createClient(url, serviceKey);

  // Test 1: Check if there's an authenticated user
  console.log("\n[1] Getting current authenticated user...");
  const { data: { user } } = await anon.auth.getUser();
  if (!user) {
    console.log("  ❌ No authenticated user — cookie/session not available");
    console.log("  This means /api/auth/username returns 401!");
    return;
  }
  console.log("  User:", user.id, user.email);

  const userId = user.id;

  // Test 2: Check existing profile
  console.log("\n[2] Checking existing profile...");
  const { data: existing } = await anon
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  console.log("  Profile exists:", existing ? "YES" : "NO");
  console.log("  Profile data:", existing);

  // Test 3: Try INSERT (new user case)
  console.log("\n[3] Simulating INSERT (new OAuth user)...");
  const testUsername = "test_" + Date.now();
  const { data: insertData, error: insertError } = await anon
    .from("profiles")
    .insert({
      id: userId,
      username: testUsername,
      display_name: user.user_metadata?.full_name || user.user_metadata?.name || "Test",
      role: "student",
      daily_goal_minutes: 120,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata",
      updated_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (insertError) {
    console.log("  ❌ INSERT FAILED");
    console.log("  Code:", insertError.code);
    console.log("  Message:", insertError.message);
    console.log("  Details:", insertError.details);
    console.log("  Hint:", insertError.hint);
  } else {
    console.log("  ✅ INSERT succeeded:", insertData);
    // Clean up
    await anon.from("profiles").delete().eq("id", userId);
    console.log("  Cleaned up test profile");
  }

  // Test 4: Check all profiles
  console.log("\n[4] All profiles in DB...");
  const { data: allProfiles } = await service.from("profiles").select("*");
  console.log("  Count:", allProfiles?.length ?? 0);
  console.log("  Profiles:", JSON.stringify(allProfiles, null, 2));

  // Test 5: Check auth.users for this ID
  console.log("\n[5] Checking auth.users (direct)...");
  const { data: authUser } = await service.auth.getUserById(userId);
  console.log("  Auth user exists:", authUser.user ? "YES" : "NO");

  // Test 6: Check for any OAuth users that might not have profiles
  console.log("\n[6] Listing auth.users...");
  const { data: { users: authUsers }, error: listError } = await service.auth.admin.listUsers();
  console.log("  Total auth users:", authUsers?.length ?? 0);
  if (authUsers) {
    for (const u of authUsers) {
      console.log(`  - ${u.id} | ${u.email} | provider: ${u.app_metadata?.provider}`);
      const { data: prof } = await service.from("profiles").select("*").eq("id", u.id).maybeSingle();
      console.log(`    Profile: ${prof ? JSON.stringify(prof) : "NO PROFILE ROW"}`);
    }
  }
}

main().catch(console.error);
