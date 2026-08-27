import { NextResponse } from "next/server";
import { getAdminSession } from "@/modules/content-cms/lib/auth";
import { getFolder, updateFolder, deleteFolder } from "@/modules/content-cms/services/folder-service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: folderId } = await params;
  const result = await getFolder(folderId);

  if (result.error || !result.folder) {
    return NextResponse.json(
      { error: result.error || "Folder not found." },
      { status: 404 }
    );
  }

  return NextResponse.json(result.folder);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: folderId } = await params;
  const body = await request.json();
  const result = await updateFolder(folderId, body);

  if (result.error || !result.folder) {
    return NextResponse.json(
      { error: result.error },
      { status: 400 }
    );
  }

  return NextResponse.json(result.folder);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: folderId } = await params;
  const result = await deleteFolder(folderId);

  if (!result.deleted) {
    return NextResponse.json(
      { error: result.error },
      { status: 400 }
    );
  }

  return NextResponse.json({ deleted: true, cascadeCount: result.cascadeCount });
}
