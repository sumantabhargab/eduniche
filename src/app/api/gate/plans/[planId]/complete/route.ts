/**
 * POST /api/gate/plans/:planId/complete
 * Marks plan item(s) as completed.
 */

import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ planId: string }> }
) {
  try {
    const supabase = await createServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Server not configured." }, { status: 500 });
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const resolvedParams = await context.params;
    const planId = resolvedParams.planId;
    const body = await request.json().catch(() => ({}));
    const dayNumber = typeof body.dayNumber === "number" ? body.dayNumber : null;
    const itemId = typeof body.itemId === "string" ? body.itemId : null;

    if (!planId) {
      return NextResponse.json({ error: "planId is required." }, { status: 400 });
    }

    if (!dayNumber && !itemId) {
      return NextResponse.json({ error: "dayNumber or itemId is required." }, { status: 400 });
    }

    // Verify plan ownership
    const { data: plan } = await supabase
      .from("user_study_plans")
      .select("user_id, status")
      .eq("id", planId)
      .single();

    if (!plan || plan.user_id !== session.user.id) {
      return NextResponse.json({ error: "Plan not found." }, { status: 404 });
    }

    // Mark items complete
    if (itemId) {
      await supabase
        .from("user_study_plan_items")
        .update({ completed: true, completed_at: new Date().toISOString() })
        .eq("id", itemId)
        .eq("plan_id", planId);
    } else if (dayNumber) {
      await supabase
        .from("user_study_plan_items")
        .update({ completed: true, completed_at: new Date().toISOString() })
        .eq("plan_id", planId)
        .eq("day_number", dayNumber)
        .eq("completed", false);
    }

    // Check if all items are complete
    const { count: totalItems } = await supabase
      .from("user_study_plan_items")
      .select("*", { count: "exact", head: true })
      .eq("plan_id", planId);

    const { count: completedItems } = await supabase
      .from("user_study_plan_items")
      .select("*", { count: "exact", head: true })
      .eq("plan_id", planId)
      .eq("completed", true);

    const planCompleted =
      totalItems && completedItems && totalItems > 0 && totalItems === completedItems;

    if (planCompleted) {
      await supabase
        .from("user_study_plans")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", planId);
    }

    return NextResponse.json({
      success: true,
      planCompleted,
      totalItems: totalItems || 0,
      completedItems: completedItems || 0,
    });
  } catch (e) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}