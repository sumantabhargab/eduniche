import { createServerClient } from "@/lib/supabase/server";
import type { GameQuestion } from "../types";

export async function getGameQuestionById(id: string): Promise<{
  data: GameQuestion | null;
  error: string | null;
}> {
  const supabase = await createServerClient();
  if (!supabase)
    return { data: null, error: "Database not configured." };

  const { data, error } = await supabase
    .from("gate_game_questions")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) return { data: null, error: error.message };
  if (!data) return { data: null, error: null };

  return { data: data as GameQuestion, error: null };
}

export async function createGameQuestion(
  input: Partial<GameQuestion>
): Promise<{ data: GameQuestion | null; error: string | null }> {
  const supabase = await createServerClient();
  if (!supabase)
    return { data: null, error: "Database not configured." };

  const { data, error } = await supabase
    .from("gate_game_questions")
    .insert({
      question_text: input.question_text?.trim() || "",
      option_a: input.option_a?.trim() || "",
      option_b: input.option_b?.trim() || "",
      option_c: input.option_c?.trim() || "",
      option_d: input.option_d?.trim() || "",
      correct_option: input.correct_option || "A",
      branch: input.branch || "cse",
      topic: (input.topic || "").trim(),
      difficulty: input.difficulty || "medium",
      status: input.status || "active",
    })
    .select("*")
    .single();

  if (error) return { data: null, error: error.message };
  return { data: data as GameQuestion, error: null };
}

export async function updateGameQuestion(
  id: string,
  patch: Partial<GameQuestion>
): Promise<{ data: GameQuestion | null; error: string | null }> {
  const supabase = await createServerClient();
  if (!supabase)
    return { data: null, error: "Database not configured." };

  const update: Record<string, any> = {};

  if (patch.question_text !== undefined)
    update.question_text = patch.question_text.trim();
  if (patch.option_a !== undefined) update.option_a = patch.option_a.trim();
  if (patch.option_b !== undefined) update.option_b = patch.option_b.trim();
  if (patch.option_c !== undefined) update.option_c = patch.option_c.trim();
  if (patch.option_d !== undefined) update.option_d = patch.option_d.trim();
  if (patch.correct_option !== undefined)
    update.correct_option = patch.correct_option;
  if (patch.branch !== undefined) update.branch = patch.branch;
  if (patch.topic !== undefined) update.topic = (patch.topic || "").trim();
  if (patch.difficulty !== undefined) update.difficulty = patch.difficulty;
  if (patch.status !== undefined) update.status = patch.status;

  const { data, error } = await supabase
    .from("gate_game_questions")
    .update(update)
    .eq("id", id)
    .select("*")
    .single();

  if (error) return { data: null, error: error.message };
  return { data: data as GameQuestion, error: null };
}

export async function deleteGameQuestion(id: string): Promise<{ error: string | null }> {
  const supabase = await createServerClient();
  if (!supabase)
    return { error: "Database not configured." };

  const { error } = await supabase
    .from("gate_game_questions")
    .delete()
    .eq("id", id);

  return { error: error?.message ?? null };
}
