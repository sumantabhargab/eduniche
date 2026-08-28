import { NextResponse } from "next/server";
import { requireAdmin } from "@/modules/content-cms/lib/auth";
import { getAnnouncementById, updateAnnouncement, deleteAnnouncement } from "@/modules/announcements/services/announcements";
import type { AnnouncementUpdateInput } from "@/modules/announcements/types";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { data, error } = await getAnnouncementById(id);
  if (error || !data) {
    return NextResponse.json({ error: error || "Not found" }, { status: 404 });
  }
  return NextResponse.json({ data });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  try {
    const body = (await request.json()) as AnnouncementUpdateInput;
    const { data, error } = await updateAnnouncement(id, body);

    if (error || !data) {
      return NextResponse.json({ error: error || "Not found" }, { status: 404 });
    }
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { error } = await deleteAnnouncement(id);
  if (error) {
    return NextResponse.json({ error }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
