import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const events = body.events || [body];

    if (!events.length) {
      return NextResponse.json({ ok: true });
    }

    const supabase = await createServerClient();
    if (!supabase) {
      return NextResponse.json({ ok: true });
    }

    const rows = events.map((e: Record<string, unknown>) => ({
      event_name: (e.event_name as string) || "unknown",
      anonymous_id: (e.anonymous_id as string) || "unknown",
      user_id: (e.user_id as string) || null,
      session_id: (e.session_id as string) || null,
      payload: Object.fromEntries(
        Object.entries(e).filter(
          ([k]) => !["event_name", "anonymous_id", "user_id", "session_id"].includes(k)
        )
      ),
      url: "",
      referrer: request.headers.get("referer") || "",
      user_agent: request.headers.get("user-agent") || "",
      created_at: (e.timestamp as string) || new Date().toISOString(),
    }));

    const { error } = await supabase
      .from("product_events")
      .insert(rows);

    if (error) {
      console.error("Event tracking error:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, recorded: rows.length });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
