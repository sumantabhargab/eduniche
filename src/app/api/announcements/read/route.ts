import { NextResponse } from "next/server";
import { createRouteSupabaseClient } from "@/modules/content-cms/lib/auth";

/**
 * POST /api/announcements/read
 * Body: { action: "mark-one" | "mark-all", announcementId?: string }
 */
export async function POST(request: Request) {
  const response = NextResponse.next();
  const supabase = createRouteSupabaseClient(request, response);
  if (!supabase) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const action = (body as { action?: string }).action;

  if (action === "mark-all") {
    const { markAllAnnouncementsRead } = await import("@/modules/announcements/services/announcements");
    const { error } = await markAllAnnouncementsRead();
    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  const announcementId = (body as { announcementId?: string }).announcementId;
  if (!announcementId) {
    return NextResponse.json({ error: "announcementId required" }, { status: 400 });
  }

  const { markAnnouncementRead } = await import("@/modules/announcements/services/announcements");
  const { error } = await markAnnouncementRead(announcementId);
  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
