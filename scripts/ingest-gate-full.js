/**
 * GATE PYQ — Full Ingestion Pipeline
 *
 * Steps:
 * 1. Download all PDFs from official source
 * 2. Extract text with pdftotext -nopgbrk -layout
 * 3. Parse questions with extract-gate-questions.js
 * 4. Fetch answer keys
 * 5. Generate Supabase INSERT SQL
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const PAPERS_DIR = path.join(process.cwd(), "tmp", "gate-papers");
const EXTRACTED_DIR = path.join(process.cwd(), "tmp", "gate-extracted");
const OUTPUT_DIR = path.join(process.cwd(), "tmp", "gate-sql");

// All branches with their official paper IDs per year
// Sourced from https://gate2026.iitg.ac.in/download.html
const BRANCHES = {
  CS: {
    name: "Computer Science and Information Technology",
    papers: [
      { year: 2025, id: "CS12025", session: "1" },
      { year: 2025, id: "CS22025", session: "2" },
      { year: 2024, id: "CS124S5", session: "1" },
      { year: 2024, id: "CS224S6", session: "2" },
      { year: 2023, id: "cs_2023", session: "1" },
      { year: 2022, id: "cs_2022", session: "1" },
      { year: 2021, id: "cs_2021", session: "1" },
      { year: 2020, id: "cs_2020", session: "1" },
      { year: 2019, id: "cs_2019", session: "1" },
      { year: 2018, id: "cs_2018", session: "1" },
      { year: 2017, id: "cs_2017", session: "1" },
      { year: 2016, id: "cs_2016", session: "1" },
    ],
  },
  EC: {
    name: "Electronics and Communication",
    papers: [
      { year: 2025, id: "EC2025", session: "1" },
      { year: 2024, id: "EC24S7", session: "1" },
      { year: 2023, id: "ec_2023", session: "1" },
      { year: 2022, id: "ec_2022", session: "1" },
      { year: 2021, id: "ec_2021", session: "1" },
      { year: 2020, id: "ec_2020", session: "1" },
      { year: 2019, id: "ec_2019", session: "1" },
    ],
  },
  EE: {
    name: "Electrical Engineering",
    papers: [
      { year: 2025, id: "EE2025", session: "1" },
      { year: 2024, id: "EE24S8", session: "1" },
      { year: 2023, id: "ee_2023", session: "1" },
      { year: 2022, id: "ee_2022", session: "1" },
      { year: 2021, id: "ee_2021", session: "1" },
      { year: 2020, id: "ee_2020", session: "1" },
    ],
  },
  ME: {
    name: "Mechanical Engineering",
    papers: [
      { year: 2025, id: "ME2025", session: "1" },
      { year: 2024, id: "ME24S2", session: "1" },
      { year: 2023, id: "me_2023", session: "1" },
      { year: 2022, id: "me_2022", session: "1" },
    ],
  },
  CE: {
    name: "Civil Engineering",
    papers: [
      { year: 2025, id: "CE12025", session: "1" },
      { year: 2025, id: "CE22025", session: "2" },
      { year: 2024, id: "CE124S3", session: "1" },
      { year: 2024, id: "CE224S4", session: "2" },
      { year: 2023, id: "ce1_2023", session: "1" },
      { year: 2023, id: "ce2_2023", session: "2" },
      { year: 2022, id: "ce_2022", session: "1" },
    ],
  },
};

const BASE_URL = "https://gate2026.iitg.ac.in";
const MAX_PAPERS = 30; // Limit for initial run

// ─── Download ───────────────────────────────────────────────────────────────

function downloadPaper(branchCode, year, paperId) {
  const dir = path.join(PAPERS_DIR, branchCode);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const pdfPath = path.join(dir, `${branchCode}_${year}_${paperId}.pdf`);
  const txtPath = path.join(dir, `${branchCode}_${year}_${paperId}.txt`);

  // Return cached text if exists
  if (fs.existsSync(txtPath)) {
    const size = fs.statSync(txtPath).size;
    if (size > 1000) return txtPath;
  }

  // Download
  const url = `${BASE_URL}/doc/download/${year}/${paperId}.pdf`;
  console.log(`  Downloading: ${url}`);

  try {
    execSync(
      `curl -s -L -o "${pdfPath}" "${url}"`,
      { stdio: "pipe", timeout: 30000 }
    );

    const pdfSize = fs.existsSync(pdfPath) ? fs.statSync(pdfPath).size : 0;
    if (pdfSize < 10000) {
      console.log(`    ⚠ Download too small (${pdfSize} bytes) — skipping`);
      return null;
    }

    // Extract text
    execSync(
      `pdftotext -nopgbrk -layout "${pdfPath}" "${txtPath}"`,
      { stdio: "pipe" }
    );

    // Remove PDF to save space
    fs.unlinkSync(pdfPath);

    console.log(`    ✅ Extracted: ${fs.statSync(txtPath).size} bytes`);
    return txtPath;
  } catch (err) {
    console.log(`    ❌ Failed: ${err.message}`);
    return null;
  }
}

// ─── Extract questions via extract-gate-questions.js ─────────────────────────

function extractQuestions(txtPath, branchCode, year, session) {
  try {
    const result = execSync(
      `node scripts/extract-gate-questions.js "${txtPath}" ${branchCode} ${year} ${session}`,
      { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] }
    );

    // Find the JSON output file
    const outFile = path.join(
      EXTRACTED_DIR, branchCode,
      `${branchCode}_${year}_s${session}.json`
    );

    if (fs.existsSync(outFile)) {
      return JSON.parse(fs.readFileSync(outFile, "utf8"));
    }
    return [];
  } catch (err) {
    console.log(`    ⚠ Extraction error: ${err.message}`);
    return [];
  }
}

// ─── Fetch answer keys ───────────────────────────────────────────────────────

async function fetchAnswerKey(branch, year) {
  // Try GATEOverflow API-style sources
  const sources = [
    `https://gateoverflow.in/answers/${year}/${branch}`,
    `https://gateoverflow.in/api/gate${year}/${branch}`,
  ];

  for (const url of sources) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        return data;
      }
    } catch (e) {
      // continue
    }
  }

  return null;
}

function parseAnswerData(data, year) {
  // GATEOverflow returns: { "1": "A", "2": "B", ... }
  // Or array format
  if (!data) return {};

  const answers = {};

  if (Array.isArray(data)) {
    for (const item of data) {
      if (item.q && item.answer) {
        answers[item.q] = item.answer;
      }
    }
  } else if (typeof data === "object") {
    for (const [key, val] of Object.entries(data)) {
      const num = parseInt(key);
      if (!isNaN(num)) {
        answers[num] = String(val).toUpperCase();
      }
    }
  }

  return answers;
}

// ─── Generate Supabase SQL ───────────────────────────────────────────────────

function generateInsertSQL(questions, branchCode, year, paperId) {
  const lines = [];

  // First insert subjects (deduplicated)
  const subjects = new Map();
  for (const q of questions) {
    const subj = q.section || branchCode;
    if (!subjects.has(subj)) {
      subjects.set(subj, {
        subject_id: `subj_${branchCode}_${subj.toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
        subject_name: subj,
        branch: branchCode,
        display_order: subjects.size,
      });
    }
  }

  lines.push(`-- Insert subjects for ${branchCode}`);
  for (const s of subjects.values()) {
    lines.push(
      `INSERT INTO pyq_subjects (subject_id, subject_name, branch, display_order) ` +
      `VALUES ('${s.subject_id}', '${escapeSql(s.subject_name)}', '${s.branch}', ${s.display_order}) ` +
      `ON CONFLICT (subject_id) DO NOTHING;`
    );
  }
  lines.push("");

  // Insert questions
  lines.push(`-- Insert questions for ${branchCode}`);
  for (const q of questions) {
    const subjectId =
      subjects.get(q.section || branchCode)?.subject_id ||
      `subj_${branchCode}_general`;

    const qId = `gate_${branchCode.toLowerCase()}_${q.year}_s${q.session}_q${q.question_number}`;

    // Escape single quotes in question text
    const safeText = escapeSql(q.question_text).substring(0, 5000);

    const optionsStr = q.options
      ? q.options.map((o) => `ARRAY['${escapeSql(o).substring(0, 1000)}']`).join(", ")
      : "NULL";

    const optionsArray = q.options
      ? `ARRAY[${optionsStr}]::text[]`
      : "NULL";

    lines.push(
      `INSERT INTO pyq_questions ` +
        `(id, exam, branch_code, branch_name, year, session, question_number, subject_id, ` +
        `topic, subtopic, question_type, marks, negative_marks, question_text, options, ` +
        `correct_answer, difficulty, source_name, source_url, source_type, source_year, retrieved_at) ` +
        `VALUES (` +
        `'${qId}', 'GATE', '${branchCode}', '', ${q.year}, '${q.session}', ${q.question_number}, '${subjectId}', ` +
        `'', '', '${q.question_type}', ${q.marks}, 0, '${safeText}', ${optionsArray}, ` +
        `${q.answer ? `'${escapeSql(q.answer)}'` : "NULL"}, 2, ` +
        `'GATE Official ${year} Question Paper', '${BASE_URL}/doc/download/${year}/', ` +
        `'official', ${q.year}, NOW()) ` +
        `ON CONFLICT (id) DO UPDATE SET question_text = EXCLUDED.question_text, correct_answer = COALESCE(EXCLUDED.correct_answer, pyq_questions.correct_answer);`
    );
  }

  return lines.join("\n");
}

function escapeSql(str) {
  if (!str) return "";
  return str.replace(/'/g, "''").replace(/\\/g, "\\\\");
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const branchArg = args.find((a) => a.startsWith("--branch="))?.split("=")[1];
  const maxPapers = parseInt(args.find((a) => a.startsWith("--max="))?.split("=")[1]) || MAX_PAPERS;
  const dryRun = args.includes("--dry-run");

  const branches = branchArg ? [branchArg] : Object.keys(BRANCHES);

  console.log("\n🚀 GATE PYQ Full Ingestion Pipeline");
  console.log(`   Branches: ${branches.join(", ")}`);
  console.log(`   Max papers: ${maxPapers}`);
  console.log(`   Mode: ${dryRun ? "DRY RUN" : "WRITE"}\n`);

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  let totalQuestions = 0;
  let totalPapers = 0;
  const allSql = [];

  for (const branchCode of branches) {
    const config = BRANCHES[branchCode];
    if (!config) {
      console.log(`⚠ Unknown branch: ${branchCode}`);
      continue;
    }

    console.log(`\n📚 ${config.name} (${branchCode})`);

    for (const paper of config.papers) {
      if (totalPapers >= maxPapers) break;

      console.log(`  📄 ${paper.year} Session ${paper.session} (${paper.id})`);

      // Step 1: Download
      const txtPath = downloadPaper(branchCode, paper.year, paper.id);
      if (!txtPath) continue;

      // Step 2: Extract questions
      const questions = extractQuestions(txtPath, branchCode, paper.year, paper.session);
      console.log(`    📝 ${questions.length} questions extracted`);

      if (questions.length === 0) continue;

      // Step 3: Fetch answer keys
      const answerData = await fetchAnswerKey(branchCode, paper.year);
      const answers = parseAnswerData(answerData, paper.year);
      if (Object.keys(answers).length > 0) {
        console.log(`    🔑 ${Object.keys(answers).length} answers found`);
        for (const q of questions) {
          if (answers[q.question_number]) {
            q.answer = answers[q.question_number];
          }
        }
      } else {
        console.log(`    ⚠ No answer key found (questions will have answer=NULL)`);
      }

      // Step 4: Generate SQL
      const sql = generateInsertSQL(questions, branchCode, paper.year, paper.id);

      // Step 5: Save
      const sqlFile = path.join(
        OUTPUT_DIR,
        `${branchCode}_${paper.year}_s${paper.session}.sql`
      );

      if (!dryRun) {
        fs.writeFileSync(sqlFile, sql);
        console.log(`    💾 SQL written: ${sqlFile} (${sql.length} bytes, ${questions.length} questions)`);
      } else {
        console.log(`    [DRY RUN] ${questions.length} questions → ${sqlFile}`);
      }

      totalQuestions += questions.length;
      totalPapers++;

      // Save combined SQL for review
      allSql.push(`-- ========================================`);
      allSql.push(`-- ${config.name} ${paper.year} Session ${paper.session}`);
      allSql.push(`-- Source: GATE Official Paper ${paper.id}`);
      allSql.push(`-- Questions: ${questions.length}`);
      allSql.push(`-- ========================================`);
      allSql.push(sql);
      allSql.push("");
    }

    if (totalPapers >= maxPapers) break;
  }

  // Save combined SQL
  const combinedFile = path.join(OUTPUT_DIR, "ALL_QUESTIONS.sql");
  if (!dryRun) {
    fs.writeFileSync(combinedFile, allSql.join("\n"));
    console.log(`\n📊 FINAL SUMMARY`);
    console.log(`   Total papers processed: ${totalPapers}`);
    console.log(`   Total questions: ${totalQuestions}`);
    console.log(`   Combined SQL: ${combinedFile} (${fs.statSync(combinedFile).size} bytes)`);
    console.log(`\n✅ To load into Supabase:`);
    console.log(`   1. Go to Supabase Dashboard → SQL Editor`);
    console.log(`   2. Copy-paste contents of ${combinedFile}`);
    console.log(`   3. Run it`);
  }
}

main();
