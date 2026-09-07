import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

const SUPABASE_URL = "https://cvedtsobskofcuajswty.supabase.co";
const SUPABASE_SERVICE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2ZWR0c29ic2tvZmN1YWpzd3R5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzIxNTgwNiwiZXhwIjoyMTAyNzkxODA2fQ.aMIvxPKYuQA8QIDyDWJ6y2aGBUjE0IpDDQmzVnj1fWU";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
});

// ─── Check table ──────────────────────────────────────────────────────────────

async function checkTable() {
  const { data, error } = await supabase.from("pyq_questions").select("id").limit(1);
  if (!error) {
    console.log("✅ pyq_questions table exists");
    return true;
  }
  console.log("❌ pyq_questions table not found:", error.message);
  return false;
}

// ─── Resolve subject_id ───────────────────────────────────────────────────────

async function getOrCreateSubject(
  subjectName: string,
  branchId: string,
  branchCode: string,
  cache: Map<string, string>
): Promise<string> {
  const cacheKey = `${branchCode}-${subjectName}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey)!;

  const { data: existing } = await supabase
    .from("pyq_subjects")
    .select("id")
    .eq("branch_id", branchId)
    .eq("subject_name", subjectName)
    .maybeSingle();

  if (existing?.id) {
    cache.set(cacheKey, existing.id);
    return existing.id;
  }

  // Create the subject with a proper UUID
  const newId = randomUUID();
  const { data: created } = await supabase
    .from("pyq_subjects")
    .upsert(
      {
        id: newId,
        branch_id: branchId,
        subject_name: subjectName,
        display_name: subjectName,
        display_order: cache.size,
      },
      { onConflict: "id" }
    )
    .select("id")
    .maybeSingle();

  const subjectId = created?.id || newId;
  cache.set(cacheKey, subjectId);
  return subjectId;
}

// ─── Load questions for one branch ───────────────────────────────────────────

interface ExtractedQuestion {
  question_number: number;
  section: string;
  marks: number;
  question_type: string;
  question_text: string;
  options: string[] | null;
  branch: string;
  year: number;
  session: string;
}

const BRANCH_NAMES: Record<string, string> = {
  CS: "Computer Science and Information Technology",
  EC: "Electronics and Communication",
  EE: "Electrical Engineering",
  ME: "Mechanical Engineering",
  CE: "Civil Engineering",
};

async function loadQuestions(branchCode: string) {
  const branchDir = path.join(process.cwd(), "tmp", "gate-extracted", branchCode);
  if (!fs.existsSync(branchDir)) {
    console.log(`  ⚠ No extracted data for ${branchCode}`);
    return 0;
  }

  const files = fs.readdirSync(branchDir).filter((f) => f.endsWith(".json"));
  if (files.length === 0) {
    console.log(`  ⚠ No JSON files for ${branchCode}`);
    return 0;
  }

  console.log(`\n📚 Loading ${branchCode}...`);

  // Get branch ID
  const { data: branchData } = await supabase
    .from("pyq_branches")
    .select("id")
    .eq("branch_code", branchCode)
    .maybeSingle();

  const branchId = branchData?.id || "";
  if (!branchId) {
    console.log(`  ❌ Branch ${branchCode} not found in pyq_branches`);
    return 0;
  }

  const subjectCache = new Map<string, string>();
  let totalLoaded = 0;

  for (const file of files) {
    const filePath = path.join(branchDir, file);
    const questions: ExtractedQuestion[] = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    if (questions.length === 0) continue;

    console.log(`  📄 ${file}: ${questions.length} questions`);

    // Deduplicate by question_number
    const seen = new Set<number>();
    const unique = questions.filter((q) => {
      if (seen.has(q.question_number)) return false;
      seen.add(q.question_number);
      return true;
    });

    // Resolve subject_ids for all unique sections in this batch
    const uniqueSections = [...new Set(unique.map((q) => q.section))];
    const subjectIdMap = new Map<string, string>();
    for (const section of uniqueSections) {
      const subjectName = section === "GA" ? "General Aptitude" : `${branchCode} Core`;
      const sid = await getOrCreateSubject(subjectName, branchId, branchCode, subjectCache);
      subjectIdMap.set(section, sid);
    }

    // Build rows
    const rows = unique.map((q) => {
      const questionId = `gate-${q.branch.toLowerCase()}-${q.year}-s${q.session}-${q.question_number}`;
      const negativeMarks = q.marks === 1 ? 0 : 0.33;
      const optionsArray = q.options
        ? q.options.map((o) => ({
            label: String.fromCharCode(65 + q.options!.indexOf(o)),
            text: o,
          }))
        : [];

      const tags: string[] = [q.branch, String(q.year)];
      if (q.section === "GA") tags.push("aptitude");
      if (q.question_type === "NAT") tags.push("numeric");

      return {
        question_id: questionId,
        branch_code: q.branch,
        branch_name: BRANCH_NAMES[q.branch] || q.branch,
        exam: "GATE",
        year: q.year,
        session: q.session,
        question_number: String(q.question_number),
        subject_id: subjectIdMap.get(q.section) || "",
        subject_name: q.section === "GA" ? "General Aptitude" : `${q.branch} Core`,
        question_type: q.question_type,
        marks: q.marks,
        negative_marks: negativeMarks,
        question_text: q.question_text,
        options: optionsArray,
        correct_answer: "",
        difficulty: "medium",
        tags,
        source_primary: `GATE ${q.year} Official Question Paper`,
        source_url: `https://gate2026.iitg.ac.in/doc/download/${q.year}/`,
        source_type: "official",
        answer_source: "pending",
        answer_verified: false,
        verification_confidence: 0.0,
        quality_tier: "B",
        topic_confidence: 0.0,
        is_duplicate: false,
      };
    });

    // Insert in batches of 50
    const BATCH_SIZE = 50;
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);
      const { error, count } = await supabase
        .from("pyq_questions")
        .upsert(batch, { onConflict: "question_id", count: "exact" });

      if (error) {
        console.error(`  ❌ Batch error: ${error.message}`);
        // Fallback: one by one
        for (const row of batch) {
          const { error: singleError } = await supabase
            .from("pyq_questions")
            .upsert(row, { onConflict: "question_id" });
          if (!singleError) totalLoaded++;
          else console.error(`    Failed Q${row.question_number}: ${singleError.message}`);
        }
      } else {
        totalLoaded += count || batch.length;
      }
    }
  }

  console.log(`  ✅ ${branchCode}: ${totalLoaded} questions loaded`);
  return totalLoaded;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const branchArg = args.find((a) => a.startsWith("--branch="))?.split("=")[1];
  const branches = branchArg ? [branchArg.toUpperCase()] : ["CS", "EC", "EE", "ME", "CE"];

  console.log("\n🚀 PYQ Data Loader");
  console.log(`   Branches: ${branches.join(", ")}\n`);

  const tableExists = await checkTable();
  if (!tableExists) {
    console.log("\n📋 Apply the schema migration first:");
    console.log("   supabase/migrations/20270107000000_pyq_system.sql");
    process.exit(1);
  }

  const { count: existingCount } = await supabase
    .from("pyq_questions")
    .select("*", { count: "exact", head: true });
  console.log(`   Current in DB: ${existingCount || 0}`);

  let totalLoaded = 0;
  for (const branch of branches) {
    totalLoaded += await loadQuestions(branch);
  }

  const { count: finalCount } = await supabase
    .from("pyq_questions")
    .select("*", { count: "exact", head: true });

  console.log("\n📊 LOAD COMPLETE");
  console.log(`   Loaded this run: ${totalLoaded}`);
  console.log(`   Total in DB: ${finalCount || 0}`);
  console.log(`   New questions: ${(finalCount || 0) - (existingCount || 0)}`);
  console.log("\n✅ Done!");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
