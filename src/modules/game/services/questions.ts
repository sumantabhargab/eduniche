import type { GameQuestion, BranchId } from "../types";

const BATCH_SIZE = 10;

export async function getQuestionsForBranch(
  branch: BranchId,
  limit = BATCH_SIZE,
  usedIds: Set<string> = new Set()
): Promise<GameQuestion[]> {
  const res = await fetch(`/api/game/questions?branch=${branch}&limit=${limit}`);
  if (!res.ok) throw new Error("Failed to load questions");
  const data = await res.json();
  return (data.questions as GameQuestion[]).filter((q) => !usedIds.has(q.id));
}

export function toAnswerMapping(q: GameQuestion): { A: string; B: string; C: string; D: string } {
  return {
    A: q.option_a,
    B: q.option_b,
    C: q.option_c,
    D: q.option_d,
  };
}

export function getCorrectAnswer(q: GameQuestion): { letter: "A" | "B" | "C" | "D"; text: string } {
  const map: Record<string, string> = {
    A: q.option_a,
    B: q.option_b,
    C: q.option_c,
    D: q.option_d,
  };
  return { letter: q.correct_option, text: map[q.correct_option] };
}
