/**
 * POST /api/gate/plans/[planId]/complete
 * Mark a plan item as completed.
 */

import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function POST(
  request: Request,
  { params }: { params: { planId: string } }
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

    const planId = params.planId;

    // Verify plan ownership
    const { data: plan } = await supabase
      .from("user_study_plans")
      .select("id")
      .eq("id", planId)
      .eq("user_id", session.user.id)
      .eq("status", "active")
      .maybeSingle();

    if (!plan) {
      return NextResponse.json({ error: "Plan not found." }, { status: 404 });
    }

    // Parse request body — can mark all items for a day or specific item
    const body = await request.json().catch(() => ({}));
    const dayNumber = typeof body.dayNumber === "number" ? body.dayNumber : null;
    const itemId = typeof body.itemId === "string" ? body.itemId : null;

    if (itemId) {
      // Mark specific item as completed
      await supabase
        .from("user_study_plan_items")
        .update({ completed: true, completed_at: new Date().toISOString() })
        .eq("id", itemId)
        .eq("plan_id", planId);
    } else if (dayNumber) {
      // Mark all items for a day as completed
      await supabase
        .from("user_study_plan_items")
        .update({ completed: true, completed_at: new Date().toISOString() })
        .eq("plan_id", planId)
        .eq("day_number", dayNumber)
        .eq("completed", false);
    } else {
      return NextResponse.json({ error: "dayNumber or itemId is required." }, { status: 400 });
    }

    // Check if all items completed
    const { data: remaining } = await supabase
      .from("user_study_plan_items")
      .select("completed")
      .eq("plan_id", planId)
      .eq("completed", false);

    const allDone = !remaining || remaining.length === 0;
    if (allDone) {
      await supabase
        .from("user_study_plans")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", planId);
    }

    return NextResponse.json({ success: true, planCompleted: allDone });
  } catch (e) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}