/**
 * GET /api/game/questions
 * Public endpoint: returns random active questions for a specific branch.
 * Used by the game frontend.
 */
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import type { GameQuestion } from "@/modules/game/types";

export const dynamic = "force-dynamic";

const DEMO_QUESTIONS: GameQuestion[] = [
  { id: "demo-1", question_text: "Which data structure is primarily used for BFS?", option_a: "Stack", option_b: "Queue", option_c: "Heap", option_d: "Tree", correct_option: "B", branch: "cse", topic: "Data Structures", difficulty: "easy", status: "active", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "demo-2", question_text: "What is the time complexity of binary search?", option_a: "O(n)", option_b: "O(log n)", option_c: "O(n^2)", option_d: "O(1)", correct_option: "B", branch: "cse", topic: "Algorithms", difficulty: "easy", status: "active", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "demo-3", question_text: "Which TCP/IP layer does IP operate at?", option_a: "Application", option_b: "Transport", option_c: "Network", option_d: "Data Link", correct_option: "C", branch: "cse", topic: "Computer Networks", difficulty: "easy", status: "active", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "demo-4", question_text: "What does DBMS stand for?", option_a: "Data Base Management System", option_b: "Database Machine System", option_c: "Data Binary Management System", option_d: "None of the above", correct_option: "A", branch: "cse", topic: "DBMS", difficulty: "easy", status: "active", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "demo-5", question_text: "Which sorting algorithm has O(n log n) worst-case complexity?", option_a: "Quick Sort", option_b: "Merge Sort", option_c: "Bubble Sort", option_d: "Insertion Sort", correct_option: "B", branch: "cse", topic: "Algorithms", difficulty: "medium", status: "active", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "demo-6", question_text: "What is the size of a MAC address?", option_a: "32 bits", option_b: "64 bits", option_c: "128 bits", option_d: "48 bits", correct_option: "D", branch: "cse", topic: "Computer Networks", difficulty: "easy", status: "active", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "demo-7", question_text: "Which of these is not a page replacement algorithm?", option_a: "FIFO", option_b: "LRU", option_c: "Optimal", option_d: "BFS", correct_option: "D", branch: "cse", topic: "OS", difficulty: "easy", status: "active", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "demo-8", question_text: "What is the normal form where every non-key attribute is functionally dependent on the key?", option_a: "1NF", option_b: "2NF", option_c: "3NF", option_d: "BCNF", correct_option: "C", branch: "cse", topic: "DBMS", difficulty: "medium", status: "active", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "demo-9", question_text: "Which language accepts context-free grammars?", option_a: "Finite Automata", option_b: "Pushdown Automata", option_c: "Turing Machine", option_d: "Linear Bounded Automata", correct_option: "B", branch: "cse", topic: "TOC", difficulty: "medium", status: "active", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "demo-10", question_text: "In which addressing mode is the operand in memory?", option_a: "Register", option_b: "Immediate", option_c: "Direct", option_d: "Implied", correct_option: "C", branch: "cse", topic: "COA", difficulty: "medium", status: "active", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "demo-11", question_text: "What is the frequency range of VHF?", option_a: "30-300 Hz", option_b: "30-300 kHz", option_c: "30-300 MHz", option_d: "300-3000 MHz", correct_option: "C", branch: "ece", topic: "Communication Systems", difficulty: "easy", status: "active", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "demo-12", question_text: "Which number system is used in digital electronics?", option_a: "Decimal", option_b: "Binary", option_c: "Octal", option_d: "Hexadecimal", correct_option: "B", branch: "ece", topic: "Digital Electronics", difficulty: "easy", status: "active", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "demo-13", question_text: "Ohm's Law relates:", option_a: "V and I", option_b: "I and R", option_c: "V and R", option_d: "V, I and R", correct_option: "D", branch: "ece", topic: "Network Theory", difficulty: "easy", status: "active", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "demo-14", question_text: "Op-amp stands for:", option_a: "Operational amplifier", option_b: "Optical amplifier", option_c: "Organic amplifier", option_d: "None", correct_option: "A", branch: "ece", topic: "Analog Electronics", difficulty: "easy", status: "active", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "demo-15", question_text: "What is the unit of electrical resistance?", option_a: "Volt", option_b: "Ampere", option_c: "Ohm", option_d: "Watt", correct_option: "C", branch: "ee", topic: "Electrical Machines", difficulty: "easy", status: "active", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

function getDemoQuestions(branch: string, limit: number): GameQuestion[] {
  const branchQuestions = DEMO_QUESTIONS.filter(q => q.branch === branch);
  if (branchQuestions.length === 0) return DEMO_QUESTIONS.slice(0, limit);
  const shuffled = [...branchQuestions];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, limit);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const branch = url.searchParams.get("branch") || "cse";
  const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get("limit") || "10")));

  const supabase = await createServerClient();
  let questions: GameQuestion[] = [];
  let fromDb = false;

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("gate_game_questions")
        .select("*")
        .eq("branch", branch)
        .eq("status", "active")
        .limit(limit * 2);

      if (!error && data && data.length > 0) {
        questions = data as GameQuestion[];
        fromDb = true;
      }
    } catch {
      // table may not exist yet, fall through to demo
    }
  }

  if (!fromDb) {
    questions = getDemoQuestions(branch, limit);
  }

  // Shuffle
  for (let i = questions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [questions[i], questions[j]] = [questions[j], questions[i]];
  }

  questions = questions.slice(0, limit);

  return NextResponse.json({ questions, demo: !fromDb });
}
