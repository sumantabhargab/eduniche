import { NextResponse } from "next/server";
import { getAdminSession, requireAdmin } from "@/modules/content-cms/lib/auth";
import { listAllAnnouncements, createAnnouncement, deleteAnnouncement } from "@/modules/announcements/services/announcements";
import type { AnnouncementFilters, AnnouncementCreateInput } from "@/modules/announcements/types";

export async function GET(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const filters: AnnouncementFilters = {
    search: searchParams.get("search") || undefined,
    status: (searchParams.get("status") || undefined) as AnnouncementFilters["status"],
    type: (searchParams.get("type") || undefined) as AnnouncementFilters["type"],
    priority: (searchParams.get("priority") || undefined) as AnnouncementFilters["priority"],
  };

  const { data, error } = await listAllAnnouncements(filters);
  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }
  return NextResponse.json({ data: data || [] });
}

export async function POST(request: Request) {
  const admin = await requireAdmin();

  try {
    const body = (await request.json()) as AnnouncementCreateInput;
    const { data, error } = await createAnnouncement(body, admin.user.id);

    if (error || !data) {
      return NextResponse.json({ error: error || "Failed to create" }, { status: 400 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
