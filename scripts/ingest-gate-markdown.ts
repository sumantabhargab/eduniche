/**
 * Ingest GATE branch analysis markdown files into the database.
 *
 * Reads all .md files from ../gate-pyq-analysis/, parses them with
 * parseBranchMarkdown(), and upserts into:
 *   - gate_branch_intelligence
 *   - gate_subject_intelligence
 *
 * Usage:
 *   npx tsx scripts/ingest-gate-markdown.ts
 *
 * Environment:
 *   SUPABASE_SERVICE_ROLE_KEY — required for DB writes
 *   NEXT_PUBLIC_SUPABASE_URL — required for DB connection
 */

import { createServiceClient } from "@/lib/supabase/server";
import { readdirSync, existsSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { parseBranchMarkdown } from "@/lib/gate/markdown-parser";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MARKDOWN_DIR = join(__dirname, "..", "..", "..", "gate-pyq-analysis");

interface IngestResult {
  file: string;
  paperId: string;
  status: "ok" | "error" | "skipped";
  subjectsParsed: number;
  error?: string;
}

async function ingest() {
  console.log("=== GATE Markdown Ingestion ===\n");

  // Verify markdown directory exists
  if (!existsSync(MARKDOWN_DIR)) {
    console.error(`ERROR: Markdown directory not found: ${MARKDOWN_DIR}`);
    console.error("Expected path relative to script: ../gate-pyq-analysis/");
    process.exit(1);
  }

  // List markdown files
  const files = readdirSync(MARKDOWN_DIR)
    .filter((f) => f.endsWith(".md") && !f.startsWith("_"))
    .sort();

  if (files.length === 0) {
    console.error("ERROR: No .md files found in markdown directory.");
    process.exit(1);
  }

  console.log(`Found ${files.length} markdown files to process.\n`);

  const supabase = createServiceClient();
  if (!supabase) {
    console.error("ERROR: Failed to create Supabase service client.");
    console.error("Ensure SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL are set.");
    process.exit(1);
  }

  const results: IngestResult[] = [];

  for (const file of files) {
    const filePath = join(MARKDOWN_DIR, file);
    const markdown = readFileSync(filePath, "utf-8");

    // Derive paperId from filename: GATE-CS.md → cse, GATE-ECE.md → ece
    const match = file.match(/GATE-([A-Z]+)\.md$/);
    if (!match) {
      results.push({
        file,
        paperId: "unknown",
        status: "skipped",
        subjectsParsed: 0,
        error: "Filename does not match GATE-XXXX.md pattern",
      });
      continue;
    }

    const code = match[1].toLowerCase();
    // Map legacy codes: cs → cse
    const paperId = code === "cs" ? "cse" : code;

    // Parse the markdown
    const parsed = parseBranchMarkdown(paperId, markdown);
    if (!parsed) {
      results.push({
        file,
        paperId,
        status: "error",
        subjectsParsed: 0,
        error: "Parser returned null (paper not found in config)",
      });
      continue;
    }

    try {
      // Upsert branch intelligence
      const branchPayload = {
        paper_id: paperId,
        paper_code: parsed.paperCode,
        paper_name: parsed.paperName,
        short_name: parsed.shortName,
        exam_pattern: JSON.parse(JSON.stringify(parsed.examPattern)),
        engineering_math_marks: JSON.parse(JSON.stringify(parsed.engineeringMathMarks)),
        general_aptitude_marks: parsed.generalAptitudeMarks,
        strategic_tips: parsed.strategicTips,
        optional_sections: parsed.optionalSections
          ? JSON.parse(JSON.stringify(parsed.optionalSections))
          : null,
        subject_count: parsed.subjects.length,
        question_count: parsed.subjects.reduce((sum, s) => sum + s.topics.length, 0),
        data_source: "markdown-ingestion",
        last_ingested_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { error: branchError } = await supabase
        .from("gate_branch_intelligence")
        .upsert(branchPayload, { onConflict: "paper_id" });

      if (branchError) {
        throw new Error(`Branch upsert failed: ${branchError.message}`);
      }

      // Get the branch UUID for subject insertion
      const { data: existingBranch } = await supabase
        .from("gate_branch_intelligence")
        .select("id")
        .eq("paper_id", paperId)
        .single();

      if (!existingBranch) {
        throw new Error("Could not retrieve branch UUID after upsert");
      }

      const branchId = existingBranch.id;

      // Upsert subjects
      const subjectPayload = parsed.subjects.map((s) => ({
        branch_id: branchId,
        subject_name: s.name,
        avg_weightage: s.avgWeightage,
        priority: s.priority,
        category: s.category,
        topics: s.topics,
        difficulty_breakdown: JSON.parse(JSON.stringify(s.difficultyBreakdown)),
        yearly_data: JSON.parse(JSON.stringify(s.yearData)),
        updated_at: new Date().toISOString(),
      }));

      const { error: subjectError } = await supabase
        .from("gate_subject_intelligence")
        .upsert(subjectPayload, { onConflict: "branch_id,subject_name" });

      if (subjectError) {
        throw new Error(`Subject upsert failed: ${subjectError.message}`);
      }

      results.push({
        file,
        paperId,
        status: "ok",
        subjectsParsed: parsed.subjects.length,
      });

      console.log(`  ✓ ${file.padEnd(25)} → ${paperId.padEnd(10)} (${parsed.subjects.length} subjects)`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      results.push({
        file,
        paperId,
        status: "error",
        subjectsParsed: 0,
        error: message,
      });
      console.error(`  ✗ ${file.padEnd(25)} → ERROR: ${message}`);
    }
  }

  // Summary
  console.log("\n=== Ingestion Summary ===");
  const ok = results.filter((r) => r.status === "ok");
  const errors = results.filter((r) => r.status === "error");
  const skipped = results.filter((r) => r.status === "skipped");

  console.log(`  Processed : ${results.length}`);
  console.log(`  ✓ OK      : ${ok.length}`);
  console.log(`  ✗ Errors  : ${errors.length}`);
  console.log(`  ⊘ Skipped : ${skipped.length}`);

  if (errors.length > 0) {
    console.log("\n  Errors:");
    errors.forEach((e) => console.log(`    ${e.file}: ${e.error}`));
  }

  const totalSubjects = ok.reduce((sum, r) => sum + r.subjectsParsed, 0);
  console.log(`\n  Total subjects ingested: ${totalSubjects}`);

  if (errors.length > 0) {
    process.exit(1);
  }
}

ingest().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
