import path from "path";
import fs from "fs";
import { createClient } from "@supabase/supabase-js";

const envPath = path.join(process.cwd(), ".env.local");
for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
  const m = line.match(/^([^=]+)=(.*)$/);
  if (m) process.env[m[1].trim()] = m[2].trim();
}

const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  const pyqTables = [
    "pyq_branches", "pyq_subjects", "pyq_topics", "pyq_questions",
    "pyq_attempts", "pyq_bookmarks", "pyq_user_notes", "pyq_reports",
    "pyq_topic_stats", "pyq_year_stats", "pyq_sources"
  ];
  let allExist = true;
  for (const t of pyqTables) {
    const { data, error } = await client.from(t).select("*").limit(1);
    console.log(t + ":", error ? "❌ NOT FOUND (" + error.message + ")" : "✅ EXISTS");
    if (error) allExist = false;
  }
  console.log("\nAll PYQ tables exist:", allExist ? "✅ YES" : "❌ NO");
})();
