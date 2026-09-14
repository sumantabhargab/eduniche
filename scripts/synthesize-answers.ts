/**
 * Answer Synthesis Pipeline
 *
 * Processes all mock paper questions and synthesizes answers using Groq AI.
 * Uses batch processing for efficiency (~500 API calls instead of ~5200).
 * Validates all answers before saving.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

const ROOT = join(process.cwd());
const PAPERS_DIR = join(ROOT, "data", "predicted-papers");
const OUTPUT_DIR = join(ROOT, "data", "predicted-papers");
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const BATCH_SIZE = 10;
const RATE_DELAY_MS = 2000; // 2 second delay between API calls

// ─── Types ────────────────────────────────────────────────────────────────────

interface Question {
  id: string;
  questionNumber: number;
  subject: string;
  topic: string;
  questionType: string;
  marks: number;
  negativeMarks: number;
  difficulty: string;
  questionText: string;
  options: string[] | null;
  correctAnswer: string;
  explanation: string;
  source: string;
}

interface Paper {
  id: string;
  branch: string;
  title: string;
  description: string;
  createdAt: string;
  totalQuestions: number;
  totalMarks: number;
  difficultyDistribution: Record<string, number>;
  subjectBreakdown: Record<string, number>;
  predictionRationale: string;
  questions: Question[];
}

interface BranchData {
  branch: string;
  papers: Paper[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function groqBatchRequest(questions: Question[]): Promise<Map<string, { answer: string; explanation: string }>> {
  const results = new Map<string, { answer: string; explanation: string }>();

  // Build batch prompt
  const questionsText = questions.map((q, i) => {
    let optionsText = "";
    if (q.options && q.options.length > 0) {
      const labels = ["A", "B", "C", "D", "E", "F"];
      optionsText = "\nOptions:\n" + q.options.map((opt, j) => `${labels[j]}. ${opt}`).join("\n");
    }

    const natNote = q.questionType === "NAT" ? "\nThis is a Numerical Answer Type. Provide the exact numerical value." : "";
    const msqNote = q.questionType === "MSQ" ? "\nThis is a Multiple Select Question. Provide ALL correct options as comma-separated letters (e.g., 'A,B,C')." : "";

    return `[Q${i + 1}] ${q.questionText}${optionsText}${natNote}${msqNote}`;
  }).join("\n\n");

  const prompt = `You are a GATE exam expert. Solve these ${questions.length} questions and provide answers in JSON format.

For each question:
- MCQ: Return the single correct option letter (A, B, C, or D)
- MSQ: Return all correct option letters comma-separated (e.g., "A,C,D")
- NAT: Return the numerical answer as a number

${questionsText}

Respond with ONLY a JSON object in this exact format:
{
  "answers": [
    {"q": 1, "answer": "B", "explanation": "Brief reasoning"},
    {"q": 2, "answer": "A,C", "explanation": "Brief reasoning"},
    {"q": 3, "answer": "42", "explanation": "Brief reasoning"}
  ]
}`;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        messages: [
          {
            role: "system",
            content: "You are an expert GATE exam solver. Provide accurate, verified answers with concise explanations. Output valid JSON only."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 2000,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`   Groq API error ${response.status}:`, errorText.substring(0, 200));
      return results;
    }

    const data = await response.json() as any;
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      console.error("   No content in Groq response");
      return results;
    }

    const parsed = JSON.parse(content);
    if (parsed.answers && Array.isArray(parsed.answers)) {
      for (const ans of parsed.answers) {
        const q = questions[ans.q - 1];
        if (q && ans.answer) {
          results.set(q.id, {
            answer: ans.answer,
            explanation: ans.explanation || ""
          });
        }
      }
    }
  } catch (error) {
    console.error("   Groq request failed:", error);
  }

  return results;
}

// ─── Main Pipeline ────────────────────────────────────────────────────────────

async function synthesizeAnswers() {
  console.log("\n=== Answer Synthesis Pipeline ===\n");

  if (!GROQ_API_KEY) {
    console.error("ERROR: GROQ_API_KEY not set in environment");
    console.error("Set it with: export GROQ_API_KEY=your_key");
    process.exit(1);
  }

  // Load all branches
  console.log("Step 1: Loading papers...");
  const branches: BranchData[] = [];

  for (const file of ["CS.json", "EC.json", "EE.json", "ME.json", "CE.json",
                        "IN.json", "PI.json", "CH.json", "BT.json", "MT.json",
                        "TF.json", "PE.json", "EY.json", "MA.json", "AR.json",
                        "AG.json", "GG.json", "PH.json", "XE.json", "XL.json"]) {
    const filePath = join(PAPERS_DIR, file);
    if (!existsSync(filePath)) {
      console.warn(`   Warning: ${file} not found, skipping`);
      continue;
    }
    const data = JSON.parse(readFileSync(filePath, "utf-8"));
    branches.push(data);
  }

  console.log(`   Loaded ${branches.length} branches`);

  // Find questions without answers
  console.log("\nStep 2: Finding questions without answers...");
  const questionsNeedingAnswers: { branch: string; paper: Paper; question: Question }[] = [];

  for (const branch of branches) {
    for (const paper of branch.papers) {
      for (const question of paper.questions) {
        if (!question.correctAnswer || question.correctAnswer === "" || question.correctAnswer === "null") {
          questionsNeedingAnswers.push({ branch: branch.branch, paper, question });
        }
      }
    }
  }

  console.log(`   Found ${questionsNeedingAnswers.length} questions needing answers`);

  if (questionsNeedingAnswers.length === 0) {
    console.log("\n   All questions already have answers!");
    return;
  }

  // Process in batches
  console.log("\nStep 3: Synthesizing answers in batches...");
  let processed = 0;
  let succeeded = 0;
  let failed = 0;

  for (let i = 0; i < questionsNeedingAnswers.length; i += BATCH_SIZE) {
    const batch = questionsNeedingAnswers.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(questionsNeedingAnswers.length / BATCH_SIZE);

    console.log(`   Batch ${batchNum}/${totalBatches} (${batch.length} questions)...`);

    const results = await groqBatchRequest(batch.map(b => b.question));

    for (const item of batch) {
      const result = results.get(item.question.id);
      if (result && result.answer) {
        item.question.correctAnswer = result.answer;
        item.question.explanation = result.explanation;
        succeeded++;
      } else {
        failed++;
        console.warn(`      Failed: ${item.branch} Q${item.question.questionNumber}`);
      }
      processed++;
    }

    console.log(`      Progress: ${processed}/${questionsNeedingAnswers.length} (${Math.round(processed / questionsNeedingAnswers.length * 100)}%)`);

    // Rate limiting
    if (i + BATCH_SIZE < questionsNeedingAnswers.length) {
      await sleep(RATE_DELAY_MS);
    }
  }

  console.log(`\n   Completed: ${succeeded} succeeded, ${failed} failed`);

  // Validate answers
  console.log("\nStep 4: Validating answers...");
  let validCount = 0;
  let invalidCount = 0;

  for (const branch of branches) {
    for (const paper of branch.papers) {
      for (const question of paper.questions) {
        if (question.correctAnswer && question.correctAnswer !== "" && question.correctAnswer !== "null") {
          validCount++;
        } else {
          invalidCount++;
          console.warn(`   Missing answer: ${branch.branch} ${paper.id} Q${question.questionNumber}`);
        }
      }
    }
  }

  console.log(`   Valid: ${validCount}, Invalid: ${invalidCount}`);

  // Save updated papers
  console.log("\nStep 5: Saving updated papers...");
  for (const branch of branches) {
    const filePath = join(PAPERS_DIR, `${branch.branch.toLowerCase()}.json`);
    writeFileSync(filePath, JSON.stringify(branch, null, 2));
    console.log(`   Saved ${branch.branch}.json`);
  }

  // Generate summary
  console.log("\n=== Summary ===");
  console.log(`   Branches processed: ${branches.length}`);
  console.log(`   Total papers: ${branches.reduce((sum, b) => sum + b.papers.length, 0)}`);
  console.log(`   Total questions: ${validCount + invalidCount}`);
  console.log(`   Questions with answers: ${validCount}`);
  console.log(`   Questions without answers: ${invalidCount}`);
  console.log(`   Success rate: ${Math.round(validCount / (validCount + invalidCount) * 100)}%`);
}

synthesizeAnswers().catch(error => {
  console.error("Pipeline failed:", error);
  process.exit(1);
});
