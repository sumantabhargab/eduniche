/**
 * GATE PYQ Ingestion Script
 *
 * Downloads official GATE papers from gate2026.iitg.ac.in,
 * extracts questions using pdftotext, and prepares them for
 * insertion into the EduNeuro Supabase database.
 *
 * Usage:
 *   node scripts/ingest-gate-papers.js --branch CS --years 2024,2025
 *
 * Or for all branches:
 *   node scripts/ingest-gate-papers.js --all-branches --years 2024,2025
 */

import { execSync } from "child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

// ─── Configuration ───────────────────────────────────────────────────────────

const BASE_URL = "https://gate2026.iitg.ac.in";
const PAPERS_DIR = join(process.cwd(), "tmp", "gate-papers");
const OUTPUT_DIR = join(process.cwd(), "tmp", "gate-extracted");

// Branch code mapping (our internal -> official paper naming)
const BRANCH_MAP: Record<string, { name: string; papers: { year: number; id: string; session: string }[] }> = {
  CS: {
    name: "Computer Science and IT",
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
    ],
  },
  EE: {
    name: "Electrical Engineering",
    papers: [
      { year: 2025, id: "EE2025", session: "1" },
      { year: 2024, id: "EE24S8", session: "1" },
      { year: 2023, id: "ee_2023", session: "1" },
      { year: 2022, id: "ee_2022", session: "1" },
    ],
  },
  ME: {
    name: "Mechanical Engineering",
    papers: [
      { year: 2025, id: "ME2025", session: "1" },
      { year: 2024, id: "ME24S2", session: "1" },
      { year: 2023, id: "me_2023", session: "1" },
    ],
  },
  CE: {
    name: "Civil Engineering",
    papers: [
      { year: 2025, id: "CE12025", session: "1" },
      { year: 2025, id: "CE22025", session: "2" },
      { year: 2024, id: "CE124S3", session: "1" },
      { year: 2024, id: "CE224S4", session: "2" },
    ],
  },
};

const YEARS_TO_FETCH = [2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016];

// ─── Download ───────────────────────────────────────────────────────────────

function ensureDir(dir: string) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

function downloadPaper(branch: string, year: number, paperId: string): string {
  const ext = ".pdf";
  const filename = `${branch}_${year}_${paperId}`;
  const pdfPath = join(PAPERS_DIR, branch, `${filename}${ext}`);
  const txtPath = join(PAPERS_DIR, branch, `${filename}.txt`);

  // Skip if already downloaded and extracted
  if (existsSync(txtPath)) {
    console.log(`  SKIP (exists): ${filename}`);
    return txtPath;
  }

  ensureDir(join(PAPERS_DIR, branch));

  // Try different URL patterns
  const urls = [
    `${BASE_URL}/doc/download/${year}/${paperId}${ext}`,
  ];

  for (const url of urls) {
    try {
      console.log(`  DOWNLOAD: ${url}`);
      execSync(`curl -s -L -o "${pdfPath}" "${url}"`, { stdio: "pipe", timeout: 30000 });
      if (existsSync(pdfPath) && (execSync(`wc -c < "${pdfPath}"`).toString().trim()) !== "0") {
        // Extract text with layout preservation but NO page breaks (cleaner output)
        execSync(`pdftotext -nopgbrk -layout "${pdfPath}" "${txtPath}"`, { stdio: "pipe" });
        // Delete PDF to save space
        execSync(`rm "${pdfPath}"`);
        console.log(`  EXTRACTED: ${txtPath}`);
        return txtPath;
      }
    } catch (e) {
      console.log(`  FAILED: ${url}`);
    }
  }

  return null;
}

// ─── Extraction ─────────────────────────────────────────────────────────────

/**
 * Parse extracted text into structured questions.
 *
 * GATE format patterns:
 * - Q.1-Q.5 Carry ONE mark Each (GA section)
 * - Q.6-Q.10 Carry TWO marks Each
 * - Q.1-Q.15 Carry ONE mark Each (branch-specific)
 * - Q.16-Q.30 Carry TWO marks Each
 * etc.
 *
 * Question types:
 * - MCQ: options (A)(B)(C)(D) present
 * - MSQ: one or more options correct
 * - NAT: fill in the blank (no options, has underscores)
 */

function extractQuestions(text: string, branch: string, year: number, session: string): any[] {
  const questions: any[] = [];

  // Split on question boundaries: "Q.N " at start of line
  const questionBlocks = text.split(/\n(?=Q\.\s*\d+\s)/);

  for (const block of questionBlocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;

    // Match Q.N at start
    const qMatch = trimmed.match(/^Q\.\s*(\d+)\s/);
    if (!qMatch) continue;

    const qNum = parseInt(qMatch[1]);
    if (isNaN(qNum) || qNum < 1) continue;

    // Determine section and marks
    let section = branch;
    let marks = 1;
    let qType = "MCQ";

    // Check for marks info in the block
    const oneMarkMatch = trimmed.match(/Carry\s+ONE\s+mark/i);
    const twoMarkMatch = trimmed.match(/Carry\s+TWO\s+marks/i);

    if (twoMarkMatch) marks = 2;

    // Check if GA (General Aptitude) section
    const gaMatch = trimmed.match(/General Aptitude|GA\)/i);
    if (gaMatch) {
      section = "GA";
    }

    // Detect question type
    const msqMatch = trimmed.match(/one or more.*(?:correct|answer)|MSQ|Multiple Select/i);
    const natMatch = trimmed.match(/_____|blank|numeric/i);
    if (msqMatch) qType = "MSQ";
    else if (natMatch && !trimmed.match(/\(A\).*\(B\).*\(C\).*\(D\)/)) qType = "NAT";

    // Extract options
    const options: string[] = [];
    const optionRegex = /\([A-D]\)\s*(.+?)(?=\n\([A-D]\)|\n\n|\nQ\.|$)/gs;
    let optMatch;
    const optionBlock = trimmed.match(/\([A-D]\)[\s\S]*/);
    if (optionBlock) {
      const optText = optionBlock[0];
      const optRegex = /\([A-Z]\)\s*([\s\S]*?)(?=\n\([A-Z]\)|\n\n|$)/g;
      let m;
      while ((m = optRegex.exec(optText)) !== null) {
        options.push(m[1].trim().replace(/\n/g, " "));
      }
    }

    // Extract question text (before options)
    const textBeforeOptions = trimmed.split(/\n\([A-D]\)/)[0];
    const cleanQuestion = textBeforeOptions
      .replace(/^Q\.\s*\d+\s*/, "")
      .replace(/Carry\s+(?:ONE|TWO)\s+marks?\s+(?:Each\s+)?/gi, "")
      .replace(/\(GA\)/gi, "")
      .trim()
      .replace(/\s+/g, " ");

    if (cleanQuestion.length < 10) continue; // Skip fragments

    questions.push({
      question_number: qNum,
      section,
      marks,
      question_type: qType,
      question_text: cleanQuestion,
      options: options.length ? options : null,
      branch,
      year,
      session: session || "1",
    });
  }

  return questions;
}

// ─── Answer Key ─────────────────────────────────────────────────────────────

async function fetchAnswerKey(branch: string, year: number, session: string) {
  // Try GATEOverflow's answer CSV/text
  const urls = [
    `https://gateoverflow.in/api/answerkey/${branch}/${year}`,
    `https://raw.githubusercontent.com/GATEOverflow/GateOverflow-Answers/master/${year}/${branch}.txt`,
  ];

  for (const url of urls) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        const text = await response.text();
        return parseAnswerText(text);
      }
    } catch (e) {
      // try next
    }
  }

  return null;
}

function parseAnswerText(text: string): Record<number, string> {
  const answers: Record<number, string> = {};
  const lines = text.split("\n");
  for (const line of lines) {
    const match = line.match(/^(\d+)[.\s]+([A-D]|[\d.]+)/i);
    if (match) {
      answers[parseInt(match[1])] = match[2].toUpperCase();
    }
  }
  return answers;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const branchArg = args.find((a) => a.startsWith("--branch="))?.split("=")[1];
  const allBranches = args.includes("--all-branches");
  const yearsArg = args.find((a) => a.startsWith("--years="))?.split("=")[1];

  const branches = allBranches
    ? Object.keys(BRANCH_MAP)
    : branchArg
      ? [branchArg]
      : ["CS"];

  const years = yearsArg
    ? yearsArg.split(",").map(Number).filter((y) => y >= 2000)
    : [2025, 2024];

  console.log("\n🚀 GATE PYQ Ingestion");
  console.log(`   Branches: ${branches.join(", ")}`);
  console.log(`   Years: ${years.join(", ")}`);
  console.log("");

  ensureDir(PAPERS_DIR);
  ensureDir(OUTPUT_DIR);

  const allResults: any[] = [];

  for (const branch of branches) {
    const config = BRANCH_MAP[branch];
    if (!config) {
      console.log(`⚠ Unknown branch: ${branch}`);
      continue;
    }

    console.log(`\n📚 Branch: ${config.name} (${branch})`);

    for (const year of years) {
      const papers = config.papers.filter((p) => p.year === year);
      if (papers.length === 0) {
        console.log(`  ⏩ ${year}: No papers`);
        continue;
      }

      for (const paper of papers) {
        const { id: paperId, session } = paper;
        console.log(`  📄 ${year} Paper ${paperId} (Session ${session})`);

        const txtPath = downloadPaper(branch, year, paperId);
        if (!txtPath) {
          console.log(`  ❌ Failed to download`);
          continue;
        }

        const text = readFileSync(txtPath, "utf-8");
        const questions = extractQuestions(text, branch, year, session);

        // Fetch answers
        console.log(`  🔑 Fetching answers...`);
        const answers = await fetchAnswerKey(branch, year, session);

        // Attach answers
        for (const q of questions) {
          q.answer = answers?.[q.question_number] || null;
        }

        console.log(`  ✅ ${questions.length} questions extracted`);

        // Save to file
        const outputFile = join(
          OUTPUT_DIR,
          branch,
          `${branch}_${year}_session${session}.json`
        );
        ensureDir(join(OUTPUT_DIR, branch));
        writeFileSync(outputFile, JSON.stringify(questions, null, 2));

        allResults.push({
          branch,
          year,
          session,
          paperId,
          questionCount: questions.length,
          outputFile,
        });
      }
    }
  }

  // Summary
  console.log("\n\n📊 Ingestion Summary");
  console.log("─".repeat(60));
  for (const r of allResults) {
    console.log(`${r.branch} ${r.year} Session${r.session}: ${r.questionCount} questions → ${r.outputFile}`);
  }
  console.log("\n✅ Done! Question files ready in /tmp/gate-extracted/");
}

main().catch(console.error);
