// Master PYQ extractor — processes every available source and produces
// a single normalized JSON file per branch with ALL questions found.
//
// Sources processed:
//   1. data/pyq/raw/*.json     — pre-scraped question JSON
//   2. tmp/gate-extracted/**/*.json  — previously extracted text
//   3. tmp/gate-papers/**/*.txt      — pdftotext output (raw text)
//   4. tmp/gate-papers/**/*.pdf      — PDFs (needs pdftotext)
//   5. tmp/gate-sql/*.sql            — SQL INSERT statements
//
// Output: data/pyq/processed/<branch>.json

import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import { join, basename, extname } from "path";

const ROOT = join(process.cwd());
const RAW_DIR = join(ROOT, "data", "pyq", "raw");
const EXTRACTED_DIR = join(ROOT, "tmp", "gate-extracted");
const PAPERS_DIR = join(ROOT, "tmp", "gate-papers");
const SQL_DIR = join(ROOT, "tmp", "gate-sql");
const OUT_DIR = join(ROOT, "data", "pyq", "processed");

function ensureDir(dir: string) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

function getAllFiles(dir: string, ext: string): string[] {
  if (!existsSync(dir)) return [];
  const results: string[] = [];
  function walk(d: string) {
    const entries = readdirSync(d);
    for (const entry of entries) {
      const full = join(d, entry);
      const st = statSync(full);
      if (st.isDirectory()) walk(full);
      else if (extname(entry).toLowerCase() === ext) results.push(full);
    }
  }
  walk(dir);
  return results;
}

function generateQuestionId(branch: string, year: number, session: string, qNum: number, source: string): string {
  return `GATE-${branch}-${year}-S${session}-Q${String(qNum).padStart(3, "0")}-${source}`;
}

// ─── Source 1: Raw JSON ───────────────────────────────────────────────────────

interface RawQuestion {
  qid?: string;
  questionText?: string;
  question_text?: string;
  question?: string;
  subjectName?: string;
  subject_name?: string;
  subject?: string;
  topicName?: string;
  topic_name?: string;
  topic?: string;
  options?: string[];
  correctAnswer?: string;
  answer?: string;
  correct_answer?: string;
  questionType?: string;
  question_type?: string;
  type?: string;
  marks?: number;
  year?: number;
  session?: string;
  branch?: string;
  branchCode?: string;
  difficulty?: string;
  explanation?: string;
  tags?: string[];
}

function parseRawJsonFile(filePath: string): any[] {
  try {
    const raw = readFileSync(filePath, "utf-8");
    const data = JSON.parse(raw);
    let questions: any[] = [];
    let meta: { year?: number; branch?: string; session?: string } = {};

    if (Array.isArray(data)) {
      questions = data;
    } else if (typeof data === "object") {
      for (const key of Object.keys(data)) {
        if (key.startsWith("gate-")) {
          const entry = data[key];
          if (entry && Array.isArray(entry.questions)) {
            meta = {
              year: entry.year,
              branch: entry.branch || entry.examCode,
              session: entry.session || "1",
            };
            questions = entry.questions;
            break;
          }
        }
        if (Array.isArray(data[key])) {
          questions = data[key];
          break;
        }
      }
    }

    return questions.map((q: RawQuestion, idx: number) => ({
      id: q.qid || `raw-${meta.branch || "UNK"}-${meta.year || 0}-${idx + 1}`,
      question_number: idx + 1,
      question_text: q.questionText || q.question_text || q.question || "",
      subject: q.subjectName || q.subject_name || q.subject || "Unknown",
      topic: q.topicName || q.topic_name || q.topic || "",
      options: Array.isArray(q.options) ? q.options : null,
      answer: q.correctAnswer || q.answer || q.correct_answer || null,
      question_type: q.questionType || q.question_type || q.type || "MCQ",
      marks: q.marks ?? 1,
      negative_marks: q.negativeMarks ?? 0.33,
      branch: (q.branch || meta.branch || "UNK").toUpperCase(),
      year: q.year || meta.year || 0,
      session: String(q.session || meta.session || "1"),
      difficulty: q.difficulty || "medium",
      tags: Array.isArray(q.tags) ? q.tags : [],
      explanation: q.explanation || "",
      source: "raw-json",
      source_file: basename(filePath),
    }));
  } catch (e) {
    console.error(`  Failed to parse ${basename(filePath)}: ${e}`);
    return [];
  }
}

function extractFromRawJson(): any[] {
  console.log("\nSource 1: data/pyq/raw/*.json");
  const files = getAllFiles(RAW_DIR, ".json");
  console.log(`   Found ${files.length} JSON files`);
  const all: any[] = [];
  for (const file of files) {
    const questions = parseRawJsonFile(file);
    if (questions.length > 0) {
      console.log(`   + ${basename(file)}: ${questions.length} questions`);
      all.push(...questions);
    }
  }
  return all;
}

// ─── Source 2: Extracted JSON ─────────────────────────────────────────────────

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
  answer?: string | null;
}

function extractFromExtractedJson(): any[] {
  console.log("\nSource 2: tmp/gate-extracted/**/*.json");
  const files = getAllFiles(EXTRACTED_DIR, ".json").filter(f => !basename(f).includes("test_output"));
  console.log(`   Found ${files.length} JSON files`);
  const all: any[] = [];

  for (const file of files) {
    try {
      const raw = readFileSync(file, "utf-8");
      const data = JSON.parse(raw);
      let questions: ExtractedQuestion[] = [];

      if (Array.isArray(data)) {
        questions = data;
      } else if (typeof data === "object") {
        for (const key of Object.keys(data)) {
          const entry = data[key];
          if (entry && Array.isArray(entry.questions)) {
            questions = entry.questions.map((q: any, i: number) => ({
              ...q,
              question_number: q.question_number || i + 1,
              branch: q.branch || entry.branch || key.match(/^[A-Z]+/)?.[0] || "UNK",
              year: q.year || entry.year || 0,
              session: String(q.session || entry.session || "1"),
            }));
            break;
          }
        }
      }

      if (questions.length > 0) {
        console.log(`   + ${basename(file)}: ${questions.length} questions`);
        for (const q of questions) {
          all.push({
            id: generateQuestionId(q.branch, q.year, q.session, q.question_number, "extracted"),
            question_number: q.question_number,
            question_text: q.question_text || "",
            subject: q.section === "GA" ? "General Aptitude" : (q.section || "Unknown"),
            topic: "",
            options: q.options || null,
            answer: q.answer ?? null,
            question_type: q.question_type || "MCQ",
            marks: q.marks ?? 1,
            negative_marks: 0.33,
            branch: String(q.branch).toUpperCase(),
            year: q.year,
            session: String(q.session),
            difficulty: "medium",
            tags: [],
            explanation: "",
            source: "extracted-text",
            source_file: basename(file),
          });
        }
      }
    } catch (e) {
      console.error(`   Failed ${basename(file)}: ${e}`);
    }
  }
  return all;
}

// ─── Source 3: Raw text papers ────────────────────────────────────────────────

function extractFromTextPapers(): any[] {
  console.log("\nSource 3: tmp/gate-papers/**/*.txt (pdftotext output)");
  const files = getAllFiles(PAPERS_DIR, ".txt");
  console.log(`   Found ${files.length} text files`);
  const all: any[] = [];

  for (const file of files) {
    const fname = basename(file);
    console.log(`\n   Processing: ${fname}`);

    let branch = "UNK";
    let year = 0;
    let session = "1";

    const branchMatch = fname.match(/^([A-Z]{2,})[_\s-]?(\d{4})/i);
    if (branchMatch) {
      branch = branchMatch[1].toUpperCase();
      year = parseInt(branchMatch[2]);
    }

    const sessionMatch = fname.match(/s(\d)/i);
    if (sessionMatch) session = sessionMatch[1];

    try {
      const text = readFileSync(file, "utf-8");
      const questions = extractQuestionsFromText(text, branch, year, session);
      if (questions.length > 0) {
        console.log(`      + ${questions.length} questions extracted`);
        all.push(...questions);
      } else {
        console.log(`      - No questions found`);
      }
    } catch (e) {
      console.error(`      Error: ${e}`);
    }
  }
  return all;
}

function extractQuestionsFromText(text: string, branch: string, year: number, session: string): any[] {
  const questions: any[] = [];

  const clean = text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\f/g, "\n")
    .replace(/Organizing\s+Institute:[^\n]*\n?/g, "")
    .replace(/Page\s+\d+\s+of\s+\d+\n?/gi, "")
    .replace(
      /(Computer Science|Electronics|Electrical|Mechanical|Civil|Instrumentation|Production|Chemical|Biotechnology|Metallurgy|Engineering Sciences|Life Sciences|Textile|Petroleum|Ecology|Mathematics|Architecture|Agricultural|Geology|Physics)[^\n]*Set\s*\d+[^\n]*\n?/gi,
      ""
    )
    .replace(/General\s+Aptitude\s*\(GA\)\n?/gi, "")
    .replace(/Q\.\s*\d+[\s]*[–—\-][\s]*Q\.\s*\d+\s+Carry\s+(?:ONE|TWO)\s+marks?\s+Each\s*\n?/gi, "\n<<RANGE>>\n")
    .replace(/\n{4,}/g, "\n\n")
    .trim();

  const qPositions: { index: number; number: number }[] = [];
  const re = /^[ \t]*Q\.\s*(\d+)\s+/gm;
  let m;

  while ((m = re.exec(clean)) !== null) {
    const context = clean.substring(m.index, Math.min(m.index + 80, clean.length));
    if (/\bCarry\s+(?:ONE|TWO)\s+marks?\b/i.test(context)) continue;
    if (/Q\.\s*\d+\s*[–\-]/.test(context.substring(0, 30))) continue;
    qPositions.push({ index: m.index, number: parseInt(m[1]) });
  }

  for (let i = 0; i < qPositions.length; i++) {
    const pos = qPositions[i];
    const nextPos = qPositions[i + 1];
    const blockText = nextPos ? clean.substring(pos.index, nextPos.index) : clean.substring(pos.index);
    const trimmed = blockText.trim();
    if (trimmed.length < 20) continue;

    const body = trimmed.replace(/^Q\.\s*\d+/, "").trim();
    const optionStart = body.search(/\n\s*\([A-D]\)/);
    let textOnly = body;
    let optionsStr = "";

    if (optionStart > 0) {
      textOnly = body.substring(0, optionStart);
      optionsStr = body.substring(optionStart + 1);
    }

    textOnly = textOnly
      .replace(/Organizing\s+Institute:[^\n]*/g, "")
      .replace(/Set\s*\d+\s*\([^)]+\)/g, "")
      .replace(/Page\s+\d+\s+of\s+\d+/gi, "")
      .replace(/\s+/g, " ")
      .trim();

    const options = extractOptions(optionsStr);
    const qType = detectQuestionType(textOnly, !!options);
    const marks = /\bCarry\s+TWO\s+marks?\b/i.test(trimmed) ? 2 : 1;
    const isGA = pos.number <= 5;

    if (textOnly.length < 5) continue;

    questions.push({
      id: generateQuestionId(branch, year, session, pos.number, "text"),
      question_number: pos.number,
      question_text: textOnly,
      subject: isGA ? "General Aptitude" : branch,
      topic: "",
      options,
      answer: null,
      question_type: qType,
      marks,
      negative_marks: 0.33,
      branch,
      year,
      session: String(session),
      difficulty: "medium",
      tags: [],
      explanation: "",
      source: "pdftotext",
      source_file: "",
    });
  }
  return questions;
}

function detectQuestionType(text: string, hasOptions: boolean): string {
  const lower = text.toLowerCase();
  if (lower.includes("one or more") && (lower.includes("correct") || lower.includes("answer"))) {
    return "MSQ";
  }
  if (!hasOptions && /\b\d+\b/.test(text)) {
    return "NAT";
  }
  return "MCQ";
}

function extractOptions(optionsBlock: string): string[] | null {
  if (!optionsBlock) return null;
  const options: string[] = [];
  const re = /^[ \t]*\(([A-D])\)[ \t]*(.+?)(?=\n[ \t]*\([A-D]\)|$)/gms;
  let m;
  while ((m = re.exec(optionsBlock)) !== null) {
    const text = m[2].replace(/\n/g, " ").replace(/\s+/g, " ").trim();
    if (text.length > 0) options.push(text);
  }
  return options.length >= 2 ? options : null;
}

// ─── Source 4: SQL files ──────────────────────────────────────────────────────

function extractFromSql(): any[] {
  console.log("\nSource 4: tmp/gate-sql/*.sql");
  if (!existsSync(SQL_DIR)) {
    console.log("   Skipped: SQL directory not found");
    return [];
  }
  const files = getAllFiles(SQL_DIR, ".sql");
  console.log(`   Found ${files.length} SQL files`);
  const all: any[] = [];

  for (const file of files) {
    const fname = basename(file);
    console.log(`   ${fname}`);
    try {
      const sql = readFileSync(file, "utf-8");
      const questions = parseSqlInserts(sql, fname);
      console.log(`      + ${questions.length} questions`);
      all.push(...questions);
    } catch (e) {
      console.error(`      Error: ${e}`);
    }
  }
  return all;
}

function parseSqlInserts(sql: string, filename: string): any[] {
  const questions: any[] = [];
  let branch = "UNK";
  let year = 0;
  const fnameMatch = filename.match(/^([A-Z]{2,})_(\d{4})/);
  if (fnameMatch) {
    branch = fnameMatch[1].toUpperCase();
    year = parseInt(fnameMatch[2]);
  }

  // Match INSERT INTO pyq_questions(...) VALUES (...)
  const startRegex = /INSERT\s+INTO\s+pyq_questions[\s\S]*?\)\s*VALUES\s*\(/gi;
  let match;
  const sqlLen = sql.length;

  while ((match = startRegex.exec(sql)) !== null) {
    // match[0] ends with "VALUES (" — find that opening paren
    const valuesStart = match.index + match[0].length - 1; // position of opening (
    let depth = 1;
    let end = valuesStart;
    while (++end < sqlLen && depth > 0) {
      if (sql[end] === "'") {
        // Skip string literal
        end++;
        while (end < sqlLen && sql[end] !== "'") { if (sql[end] === '\\') end++; end++; }
        continue;
      }
      if (sql[end] === '(') depth++;
      else if (sql[end] === ')') depth--;
    }
    const valuesStr = sql.substring(valuesStart + 1, end - 1);
    const values = parseSqlValues(valuesStr);
    if (values.length < 16) continue;

    // Column order:
    // 0:id, 1:exam, 2:branch_code, 3:branch_name, 4:year, 5:session,
    // 6:question_number, 7:subject_id, 8:topic, 9:subtopic, 10:question_type,
    // 11:marks, 12:negative_marks, 13:question_text, 14:options,
    // 15:correct_answer, 16:difficulty, ...
    const branchCode = (values[2] || "").replace(/^'|'$/g, "").toUpperCase() || branch;
    const yearVal = parseInt(values[4]) || year;
    const sessionVal = (values[5] || "1").replace(/^'|'$/g, "");
    const qNum = parseInt(values[6]) || 0;
    const subject = (values[7] || "").replace(/^'|'$/g, "");
    const qType = (values[10] || "MCQ").replace(/^'|'$/g, "");
    const marks = parseInt(values[11]) || 1;
    const qText = (values[13] || "").replace(/^'|'$/g, "").replace(/\\n/g, " ").replace(/\\'/g, "'").trim();
    const optionsRaw = (values[14] || "").replace(/^'|'$/g, "");
    const answer = (values[15] || "").replace(/^'|'$/g, "");
    const difficultyVal = (values[16] || "2").replace(/^'|'$/g, "");

    let options: string[] | null = null;
    if (optionsRaw && optionsRaw !== "NULL" && optionsRaw.length > 0) {
      options = [];
      const optRegex = /ARRAY\['([^']*)'\]/g;
      let optMatch;
      while ((optMatch = optRegex.exec(optionsRaw)) !== null) {
        const text = optMatch[1].replace(/\\'/g, "'").replace(/\\n/g, " ").trim();
        if (text.length > 0) options.push(text);
      }
      if (options.length === 0) options = null;
    }

    if (qText.length < 10) continue;

    questions.push({
      id: generateQuestionId(branchCode, yearVal, sessionVal, qNum, "sql"),
      question_number: qNum,
      question_text: qText,
      subject: subject.toLowerCase().includes("ga") ? "General Aptitude" : (subject.replace(/^subj_/i, "").replace(/_/g, " ") || "Unknown"),
      topic: "",
      options,
      answer: answer === "NULL" || !answer ? null : answer,
      question_type: qType,
      marks,
      negative_marks: 0.33,
      branch: branchCode,
      year: yearVal,
      session: sessionVal,
      difficulty: parseInt(difficultyVal) === 3 ? "hard" : parseInt(difficultyVal) === 1 ? "easy" : "medium",
      tags: [],
      explanation: "",
      source: "sql",
      source_file: basename(filename),
    });
  }
  return questions;
}

function parseSqlValues(valuesStr: string): string[] {
  const values: string[] = [];
  let current = "";
  let inString = false;
  let escapeNext = false;

  for (let i = 0; i < valuesStr.length; i++) {
    const ch = valuesStr[i];
    if (escapeNext) {
      current += ch;
      escapeNext = false;
      continue;
    }
    if (ch === "\\" && inString) {
      escapeNext = true;
      continue;
    }
    if (ch === "'" && !escapeNext) {
      inString = !inString;
      current += ch;
      continue;
    }
    if (ch === "," && !inString) {
      values.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  if (current.trim()) values.push(current.trim());
  return values;
}

// ─── Source 5: PDF files ──────────────────────────────────────────────────────

function extractFromPdfs(): any[] {
  console.log("\nSource 5: tmp/gate-papers/**/*.pdf");
  const files = getAllFiles(PAPERS_DIR, ".pdf");
  if (files.length === 0) {
    console.log("   Skipped: no PDF files");
    return [];
  }
  console.log(`   Found ${files.length} PDFs (skipping — run pdftotext first)`);
  return [];
}

// ─── Deduplication ────────────────────────────────────────────────────────────

function deduplicate(questions: any[]): any[] {
  console.log(`\nDeduplicating ${questions.length} total questions...`);

  const byKey = new Map<string, any>();
  const byText = new Map<string, any>();

  for (const q of questions) {
    const key = `${q.branch}-${q.year}-S${q.session}-Q${q.question_number}`;
    if (!byKey.has(key)) {
      byKey.set(key, q);
    } else {
      const existing = byKey.get(key);
      if ((q.options?.length || 0) > (existing.options?.length || 0)) {
        byKey.set(key, q);
      }
      continue;
    }

    const textKey = `${q.branch}-${q.year}-${q.question_text.toLowerCase().replace(/\s+/g, " ").trim().substring(0, 80)}`;
    if (!byText.has(textKey)) {
      byText.set(textKey, q);
    }
  }

  const result = Array.from(byText.values());
  console.log(`   + ${result.length} unique questions after dedup`);
  return result;
}

// ─── Output ───────────────────────────────────────────────────────────────────

function groupByBranch(questions: any[]): Record<string, any[]> {
  const groups: Record<string, any[]> = {};
  for (const q of questions) {
    const branch = q.branch || "UNK";
    if (!groups[branch]) groups[branch] = [];
    groups[branch].push(q);
  }
  return groups;
}

function writeOutput(groups: Record<string, any[]>): void {
  ensureDir(OUT_DIR);
  let totalQuestions = 0;

  for (const [branch, questions] of Object.entries(groups)) {
    questions.sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      const sessA = parseInt(a.session) || 0;
      const sessB = parseInt(b.session) || 0;
      if (sessA !== sessB) return sessB - sessA;
      return (a.question_number || 0) - (b.question_number || 0);
    });

    questions.forEach((q, i) => {
      q.id = `GATE-${branch}-${String(i + 1).padStart(4, "0")}`;
    });

    const output = {
      branch,
      totalQuestions: questions.length,
      yearRange: {
        min: Math.min(...questions.map(q => q.year)),
        max: Math.max(...questions.map(q => q.year)),
      },
      sessions: [...new Set(questions.map(q => q.session))],
      generatedAt: new Date().toISOString(),
      questions,
    };

    const outFile = join(OUT_DIR, `${branch}.json`);
    writeFileSync(outFile, JSON.stringify(output, null, 2));
    console.log(`   + ${branch}: ${questions.length} questions -> ${outFile}`);
    totalQuestions += questions.length;
  }

  const index = {
    generatedAt: new Date().toISOString(),
    totalQuestions,
    branches: Object.entries(groups).map(([branch, questions]) => ({
      branch,
      count: questions.length,
      years: [...new Set(questions.map(q => q.year))].sort(),
      sessions: [...new Set(questions.map(q => `S${q.session}`))],
      subjects: [...new Set(questions.map(q => q.subject))].sort(),
    })),
  };

  writeFileSync(join(OUT_DIR, "index.json"), JSON.stringify(index, null, 2));
  console.log(`\nMaster index -> ${join(OUT_DIR, "index.json")}`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("PYQ Master Extractor");
  console.log("Collecting questions from all available sources...\n");

  const allQuestions: any[] = [];

  const rawQuestions = extractFromRawJson();
  allQuestions.push(...rawQuestions);

  const extractedQuestions = extractFromExtractedJson();
  allQuestions.push(...extractedQuestions);

  const textQuestions = extractFromTextPapers();
  allQuestions.push(...textQuestions);

  const sqlQuestions = extractFromSql();
  allQuestions.push(...sqlQuestions);

  const pdfQuestions = extractFromPdfs();
  allQuestions.push(...pdfQuestions);

  console.log(`\n\nTotal collected: ${allQuestions.length} questions`);

  if (allQuestions.length === 0) {
    console.log("\nNo questions found! Make sure you have:");
    console.log("   - data/pyq/raw/*.json files, OR");
    console.log("   - tmp/gate-papers/**/*.txt files (from pdftotext)");
    console.log("   - tmp/gate-extracted/**/*.json files");
    return;
  }

  const unique = deduplicate(allQuestions);
  const groups = groupByBranch(unique);

  console.log(`\nBranch breakdown:`);
  for (const [branch, questions] of Object.entries(groups).sort()) {
    const years = [...new Set(questions.map(q => q.year))].sort();
    const subjects = [...new Set(questions.map(q => q.subject))].length;
    console.log(`   ${branch}: ${questions.length} questions (${years.join(", ")} | ${subjects} subjects)`);
  }

  writeOutput(groups);
  console.log("\nDone! All PYQs processed and saved to data/pyq/processed/");
}

main().catch(console.error);
