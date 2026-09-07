/**
 * GATE PDF Extractor — single file, properly tested
 *
 * Reads pdftotext output (with -nopgbrk -layout flag)
 * Extracts structured questions.
 */

const fs = require("fs");
const path = require("path");

// ─── Clean raw text ──────────────────────────────────────────────────────────

function cleanRawText(raw) {
  return raw
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\f/g, "\n")
    // Remove repeating page headers/footers
    .replace(/Organizing\s+Institute:[^\n]*\n?/g, "")
    .replace(/Page\s+\d+\s+of\s+\d+\n?/gi, "")
    // Remove branch name + set headers
    .replace(
      /(Computer Science and Information Technology|Electronics and Communication|Electrical Engineering|Mechanical Engineering|Civil Engineering)\s+Set\s*\d+\s*\([^)]+\)\n?/gi,
      ""
    )
    // Remove GA header
    .replace(/General\s+Aptitude\s*\(GA\)\n?/gi, "")
    // Remove "Q.1 – Q.5 Carry ONE mark Each" headers
    .replace(
      /Q\.\s*\d+[\s]*[–—\-][\s]*Q\.\s*\d+\s+Carry\s+(?:ONE|TWO)\s+marks?\s+Each\s*\n?/gi,
      "\n<<RANGE>>\n"
    )
    // Clean up extra whitespace
    .replace(/\n{4,}/g, "\n\n")
    .trim();
}

// ─── Main extraction ─────────────────────────────────────────────────────────

function extractQuestions(rawText, branch, year, session) {
  const clean = cleanRawText(rawText);

  // Strategy: find all "Q.N " occurrences that are NOT range headers
  // A range header has the form "Q.1 – Q.5 Carry ONE mark Each"
  // A real question has the form "Q.1 <actual question text>"

  // First, identify all positions where a real question starts
  const qPositions = [];
  const re = /^[ \t]*Q\.\s*(\d+)\s+/gm;
  let m;

  while ((m = re.exec(clean)) !== null) {
    // Skip range headers — they have "–" or "-" followed by another Q.N
    const context = clean.substring(m.index, Math.min(m.index + 80, clean.length));
    if (/\bCarry\s+(?:ONE|TWO)\s+marks?\b/i.test(context)) continue;
    // Skip if the number is part of a range pattern
    if (/Q\.\s*\d+\s*[–\-]/.test(context.substring(0, 30))) continue;

    qPositions.push({
      index: m.index,
      number: parseInt(m[1]),
    });
  }

  // Group consecutive questions into blocks
  // (handle page-break continuation)
  const questionBlocks = [];

  for (let i = 0; i < qPositions.length; i++) {
    const pos = qPositions[i];
    const nextPos = qPositions[i + 1];

    let blockText;
    if (nextPos) {
      blockText = clean.substring(pos.index, nextPos.index);
    } else {
      blockText = clean.substring(pos.index);
    }

    // Clean up the block
    blockText = blockText.trim();
    if (blockText.length < 20) continue;

    questionBlocks.push({
      number: pos.number,
      text: blockText,
    });
  }

  const questions = [];
  let currentSection = "GA";

  for (const block of questionBlocks) {
    const qMatch = block.text.match(/^Q\.\s*(\d+)/);
    if (!qMatch) continue;

    const qNum = parseInt(qMatch[1]);
    if (isNaN(qNum) || qNum < 1) continue;

    // Skip fragments (too short, no real content)
    const body = block.text.replace(/^Q\.\s*\d+/, "").trim();
    if (body.length < 20) continue;

    // Detect marks
    const marks = detectMarks(block.text, qNum <= 5 ? 1 : 2);

    // Detect section
    if (qNum <= 5) {
      currentSection = "GA";
    } else {
      currentSection = branch;
    }

    // Split text from options
    const optionStart = body.search(/\n\s*\([A-D]\)/);
    let textOnly, optionsStr;

    if (optionStart > 0) {
      textOnly = body.substring(0, optionStart);
      optionsStr = body.substring(optionStart + 1);
    } else {
      textOnly = body;
      optionsStr = null;
    }

    // Clean question text
    textOnly = textOnly
      .replace(/Organizing\s+Institute:[^\n]*/g, "")
      .replace(/Set\s*\d+\s*\([^)]+\)/g, "")
      .replace(/Page\s+\d+\s+of\s+\d+/gi, "")
      .replace(/\r/g, "")
      .replace(/\s+/g, " ")
      .trim();

    // Extract options
    const options = extractOptions(optionsStr || "");

    // Detect type
    const qType = detectQuestionType(textOnly, !!options);

    if (textOnly.length < 5) continue;

    questions.push({
      question_number: qNum,
      section: currentSection,
      marks,
      question_type: qType,
      question_text: textOnly,
      options,
      branch,
      year,
      session,
    });
  }

  return questions;
}

function detectMarks(block, fallback) {
  const m = block.match(/Carry\s+(ONE|TWO)\s+marks/i);
  if (m) return m[1].toUpperCase() === "ONE" ? 1 : 2;
  return fallback;
}

function detectQuestionType(text, hasOptions) {
  const lower = text.toLowerCase();
  if (lower.includes("one or more") && (lower.includes("correct") || lower.includes("answer"))) {
    return "MSQ";
  }
  if (!hasOptions && /\b\d+\b/.test(text)) {
    return "NAT";
  }
  return "MCQ";
}

function extractOptions(optionsBlock) {
  if (!optionsBlock) return null;
  const options = [];
  const re = /^[ \t]*\(([A-D])\)[ \t]*(.+?)(?=\n[ \t]*\([A-D]\)|$)/gms;
  let m;
  while ((m = re.exec(optionsBlock)) !== null) {
    const text = m[2].replace(/\n/g, " ").replace(/\s+/g, " ").trim();
    if (text.length > 0) options.push(text);
  }
  return options.length >= 2 ? options : null;
}

// ─── CLI entry ───────────────────────────────────────────────────────────────

const filePath = process.argv[2];
if (!filePath) {
  console.error("Usage: node scripts/extract-gate-questions.js <pdftotext-output.txt> [branch] [year] [session]");
  process.exit(1);
}

const branch = process.argv[3] || "CS";
const year = parseInt(process.argv[4]) || 2024;
const session = process.argv[5] || "1";

const rawText = fs.readFileSync(filePath, "utf-8");
const questions = extractQuestions(rawText, branch, year, session);

console.log(`\nExtracted ${questions.length} questions from ${path.basename(filePath)}`);
console.log(`  Branch: ${branch} | Year: ${year} | Session: ${session}\n`);

// Show first 3 as samples
for (const q of questions.slice(0, 3)) {
  console.log(`Q${q.question_number} [${q.section}] ${q.marks}m ${q.question_type}`);
  console.log(`  ${q.question_text.substring(0, 120)}${q.question_text.length > 120 ? "..." : ""}`);
  if (q.options) {
    q.options.forEach((o, i) => {
      console.log(`    (${String.fromCharCode(65 + i)}) ${o.substring(0, 60)}`);
    });
  }
  console.log("");
}

// Save JSON output
const outDir = path.join(process.cwd(), "tmp", "gate-extracted", branch);
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const outFile = path.join(outDir, `${branch}_${year}_s${session}.json`);
fs.writeFileSync(outFile, JSON.stringify(questions, null, 2));
console.log(`Saved to: ${outFile}`);
