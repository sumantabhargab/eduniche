/**
 * PUT /api/admin/users/[id]/plan
 * Update a user's plan. Admin-only.
 */

import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getAdminSessionFromRoute } from "@/modules/content-cms/lib/auth";

const ALLOWED_PLANS = ["free", "monthly_premium", "weekly_premium"] as const;

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminSessionFromRoute(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  if (!supabase) {
    return NextResponse.json({ error: "Server not configured" }, { status: 500 });
  }

  const { id } = await params;
  let body: any = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const plan = body?.plan;
  if (!ALLOWED_PLANS.includes(plan)) {
    return NextResponse.json(
      { error: `plan must be one of: ${ALLOWED_PLANS.join(", ")}` },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({ plan })
    .eq("id", id)
    .select("id, plan")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, user: data });
}
