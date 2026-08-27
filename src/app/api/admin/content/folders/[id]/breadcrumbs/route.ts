import { NextResponse } from "next/server";
import { getAdminSession } from "@/modules/content-cms/lib/auth";
import { getFolder } from "@/modules/content-cms/services/folder-service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: folderId } = await params;

  const breadcrumbs: {
    id: string;
    name: string;
    parent_id: string | null;
  }[] = [];
  let currentId = folderId;

  while (currentId) {
    const result = await getFolder(currentId);
    if (result.error || !result.folder) break;

    breadcrumbs.unshift({
      id: result.folder.id,
      name: result.folder.name,
      parent_id: result.folder.parent_id,
    });

    currentId = result.folder.parent_id ?? "";
  }

  return NextResponse.json({ breadcrumbs });
}
