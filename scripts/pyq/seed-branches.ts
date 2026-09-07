/**
 * Seed PYQ branches into the database.
 * Idempotent: skips any branch that already exists.
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

const envPath = path.join(process.cwd(), ".env.local");
try {
  const envContent = fs.readFileSync(envPath, "utf8");
  for (const line of envContent.split("\n")) {
    const m = line.match(/^([^=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim();
  }
} catch {}

const client = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BRANCHES = [
  { branch_code: "CS", branch_name: "Computer Science and Information Technology", display_name: "Computer Science", exam: "GATE", year_min: 2004, year_max: 2026 },
  { branch_code: "EC", branch_name: "Electronics and Communication Engineering", display_name: "Electronics & Communication", exam: "GATE", year_min: 2004, year_max: 2026 },
  { branch_code: "EE", branch_name: "Electrical Engineering", display_name: "Electrical Engineering", exam: "GATE", year_min: 2004, year_max: 2026 },
  { branch_code: "ME", branch_name: "Mechanical Engineering", display_name: "Mechanical Engineering", exam: "GATE", year_min: 2004, year_max: 2026 },
  { branch_code: "CE", branch_name: "Civil Engineering", display_name: "Civil Engineering", exam: "GATE", year_min: 2004, year_max: 2026 },
  { branch_code: "IN", branch_name: "Instrumentation Engineering", display_name: "Instrumentation", exam: "GATE", year_min: 2004, year_max: 2026 },
  { branch_code: "PI", branch_name: "Production and Industrial Engineering", display_name: "Production & Industrial", exam: "GATE", year_min: 2004, year_max: 2026 },
  { branch_code: "CH", branch_name: "Chemical Engineering", display_name: "Chemical Engineering", exam: "GATE", year_min: 2004, year_max: 2026 },
  { branch_code: "BT", branch_name: "Biotechnology", display_name: "Biotechnology", exam: "GATE", year_min: 2004, year_max: 2026 },
  { branch_code: "MT", branch_name: "Metallurgical Engineering", display_name: "Metallurgy", exam: "GATE", year_min: 2004, year_max: 2026 },
  { branch_code: "XE", branch_name: "Engineering Sciences", display_name: "Engineering Sciences", exam: "GATE", year_min: 2004, year_max: 2026 },
  { branch_code: "XL", branch_name: "Life Sciences", display_name: "Life Sciences", exam: "GATE", year_min: 2004, year_max: 2026 },
  { branch_code: "TF", branch_name: "Textile Engineering and Fibre Science", display_name: "Textile Engineering", exam: "GATE", year_min: 2004, year_max: 2026 },
  { branch_code: "PE", branch_name: "Petroleum Engineering", display_name: "Petroleum Engineering", exam: "GATE", year_min: 2004, year_max: 2026 },
  { branch_code: "EY", branch_name: "Ecology and Evolution", display_name: "Ecology & Evolution", exam: "GATE", year_min: 2004, year_max: 2026 },
  { branch_code: "MA", branch_name: "Mathematics", display_name: "Mathematics", exam: "GATE", year_min: 2004, year_max: 2026 },
  { branch_code: "AR", branch_name: "Architecture and Planning", display_name: "Architecture & Planning", exam: "GATE", year_min: 2004, year_max: 2026 },
  { branch_code: "AG", branch_name: "Agricultural Engineering", display_name: "Agricultural Engineering", exam: "GATE", year_min: 2004, year_max: 2026 },
  { branch_code: "GG", branch_name: "Geology and Geophysics", display_name: "Geology & Geophysics", exam: "GATE", year_min: 2004, year_max: 2026 },
  { branch_code: "PH", branch_name: "Engineering Physics", display_name: "Engineering Physics", exam: "GATE", year_min: 2004, year_max: 2026 },
];

async function main() {
  console.log(`Upserting ${BRANCHES.length} branches...`);

  for (const branch of BRANCHES) {
    const { error } = await client
      .from("pyq_branches")
      .upsert(branch, { onConflict: "branch_code" });

    if (error) {
      console.error(`  ✗ ${branch.branch_code}: ${error.message}`);
    } else {
      console.log(`  ✓ ${branch.branch_code}`);
    }
  }

  const { data } = await client.from("pyq_branches").select("branch_code").order("branch_code");
  console.log(`\nTotal branches in DB: ${data?.length || 0}`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
