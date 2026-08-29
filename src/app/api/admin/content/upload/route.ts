import { NextResponse } from "next/server";
import { getAdminSessionFromRoute } from "@/modules/content-cms/lib/auth";
import { handleFileUpload } from "@/modules/content-cms/services/resource-service";

export async function POST(request: Request) {
  const admin = await getAdminSessionFromRoute(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const folderId = formData.get("folder_id") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided." },
        { status: 400 }
      );
    }

    if (!folderId) {
      return NextResponse.json(
        { error: "folder_id is required." },
        { status: 400 }
      );
    }

    const result = await handleFileUpload(file, folderId, admin.user.id);

    if (result.error || !result.resource) {
      return NextResponse.json(
        { error: result.error || "Upload failed." },
        { status: 400 }
      );
    }

    return NextResponse.json(result.resource, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong during upload." },
      { status: 500 }
    );
  }
}
