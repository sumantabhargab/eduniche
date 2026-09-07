/**
 * Ingest processed PYQ data into Supabase.
 *
 * Reads data/pyq/processed/*.json and inserts into the live Supabase tables:
 *   - pyq_branches
 *   - pyq_subjects
 *   - pyq_questions
 *
 * Usage:
 *   npx tsx scripts/pyq/ingest-to-supabase.ts
 *
 * Requires: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, readdirSync, statSync } from "fs";
import { join, basename } from "path";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const PROCESSED_DIR = join(process.cwd(), "data", "pyq", "processed");

interface ProcessedQuestion {
  id?: string;
  question_number: number;
  question_text: string;
  subject: string;
  topic: string;
  options: string[] | null;
  answer: string | null;
  question_type: string;
  marks: number;
  negative_marks: number;
  branch: string;
  year: number;
  session: string;
  difficulty: string;
  tags: string[];
  explanation: string;
  source: string;
  source_file: string;
}

interface ProcessedFile {
  branch: string;
  totalQuestions: number;
  yearRange: { min: number; max: number };
  sessions: string[];
  generatedAt: string;
  questions: ProcessedQuestion[];
}

// Cache for branch IDs and subject IDs
const branchIdCache = new Map<string, string>();
const subjectIdCache = new Map<string, string>();

async function getOrCreateBranch(branchCode: string, branchName: string, yearMin: number, yearMax: number): Promise<string> {
  if (branchIdCache.has(branchCode)) {
    return branchIdCache.get(branchCode)!;
  }

  // Try to find existing
  const { data: existing } = await supabase
    .from("pyq_branches")
    .select("id")
    .eq("branch_code", branchCode)
    .single();

  if (existing) {
    branchIdCache.set(branchCode, existing.id);
    return existing.id;
  }

  // Create new
  const { data: created, error } = await supabase
    .from("pyq_branches")
    .insert({
      branch_code: branchCode,
      branch_name: branchName,
      display_name: branchCode,
      exam: "GATE",
      active: true,
      subject_count: 0,
      question_count: 0,
      year_min: yearMin,
      year_max: yearMax,
      metadata: {},
    })
    .select("id")
    .single();

  if (error || !created) {
    console.error(`  Failed to create branch ${branchCode}:`, error);
    throw error;
  }

  branchIdCache.set(branchCode, created.id);
  console.log(`  Created branch: ${branchCode} (${created.id})`);
  return created.id;
}

async function getOrCreateSubject(branchId: string, branchCode: string, subjectName: string): Promise<string> {
  const cacheKey = `${branchCode}:${subjectName}`;
  if (subjectIdCache.has(cacheKey)) {
    return subjectIdCache.get(cacheKey)!;
  }

  // Try to find existing
  const { data: existing } = await supabase
    .from("pyq_subjects")
    .select("id")
    .eq("branch_id", branchId)
    .eq("subject_name", subjectName)
    .single();

  if (existing) {
    subjectIdCache.set(cacheKey, existing.id);
    return existing.id;
  }

  // Create new
  const { data: created, error } = await supabase
    .from("pyq_subjects")
    .insert({
      branch_id: branchId,
      subject_name: subjectName,
      display_name: subjectName,
      display_order: subjectIdCache.size,
      question_count: 0,
      is_premium: false,
      metadata: {},
    })
    .select("id")
    .single();

  if (error || !created) {
    console.error(`  Failed to create subject ${subjectName}:`, error);
    throw error;
  }

  subjectIdCache.set(cacheKey, created.id);
  return created.id;
}

async function ingestBranch(file: ProcessedFile): { inserted: number; skipped: number; errors: number } {
  const branchCode = file.branch;
  const branchName = file.branch;

  console.log(`\nBranch: ${branchCode} (${file.totalQuestions} questions)`);

  // Get/create branch
  const branchId = await getOrCreateBranch(
    branchCode,
    branchName,
    file.yearRange.min,
    file.yearRange.max
  );

  let inserted = 0;
  let skipped = 0;
  let errors = 0;

  for (const q of file.questions) {
    try {
      // Get/create subject
      const subjectId = await getOrCreateSubject(branchId, branchCode, q.subject);

      // Build options JSON in the format the app expects
      const optionsJson = q.options
        ? q.options.map((text, i) => ({ label: String.fromCharCode(65 + i), text }))
        : [];

      const questionId = `GATE-${branchCode}-${q.year}-S${q.session}-Q${String(q.question_number).padStart(3, "0")}`;

      const { error } = await supabase.from("pyq_questions").upsert(
        {
          question_id: questionId,
          branch_code: branchCode,
          branch_name: branchName,
          exam: "GATE",
          year: q.year,
          session: q.session,
          question_number: String(q.question_number),
          subject_id: subjectId,
          subject_name: q.subject,
          topic_name: q.topic || null,
          question_type: q.question_type,
          marks: q.marks,
          negative_marks: q.negative_marks,
          question_text: q.question_text,
          options: optionsJson,
          correct_answer: q.answer,
          difficulty: q.difficulty,
          source_primary: `GATE ${q.year} Official`,
          source_type: "official",
          answer_verified: false,
          verification_confidence: 0.0,
          quality_tier: "C",
          tags: q.tags,
          metadata: { source_file: q.source_file },
        },
        { onConflict: "question_id" }
      );

      if (error) {
        if (error.code === "23505") {
          skipped++;
        } else {
          console.error(`  Error inserting Q${q.question_number}:`, error.message);
          errors++;
        }
      } else {
        inserted++;
      }
    } catch (e) {
      console.error(`  Error processing Q${q.question_number}:`, e);
      errors++;
    }
  }

  console.log(`  + ${inserted} inserted, ${skipped} skipped (duplicate), ${errors} errors`);
  return { inserted, skipped, errors };
}

async function main() {
  console.log("Ingesting PYQ data into Supabase\n");

  // Load all processed branch files
  const files = readdirSync(PROCESSED_DIR)
    .filter((f) => f.endsWith(".json") && f !== "index.json")
    .sort();

  console.log(`Found ${files.length} branch files\n`);

  let totalInserted = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  for (const file of files) {
    const filePath = join(PROCESSED_DIR, file);
    try {
      const raw = readFileSync(filePath, "utf-8");
      const data: ProcessedFile = JSON.parse(raw);
      const result = await ingestBranch(data);
      totalInserted += result.inserted;
      totalSkipped += result.skipped;
      totalErrors += result.errors;
    } catch (e) {
      console.error(`\nFailed to process ${file}:`, e);
      totalErrors++;
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("Ingestion Summary");
  console.log("=".repeat(60));
  console.log(`  Total inserted:  ${totalInserted}`);
  console.log(`  Total skipped:   ${totalSkipped} (already exist)`);
  console.log(`  Total errors:    ${totalErrors}`);
  console.log(`  Branches:        ${files.length}`);
  console.log("=".repeat(60));
}

main().catch(console.error);
