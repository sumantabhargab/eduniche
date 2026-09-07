/**
 * Import PYQ data from JSON files into Supabase
 */

import { PYQIngestionPipeline } from "./ingest-pipeline";
import * as fs from "fs/promises";
import * as path from "path";

async function importSampleData() {
  const pipeline = new PYQIngestionPipeline();
  const dataDir = path.join(process.cwd(), "data", "pyq", "raw");

  const files = await fs.readdir(dataDir);
  const jsonFiles = files.filter((f) => f.endsWith(".json"));

  console.log(`Found ${jsonFiles.length} data files\n`);

  let totalImported = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  for (const file of jsonFiles) {
    console.log(`Processing ${file}...`);
    const filePath = path.join(dataDir, file);
    const content = await fs.readFile(filePath, "utf8");
    const data = JSON.parse(content);

    for (const [paperKey, paper] of Object.entries(data)) {
      const paperData = paper as any;
      const questions = paperData.questions || [];

      console.log(`  ${paperKey}: ${questions.length} questions`);

      for (const q of questions) {
        const rawQid = (q as any).qid || `Q${q.questionNumber}`;
        const numericPart = rawQid.replace(/\D/g, '');
        const questionNumber = parseInt(numericPart, 10) || (q as any).questionNumber || 0;
        const questionId = `gate-${paperData.branch.toLowerCase()}-${paperData.year}-${paperData.session}-${numericPart}`;

        const result = await pipeline.importQuestion({
          questionId,
          branchCode: paperData.branch,
          branchName: paperData.branchName,
          exam: "GATE",
          year: paperData.year,
          session: paperData.session,
          questionNumber,
          subjectName: q.subjectName,
          topicName: (q as any).topicName,
          questionText: q.questionText,
          options: q.options,
          correctAnswer: q.correctAnswer,
          questionType: q.questionType,
          marks: q.marks,
          negativeMarks: q.negativeMarks,
          sourcePrimary: `GATE ${paperData.year} Official`,
          sourceType: "official",
          answerVerified: true,
        });

        if (result.success) {
          totalImported++;
        } else if (result.error === "Duplicate question") {
          totalSkipped++;
        } else {
          totalErrors++;
          console.error(`    Error: ${result.error}`);
        }
      }
    }
  }

  console.log(`\n=== Import Summary ===`);
  console.log(`Imported: ${totalImported}`);
  console.log(`Skipped (duplicates): ${totalSkipped}`);
  console.log(`Errors: ${totalErrors}`);

  const stats = await pipeline.getStats();
  console.log(`\n=== Database Stats ===`);
  console.log(`Total questions: ${stats.total}`);
  console.log(`Verified questions: ${stats.verified}`);
  console.log(`By branch:`, JSON.stringify(stats.branches, null, 2));
}

importSampleData().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
