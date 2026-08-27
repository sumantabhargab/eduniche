import { NextResponse } from "next/server";
import { getAdminSession } from "@/modules/content-cms/lib/auth";
import { listResources, createResource } from "@/modules/content-cms/services/resource-service";

export async function GET(request: Request) {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const folderId = searchParams.get("folder_id");
  const visibility = searchParams.get("visibility");

  if (!folderId) {
    return NextResponse.json(
      { error: "folder_id is required." },
      { status: 400 }
    );
  }

  const { resources } = await listResources(folderId, visibility || undefined);
  return NextResponse.json({ resources });
}

export async function POST(request: Request) {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { folder_id, name, mime_type, file_size, storage_path, original_filename } = body;

  if (!folder_id || !name || !mime_type || file_size === undefined || !storage_path) {
    return NextResponse.json(
      { error: "Missing required fields." },
      { status: 400 }
    );
  }

  const result = await createResource(
    {
      name,
      original_filename: original_filename || name,
      mime_type,
      file_size,
      storage_path,
      folder_id,
    },
    admin.user.id
  );

  if (result.error || !result.resource) {
    return NextResponse.json(
      { error: result.error },
      { status: 400 }
    );
  }

  return NextResponse.json(result.resource, { status: 201 });
}
