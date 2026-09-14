/**
 * Answer Synthesis Retry Pipeline
 *
 * Retries failed questions with proper rate limiting.
 * Handles 429 with exponential backoff.
 * Strips reasoning tokens from Groq responses.
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const ROOT = join(process.cwd());
const PAPERS_DIR = join(ROOT, "data", "predicted-papers");
const GROQ_API_KEY = process.env.GROQ_API_KEY;

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

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function extractJSON(content: string): any | null {
  // Try direct parse first
  try {
    return JSON.parse(content);
  } catch {
    // Try to find JSON object in the content
    const match = content.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

async function groqRequest(
  question: Question,
  retryCount: number = 0
): Promise<{ answer: string; explanation: string } | null> {
  const delay = 5000 * Math.pow(2, retryCount);
  if (retryCount > 0) {
    await sleep;
  }

  let optionsText = "";
  if (question.options && question.options.length > 0) {
    const labels = ["A", "B", "C", "D", "E", "F"];
    optionsText = "\nOptions:\n" + question.options.map((opt, j) => `${labels[j]}. ${opt}`).join("\n");
  }

  const natNote = question.questionType === "NAT" ? "\nThis is a Numerical Answer Type. Provide the exact numerical value." : "";
  const msqNote = question.questionType === "MSQ" ? "\nThis is a Multiple Select Question. Provide ALL correct options as comma-separated letters (e.g., 'A,C,D')." : "";

  const prompt = `Solve this GATE ${question.branch} exam question.

Subject: ${question.subject}
Topic: ${question.topic || "General"}
Marks: ${question.marks}

Question:
${question.questionText}${optionsText}${natNote}${msqNote}

Respond with ONLY this JSON format (no other text):
{"answer": "correct answer", "explanation": "brief reasoning"}`;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "groq/compound-mini",
        messages: [
          {
            role: "system",
            content: "You are a GATE exam expert. Output ONLY valid JSON, no other text."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 200
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      if (response.status === 429 && retryCount < 3) {
        console.log(`\n   Rate limited, retrying in ${delay / 1000}s...`);
        return groqRequest(question, retryCount + 1);
      }
      console.error(`\n   API error ${response.status}:`, errorText.substring(0, 100));
      return null;
    }

    const data = await response.json() as any;
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;

    const parsed = extractJSON(content);
    if (parsed && parsed.answer) {
      return {
        answer: parsed.answer,
        explanation: parsed.explanation || ""
      };
    }
    return null;
  } catch (error) {
    console.error(`\n   Request failed:`, error);
    return null;
  }
}

async function retryAnswers() {
  console.log("\n=== Answer Synthesis Retry ===\n");

  if (!GROQ_API_KEY) {
    console.error("ERROR: GROQ_API_KEY not set");
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
      console.warn(`   Warning: ${file} not found`);
      continue;
    }
    const data = JSON.parse(readFileSync(filePath, "utf-8"));
    branches.push(data);
  }

  // Find questions without answers
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
    console.log("\n   All questions have answers! ✓");
    return;
  }

  // Process one at a time with 10-second delays
  console.log("\nStep 2: Synthesizing answers (10s delay between requests)...");
  let succeeded = 0;
  let failed = 0;

  for (let i = 0; i < questionsNeedingAnswers.length; i++) {
    const item = questionsNeedingAnswers[i];
    const progress = Math.round((i + 1) / questionsNeedingAnswers.length * 100);

    process.stdout.write(`\r   Progress: ${i + 1}/${questionsNeedingAnswers.length} (${progress}%) - ${item.branch} Q${item.question.questionNumber}`);

    const result = await groqRequest(item.question);

    if (result && result.answer) {
      item.question.correctAnswer = result.answer;
      item.question.explanation = result.explanation;
      succeeded++;
    } else {
      failed++;
    }

    // Wait 1 second between requests
    await sleep;
  }

  console.log(`\n\n   Completed: ${succeeded} succeeded, ${failed} failed`);

  // Validate
  console.log("\nStep 3: Validating answers...");
  let validCount = 0;
  let invalidCount = 0;
  const invalidQuestions: string[] = [];

  for (const branch of branches) {
    for (const paper of branch.papers) {
      for (const question of paper.questions) {
        if (question.correctAnswer && question.correctAnswer !== "" && question.correctAnswer !== "null") {
          validCount++;
        } else {
          invalidCount++;
          invalidQuestions.push(`${branch.branch} ${paper.id} Q${question.questionNumber}`);
        }
      }
    }
  }

  console.log(`   Valid: ${validCount}, Invalid: ${invalidCount}`);

  if (invalidQuestions.length > 0) {
    console.log("\n   Still missing answers:");
    invalidQuestions.forEach(q => console.log(`      - ${q}`));
  }

  // Save updated papers
  console.log("\nStep 4: Saving updated papers...");
  for (const branch of branches) {
    const filePath = join(PAPERS_DIR, `${branch.branch.toLowerCase()}.json`);
    writeFileSync(filePath, JSON.stringify(branch, null, 2));
    console.log(`   Saved ${branch.branch}.json`);
  }

  // Summary
  console.log("\n=== Summary ===");
  console.log(`   Branches: ${branches.length}`);
  console.log(`   Papers: ${branches.reduce((sum, b) => sum + b.papers.length, 0)}`);
  console.log(`   Total questions: ${validCount + invalidCount}`);
  console.log(`   Questions with answers: ${validCount}`);
  console.log(`   Questions without answers: ${invalidCount}`);
  console.log(`   Success rate: ${Math.round(validCount / (validCount + invalidCount) * 100)}%`);
}

retryAnswers().catch(error => {
  console.error("\nRetry failed:", error);
  process.exit(1);
});
