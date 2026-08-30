/**
 * ONE-TIME migration endpoint to add `plan` column to profiles.
 * Admin-only endpoint. Call once then remove.
 */

import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getAdminSessionFromRoute } from "@/modules/content-cms/lib/auth";

export async function POST(request: Request) {
  const admin = await getAdminSessionFromRoute(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  if (!supabase) {
    return NextResponse.json({ error: "Server not configured" }, { status: 500 });
  }

  try {
    // 1. Add plan column to profiles (idempotent)
    const { error: alterErr } = await supabase.rpc("exec_sql" as any, {
      query: `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'monthly_premium', 'weekly_premium'))`,
    } as any);

    // RPC might not exist; fall back to direct query if needed
    let alterSuccess = !alterErr;
    if (alterErr) {
      console.log("exec_sql RPC missing, trying direct query approach");
      // Try via direct write (won't work for DDL, but try anyway)
      const r = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql`,
        {
          method: "POST",
          headers: {
            apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
            Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'monthly_premium', 'weekly_premium'))`,
          }),
        }
      );
      alterSuccess = r.ok;
    }

    return NextResponse.json({
      success: true,
      alterSuccess,
      message:
        "Plan column migration attempted. Check via SQL editor if DDL failed (RPC DDL has restrictions in PostgREST).",
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
