import { Client } from "pg";
import fs from "fs";
import path from "path";

const envPath = path.join(process.cwd(), ".env.local");
for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
  const m = line.match(/^([^=]+)=(.*)$/);
  if (m) process.env[m[1].trim()] = m[2].trim();
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) { console.error("Missing env"); process.exit(1); }

const projectRef = url.replace("https://", "").split(".")[0];
const client = new Client({
  host: "db." + projectRef + ".supabase.co",
  port: 5432,
  database: "postgres",
  user: "postgres",
  password: key,
  ssl: { rejectUnauthorized: false },
});

const dir = path.join(process.cwd(), "supabase", "migrations");
const files = fs.readdirSync(dir).filter(f => f.endsWith(".sql")).sort();

await client.connect();
console.log("Connected!");

let applied = new Set();
try {
  const r = await client.query("SELECT version FROM supabase_migrations.schema_migrations ORDER BY version ASC");
  applied = new Set(r.rows.map(x => x.version));
} catch {}

const pending = files.filter(f => !applied.has(f.replace(".sql", "")));
console.log("Already applied: " + applied.size + ", pending: " + pending.length);

for (const file of pending) {
  console.log("\nApplying " + file + "...");
  const sql = fs.readFileSync(path.join(dir, file), "utf8");
  try {
    await client.query(sql);
    console.log("  ✓");
  } catch (err) {
    console.error("  ✗ " + err.message);
  }
}
await client.end();
console.log("\nDone.");
