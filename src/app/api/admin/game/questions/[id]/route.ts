/**
 * GET    /api/admin/game/questions/[id]
 * PUT    /api/admin/game/questions/[id]
 * DELETE /api/admin/game/questions/[id]
 *
 * Requires admin authentication.
 */

import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const supabase = await createServerClient();
  if (!supabase) {
    return { error: NextResponse.json({ error: "Server not configured." }, { status: 500 }) };
  }

  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session?.user) {
    return { error: NextResponse.json({ error: "Unauthorized." }, { status: 401 }) };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .maybeSingle();

  const role = (profile as any)?.role;
  if (profileError || role !== "admin") {
    return { error: NextResponse.json({ error: "Admin access required." }, { status: 403 }) };
  }

  return { supabase, id: session.user.id };
}

// ---------- GET ----------

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return auth.error;

    const { data: question, error: fetchError } = await auth.supabase
      .from("gate_game_questions")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !question) {
      return NextResponse.json({ error: "Question not found." }, { status: 404 });
    }

    return NextResponse.json({ question });
  } catch (e) {
    console.error("Admin question GET error:", e);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}

// ---------- PUT ----------

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return auth.error;

    const body = await request.json();
    const { question_text, option_a, option_b, option_c, option_d, correct_option, branch, topic } = body;

    if (!question_text?.trim()) {
      return NextResponse.json({ error: "Question text is required." }, { status: 400 });
    }
    if (!option_a?.trim() || !option_b?.trim() || !option_c?.trim() || !option_d?.trim()) {
      return NextResponse.json({ error: "All four options are required." }, { status: 400 });
    }
    if (!["A", "B", "C", "D"].includes(correct_option)) {
      return NextResponse.json({ error: "Correct option must be A, B, C, or D." }, { status: 400 });
    }
    if (!branch?.trim()) {
      return NextResponse.json({ error: "Branch is required." }, { status: 400 });
    }

    const { data: question, error: updateError } = await auth.supabase
      .from("gate_game_questions")
      .update({
        question_text: question_text.trim(),
        option_a: option_a.trim(),
        option_b: option_b.trim(),
        option_c: option_c.trim(),
        option_d: option_d.trim(),
        correct_option,
        branch: branch.trim(),
        topic: topic?.trim() || null,
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating question:", updateError);
      return NextResponse.json({ error: "Failed to update question." }, { status: 500 });
    }

    return NextResponse.json({ question });
  } catch (e) {
    console.error("Admin question PUT error:", e);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}

// ---------- DELETE ----------

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return auth.error;

    const { error: deleteError } = await auth.supabase
      .from("gate_game_questions")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Error deleting question:", deleteError);
      return NextResponse.json({ error: "Failed to delete question." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Admin question DELETE error:", e);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
