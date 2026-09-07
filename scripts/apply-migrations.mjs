import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing Supabase credentials in environment");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const MIGRATION_DIR = path.join(process.cwd(), "supabase", "migrations");
const files = fs
  .readdirSync(MIGRATION_DIR)
  .filter((f) => f.endsWith(".sql"))
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));

console.log(`Found ${files.length} migration files. Checking applied migrations...`);

async function getAppliedMigrations() {
  const { data, error } = await supabase
    .from("supabase_migrations.schema_migrations")
    .select("version")
    .order("version", { ascending: false })
    .limit(1);

  if (error) {
    // If the migration tracking table doesn't exist yet, nothing has been applied
    if (error.message?.includes("schema_migrations")) {
      return [];
    }
    throw error;
  }
  return data?.map((r) => r.version) || [];
}

async function executeSql(sql: string, label: string) {
  const { error } = await supabase.rpc("exec_sql", { sql });
  if (error) {
    console.error(`  ✗ ${label}:`, error.message);
    return false;
  }
  console.log(`  ✓ ${label}`);
  return true;
}

async function main() {
  const applied = await getAppliedMigrations();
  console.log(`Already applied: ${applied.length > 0 ? applied[0] : "none"}`);

  const pending = files.filter((f) => !applied.includes(f.replace(".sql", "")));
  console.log(`Pending: ${pending.length}`);

  if (pending.length === 0) {
    console.log("No migrations to apply.");
    return;
  }

  for (const file of pending) {
    const filePath = path.join(MIGRATION_DIR, file);
    const sql = fs.readFileSync(filePath, "utf8");
    const label = file.replace(".sql", "");
    console.log(`\nApplying ${label}...`);
    await executeSql(sql, label);
  }

  console.log("\nDone.");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
