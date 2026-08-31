import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const TEST_EMAIL = "razorpay-test@eduniche.dev";
const TEST_PASSWORD = "TestPass123!";
const TEST_USERNAME = "razorpay_test";

async function main() {
  console.log(`Creating test user: ${TEST_EMAIL}`);

  const { data, error } = await supabase.auth.admin.createUser({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    email_confirm: true,
    user_metadata: {},
  });

  if (error) {
    console.error("Failed to create user:", error.message);
    process.exit(1);
  }

  const userId = data.user.id;
  console.log(`User created with UUID: ${userId}`);

  const { error: profileError } = await supabase.from("profiles").upsert(
    {
      id: userId,
      username: TEST_USERNAME,
      role: "student",
      display_name: "Razorpay Test",
      daily_goal_minutes: 120,
      timezone: "Asia/Kolkata",
    },
    { onConflict: "id" }
  );

  if (profileError) {
    console.error("Failed to create profile:", profileError.message);
    process.exit(1);
  }

  console.log("Profile created successfully.");
  console.log("\nTest account ready:");
  console.log(`  Email:    ${TEST_EMAIL}`);
  console.log(`  Password: ${TEST_PASSWORD}`);
  console.log(`  Username: ${TEST_USERNAME}`);
  console.log(`  UUID:     ${userId}`);
}

main();
