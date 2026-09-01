/**
 * GET /api/admin/game/questions
 *
 * Lists all game questions with optional filtering.
 * Requires admin authentication.
 */

import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

export async function GET(request: Request) {
  try {
    const supabase = await createServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Server not configured." }, { status: 500 });
    }

    // Auth check
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    // Admin check
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .maybeSingle();

    const role = (profile as any)?.role;
    if (profileError || role !== "admin") {
      return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const branch = searchParams.get("branch") || "";
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const offset = (page - 1) * PAGE_SIZE;

    let query = supabase
      .from("gate_game_questions")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    if (branch) {
      query = query.eq("branch", branch);
    }

    if (search) {
      query = query.or(`question_text.ilike.%${search}%,option_a.ilike.%${search}%,option_b.ilike.%${search}%,option_c.ilike.%${search}%,option_d.ilike.%${search}%`);
    }

    const { data: questions, error: fetchError, count } = await query;

    if (fetchError) {
      console.error("Error fetching questions:", fetchError);
      return NextResponse.json({ error: "Failed to load questions." }, { status: 500 });
    }

    const totalPages = count ? Math.ceil(count / PAGE_SIZE) : 0;

    return NextResponse.json({
      questions: questions || [],
      total: count || 0,
      page,
      totalPages,
    });
  } catch (e) {
    console.error("Admin questions GET error:", e);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}

/**
 * POST /api/admin/game/questions
 *
 * Creates a new game question.
 * Requires admin authentication.
 */

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Server not configured." }, { status: 500 });
    }

    // Auth check
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    // Admin check
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .maybeSingle();

    const role = (profile as any)?.role;
    if (profileError || role !== "admin") {
      return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    }

    const body = await request.json();
    const { question_text, option_a, option_b, option_c, option_d, correct_option, branch, topic } = body;

    // Validation
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

    const { data: question, error: insertError } = await supabase
      .from("gate_game_questions")
      .insert({
        question_text: question_text.trim(),
        option_a: option_a.trim(),
        option_b: option_b.trim(),
        option_c: option_c.trim(),
        option_d: option_d.trim(),
        correct_option,
        branch: branch.trim(),
        topic: topic?.trim() || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error creating question:", insertError);
      return NextResponse.json({ error: "Failed to create question." }, { status: 500 });
    }

    return NextResponse.json({ question }, { status: 201 });
  } catch (e) {
    console.error("Admin questions POST error:", e);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
