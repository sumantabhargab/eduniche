/**
 * Parses gate_cse_toc_pyqs.md and generates a structured TypeScript data file.
 * Run: npx tsx scripts/parse-pyqs.ts
 */

import * as fs from "fs";
import * as path from "path";

const MARKDOWN_FILE = path.join(__dirname, "..", "..", "..", "gate_cse_toc_pyqs.md");

const text = fs.readFileSync(MARKDOWN_FILE, "utf-8");

interface Question {
  id: string;
  subject: string;
  topic: string;
  year: number;
  set?: string;
  marks: number;
  type: "MCQ" | "MSQ" | "NAT";
  question: string;
  options?: string[];
  answer: string;
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
  tags: string[];
}

const questions: Question[] = [];
let idCounter = 1;

// Parse markdown questions
const topicRegex = /## 🔹 (\d+)\. (.+)/g;
const questionRegex = /### Q(\d+) — (.+?) \| (\d+) Marks? \| (\w+)\n\*\*Question:\*\* (.+?)(?:\n- \*\*A:\*\* (.+?)\n- \*\*B:\*\* (.+?)\n- \*\*C:\*\* (.+?)\n- \*\*D:\*\* (.+?))?\n\*\*Answer:\*\* (.+?)\n\*\*Explanation:\*\* (.+?)(?=\n---\n|\n## 🔹|$)/gs;

let currentTopic = "";
let currentTopicNum = "";

const lines = text.split("\n");
let i = 0;
while (i < lines.length) {
  const line = lines[i];

  // Topic header
  const topicMatch = line.match(/^## 🔹 (\d+)\. (.+)/);
  if (topicMatch) {
    currentTopicNum = topicMatch[1];
    currentTopic = topicMatch[2].trim();
    i++;
    continue;
  }

  // Question header
  const qMatch = line.match(/^### Q(\d+) — (.+?) \| (\d+) Marks? \| (\w+)/);
  if (qMatch) {
    const qNum = qMatch[1];
    const header = qMatch[2].trim();
    const marks = parseInt(qMatch[3]);
    const type = qMatch[4] as "MCQ" | "MSQ" | "NAT";

    // Parse year from header
    const yearMatch = header.match(/(\d{4})/);
    const year = yearMatch ? parseInt(yearMatch[1]) : 2004;

    // Parse set info
    let set: string | undefined;
    const setMatch = header.match(/SET-(\d)/i);
    if (setMatch) set = `SET-${setMatch[1]}`;

    // Determine subject
    const subject = "Computer Science";

    // Read the question text and options
    let questionText = "";
    const options: string[] = [];
    let answer = "";
    let explanation = "";

    i++;
    while (i < lines.length && !lines[i].match(/^### Q\d+/) && !lines[i].match(/^## 🔹/)) {
      const l = lines[i];
      if (l.startsWith("**Question:**")) {
        questionText = l.replace("**Question:**", "").trim();
        // Read continuation lines
        i++;
        while (i < lines.length && !lines[i].startsWith("- **A:**") && !lines[i].startsWith("**Answer:**") && !lines[i].startsWith("---") && !lines[i].startsWith("## 🔹") && !lines[i].startsWith("### Q")) {
          questionText += " " + lines[i].trim();
          i++;
        }
        i--;
      } else if (l.match(/^- \*\*A:\*\*/)) {
        options.push(l.replace("- **A:**", "").trim());
      } else if (l.match(/^- \*\*B:\*\*/)) {
        options.push(l.replace("- **B:**", "").trim());
      } else if (l.match(/^- \*\*C:\*\*/)) {
        options.push(l.replace("- **C:**", "").trim());
      } else if (l.match(/^- \*\*D:\*\*/)) {
        options.push(l.replace("- **D:**", "").trim());
      } else if (l.startsWith("**Answer:**")) {
        answer = l.replace("**Answer:**", "").trim();
        // Handle multi-line answers
        i++;
        while (i < lines.length && !lines[i].startsWith("**Explanation:**") && !lines[i].startsWith("---") && !lines[i].startsWith("## 🔹") && !lines[i].startsWith("### Q")) {
          if (lines[i].trim()) answer += " " + lines[i].trim();
          i++;
        }
        i--;
      } else if (l.startsWith("**Explanation:**")) {
        explanation = l.replace("**Explanation:**", "").trim();
        // Read continuation
        i++;
        while (i < lines.length && !lines[i].startsWith("---") && !lines[i].startsWith("## 🔹") && !lines[i].startsWith("### Q")) {
          if (lines[i].trim()) explanation += "\n" + lines[i].trim();
          i++;
        }
        i--;
      }
      i++;
    }

    // Generate tags
    const tags = [currentTopic.toLowerCase()];
    if (set) tags.push(`set-${set.toLowerCase().replace("-", "")}`);
    if (year >= 2023) tags.push("recent");
    if (marks === 1) tags.push("1-mark");
    else if (marks === 2) tags.push("2-mark");
    else tags.push(`${marks}-marks`);

    // Determine difficulty
    let difficulty: "easy" | "medium" | "hard" = "medium";
    if (marks === 1 || (year >= 2024 && type === "MCQ")) difficulty = "easy";
    if (marks === 2 && (type === "MSQ" || type === "NAT" || year <= 2020)) difficulty = "hard";

    const qid = `cse-toc-${idCounter.toString().padStart(3, "0")}`;

    questions.push({
      id: qid,
      subject,
      topic: currentTopic,
      year,
      set,
      marks,
      type,
      question: questionText.replace(/\*\*/g, ""),
      options: options.length > 0 ? options : undefined,
      answer: answer.replace(/\*\*/g, ""),
      explanation: explanation.replace(/\*\*/g, ""),
      difficulty,
      tags,
    });
    idCounter++;
  }

  i++;
}

// Generate TypeScript file
const outputPath = path.join(__dirname, "..", "data", "questions-cse-toc.ts");

const tsContent = `/**
 * GATE CSE — Theory of Computation (TOC) Questions
 * Auto-generated from gate_cse_toc_pyqs.md
 * ${questions.length} questions covering 2004–2026
 *
 * DO NOT EDIT MANUALLY — run scripts/parse-pyqs.ts to regenerate.
 */

export interface Question {
  id: string;
  subject: string;
  topic: string;
  year: number;
  set?: string;
  marks: number;
  type: "MCQ" | "MSQ" | "NAT";
  question: string;
  options?: string[];
  answer: string;
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
  tags: string[];
}

export const TOC_QUESTIONS: Question[] = ${JSON.stringify(questions, null, 2)};

export const TOC_META = {
  subject: "Theory of Computation",
  subjectId: "cset-toc",
  totalQuestions: ${questions.length},
  yearRange: "${Math.min(...questions.map(q => q.year))}–${Math.max(...questions.map(q => q.year))}",
  questionTypes: {
    mcq: ${questions.filter(q => q.type === "MCQ").length},
    msq: ${questions.filter(q => q.type === "MSQ").length},
    nat: ${questions.filter(q => q.type === "NAT").length},
  },
  topics: ${JSON.stringify([...new Set(questions.map(q => q.topic))])},
};
`;

fs.writeFileSync(outputPath, tsContent);
console.log(`Generated ${outputPath}`);
console.log(`Parsed ${questions.length} questions across ${new Set(questions.map(q => q.topic)).size} topics`);
console.log(`Years: ${Math.min(...questions.map(q => q.year))}–${Math.max(...questions.map(q => q.year))}`);
