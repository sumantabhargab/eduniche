/**
 * GET /api/admin/users
 * Lists all users with their plan and subscription info.
 * Admin-only.
 */

import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getAdminSessionFromRoute } from "@/modules/content-cms/lib/auth";

export async function GET(request: Request) {
  const admin = await getAdminSessionFromRoute(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  if (!supabase) {
    return NextResponse.json({ error: "Server not configured" }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.trim() || "";
  const planFilter = searchParams.get("plan") || "";
  const limit = Math.min(Number(searchParams.get("limit") || 100), 500);

  // Profiles (with plan)
  let query = supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, role, plan, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (planFilter && planFilter !== "all") {
    query = query.eq("plan", planFilter);
  }

  const { data: profiles, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Active subscriptions
  const userIds = (profiles || []).map((p) => p.id);
  const { data: subs } = await supabase
    .from("user_subscriptions")
    .select("user_id, plan, status, expires_at, started_at")
    .in("user_id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"])
    .eq("status", "active")
    .gte("expires_at", new Date().toISOString());

  const subMap = new Map<string, any>();
  (subs || []).forEach((s) => subMap.set(s.user_id, s));

  // Email lookup via auth admin (only available with service role)
  let enriched: any[] = (profiles || []).map((p) => ({
    ...p,
    subscription: subMap.get(p.id) || null,
    hasActiveSubscription: !!subMap.get(p.id),
  }));

  if (search) {
    const q = search.toLowerCase();
    enriched = enriched.filter(
      (u) =>
        (u.username || "").toLowerCase().includes(q) ||
        (u.display_name || "").toLowerCase().includes(q)
    );
  }

  return NextResponse.json({ users: enriched });
}
