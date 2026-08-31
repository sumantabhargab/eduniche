/**
 * GET /api/gate/plans
 * List user's active study plans.
 *
 * POST /api/gate/plans
 * Create a new study plan (used internally by diagnostic submit).
 */

import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

// GET - List user's plans
export async function GET(request: Request) {
  try {
    const supabase = await createServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Server not configured." }, { status: 500 });
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const url = new URL(request.url);
    const status = url.searchParams.get("status") || "active";

    let query = supabase
      .from("user_study_plans")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    if (status !== "all") {
      query = query.eq("status", status);
    }

    const { data: plans, error } = await query;

    if (error) {
      console.error("Plans fetch error:", error);
      return NextResponse.json({ error: "Failed to load plans." }, { status: 500 });
    }

    // For each plan, fetch items and completion stats
    const plansWithStats = await Promise.all(
      (plans ?? []).map(async (plan) => {
        const { data: items } = await supabase
          .from("user_study_plan_items")
          .select("*")
          .eq("plan_id", plan.id)
          .order("day_number", { ascending: true });

        const totalItems = items?.length ?? 0;
        const completedItems = (items ?? []).filter((i) => i.completed).length;

        // Group by day
        const days: Record<number, any[]> = {};
        (items ?? []).forEach((item: any) => {
          if (!days[item.day_number]) days[item.day_number] = [];
          days[item.day_number].push(item);
        });

        return {
          ...plan,
          items: items ?? [],
          totalItems,
          completedItems,
          progress: totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0,
          days,
        };
      })
    );

    return NextResponse.json({ plans: plansWithStats });
  } catch (e) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}

// POST - Create a new study plan
export async function POST(request: Request) {
  try {
    const supabase = await createServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Server not configured." }, { status: 500 });
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const paperId = typeof body.paperId === "string" ? body.paperId : "";
    const title = typeof body.title === "string" ? body.title : "Study Plan";
    const items = Array.isArray(body.items) ? body.items : [];

    if (!paperId) {
      return NextResponse.json({ error: "paperId is required." }, { status: 400 });
    }

    // Deactivate existing active plans for this paper
    await supabase
      .from("user_study_plans")
      .update({ status: "abandoned" })
      .eq("user_id", session.user.id)
      .eq("paper_id", paperId)
      .eq("status", "active");

    // Create plan
    const { data: plan, error: planError } = await supabase
      .from("user_study_plans")
      .insert({
        user_id: session.user.id,
        paper_id: paperId,
        title,
        status: "active",
      })
      .select("id")
      .single();

    if (planError || !plan) {
      console.error("Plan creation error:", planError);
      return NextResponse.json({ error: "Failed to create plan." }, { status: 500 });
    }

    // Insert items
    if (items.length > 0) {
      const planItems = items.map((item: Record<string, unknown>) => ({
        plan_id: plan.id,
        day_number: (item as { dayNumber: number }).dayNumber || 1,
        subject: (item as { subject: string }).subject || "",
        topic: (item as { topic: string }).topic || "",
        task_type: (item as { taskType: string }).taskType || "study",
        estimated_minutes: (item as { estimatedMinutes: number }).estimatedMinutes || 30,
      }));

      await supabase.from("user_study_plan_items").insert(planItems);
    }

    return NextResponse.json({ plan }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}