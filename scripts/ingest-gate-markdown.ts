/**
 * Ingest GATE branch analysis markdown files into the database.
 *
 * Reads all .md files from gate-pyq-analysis/, parses them with markdown-parser.ts,
 * and upserts into gate_branch_intelligence and gate_subject_intelligence tables.
 *
 * Usage: npx tsx scripts/ingest-gate-markdown.ts
 */

import { createServiceClient } from "@/lib/supabase/server";

// Load .env.local for scripts running outside Next.js
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
const envPath = resolve(process.cwd(), ".env.local");
if (existsSync(envPath)) {
  readFileSync(envPath, "utf-8").split("\n").forEach((line) => {
    const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (match) {
      process.env[match[1]] = match[2].replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1");
    }
  });
}

import { parseBranchMarkdown } from "@/lib/gate/markdown-parser";
import { PAPERS } from "@/lib/gate/config";
import fs from "fs";
import path from "path";

const MARKDOWN_DIR = path.join(process.cwd(), "..", "gate-pyq-analysis");

// Maps config paper IDs to markdown file number prefix.
// ECE is special: config code is "EC" but filename uses "ECE".
const PAPER_FILE_MAP: Record<string, string> = {
  cse: "01", ece: "02", me: "03", ee: "04", civil: "05",
  in: "06", ch: "07", bt: "08", mt: "09", pi: "10",
  xe: "11", xl: "12", tf: "13", pe: "14", ey: "15",
  ma: "16", ar: "17", ag: "18", gg: "19", ph: "20",
};

// Some markdown filenames don't follow the {code} pattern
const FILENAME_OVERRIDE: Record<string, string> = {
  ece: "02-GATE-ECE.md", // file uses ECE not EC
};

interface PaperFile {
  paperId: string;
  fileName: string;
  filePath: string;
}

async function findMarkdownFiles(): Promise<PaperFile[]> {
  const files: PaperFile[] = [];

  for (const paper of PAPERS) {
    if (paper.processingStatus === "unavailable") continue;
    const fileNum = PAPER_FILE_MAP[paper.id];
    if (!fileNum) continue;

    const override = FILENAME_OVERRIDE[paper.id];
    const fileName = override || `${fileNum}-GATE-${paper.code}.md`;
    const filePath = path.join(MARKDOWN_DIR, fileName);

    if (fs.existsSync(filePath)) {
      files.push({ paperId: paper.id, fileName, filePath });
    } else {
      console.warn(`  ⚠ File not found: ${fileName} (expected for ${paper.id})`);
    }
  }

  return files;
}

async function ingest() {
  console.log("\n📚 GATE Branch Intelligence Ingestion\n");
  console.log("=".repeat(50));

  console.log("\n1. Connecting to database...");
  const supabase = createServiceClient();

  if (!supabase) {
    console.error("❌ Could not create service client. Check env vars.");
    process.exit(1);
  }
  console.log("✅ Database connection OK");

  // Find markdown files
  console.log("\n2. Finding markdown files...");
  const files = await findMarkdownFiles();
  console.log(`   Found ${files.length} markdown files`);

  if (files.length === 0) {
    console.error("\n❌ No markdown files found!");
    console.error(`   Looking in: ${MARKDOWN_DIR}`);
    process.exit(1);
  }

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const { paperId, fileName, filePath } of files) {
    console.log(`\n3. Processing ${fileName} (${paperId})...`);

    try {
      const content = fs.readFileSync(filePath, "utf-8");
      console.log(`   Read ${(content.length / 1024).toFixed(1)} KB`);

      const parsed = parseBranchMarkdown(paperId, content);
      if (!parsed) {
        console.error(`   ❌ Failed to parse ${fileName}`);
        errorCount++;
        continue;
      }
      console.log(`   Parsed: ${parsed.subjects.length} subjects`);

      // Upsert branch intelligence — columns match table schema
      const branchPayload: Record<string, unknown> = {
        paper_id: parsed.paperId,
        paper_code: parsed.paperCode,
        paper_name: parsed.paperName,
        short_name: parsed.shortName,
        exam_pattern: parsed.examPattern,
        engineering_math_marks: parsed.engineeringMathMarks,
        general_aptitude_marks: parsed.generalAptitudeMarks,
        strategic_tips: parsed.strategicTips,
        optional_sections: parsed.optionalSections || null,
        subject_count: parsed.subjects.length,
        question_count: parsed.questionCount,
        data_source: "markdown-ingestion",
        last_ingested_at: new Date().toISOString(),
      };

      const { error: branchError } = await supabase
        .from("gate_branch_intelligence")
        .upsert(branchPayload, { onConflict: "paper_id" });

      if (branchError) {
        console.error(`   ❌ Branch upsert error:`, branchError.message);
        errorCount++;
        continue;
      }

      // Get branch ID
      const { data: branchData, error: fetchError } = await supabase
        .from("gate_branch_intelligence")
        .select("id")
        .eq("paper_id", parsed.paperId)
        .single();

      if (fetchError || !branchData) {
        console.error(`   ❌ Could not get branch ID for ${paperId}:`, fetchError?.message);
        errorCount++;
        continue;
      }

      // Delete existing subject intelligence for this branch
      const { error: deleteError } = await supabase
        .from("gate_subject_intelligence")
        .delete()
        .eq("branch_id", branchData.id);

      if (deleteError) {
        console.error(`   ❌ Delete error:`, deleteError.message);
        errorCount++;
        continue;
      }

      // Insert subject intelligence
      const subjectRows = parsed.subjects.map((subject) => ({
        branch_id: branchData.id,
        subject_name: subject.name,
        avg_weightage: subject.avgWeightage,
        priority: subject.priority,
        category: subject.category,
        topics: subject.topics,
        difficulty_breakdown: subject.difficultyBreakdown,
        yearly_data: subject.yearData,
      }));

      if (subjectRows.length > 0) {
        const { error: subjectError } = await supabase
          .from("gate_subject_intelligence")
          .insert(subjectRows);

        if (subjectError) {
          console.error(`   ❌ Subject insert error:`, subjectError.message);
          errorCount++;
          continue;
        }
      }

      console.log(`   ✅ Inserted ${subjectRows.length} subjects`);
      successCount++;
    } catch (e) {
      console.error(`   ❌ Error:`, e instanceof Error ? e.message : e);
      errorCount++;
    }
  }

  // Summary
  console.log("\n" + "=".repeat(50));
  console.log("\n📊 Ingestion Summary\n");
  console.log(`   Total files:  ${files.length}`);
  console.log(`   ✅ Success:    ${successCount}`);
  console.log(`   ⏭ Skipped:    ${skipCount}`);
  console.log(`   ❌ Errors:     ${errorCount}`);

  if (errorCount === 0) {
    console.log("\n🎉 All branches ingested successfully!\n");
  } else {
    console.log(`\n⚠ ${errorCount} branches had errors. Review above.\n`);
    process.exit(1);
  }
}

ingest().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
