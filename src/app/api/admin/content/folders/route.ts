import { NextResponse } from "next/server";
import { getAdminSessionFromRoute } from "@/modules/content-cms/lib/auth";
import {
  listChildFolders,
  getFolder,
  createFolder,
} from "@/modules/content-cms/services/folder-service";
import type { ContentFolder } from "@/modules/content-cms/types";
import {
  listResources,
  handleFileUpload,
} from "@/modules/content-cms/services/resource-service";

export async function GET(request: Request) {
  const admin = await getAdminSessionFromRoute(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const all = searchParams.get("all") === "true";
  const recursive = searchParams.get("recursive") === "true";

  if (all) {
    if (recursive) {
      const supabase = await import("@/lib/supabase/server").then(m => m.createServiceClient());
      if (!supabase) {
        return NextResponse.json({ folders: [], error: "Server not configured." }, { status: 500 });
      }
      const { data, error } = await supabase
        .from("content_folders")
        .select("*")
        .order("depth", { ascending: true })
        .order("name", { ascending: true });
      if (error) {
        return NextResponse.json({ folders: [], error: error.message }, { status: 500 });
      }
      return NextResponse.json({ folders: data ?? [] });
    }
    const { folders } = await listChildFolders(null);
    return NextResponse.json({ folders });
  }

  const parentId = searchParams.get("parent_id");
  const folderId = searchParams.get("folder_id");

  let foldersResult: { folders: ContentFolder[] };
  if (folderId) {
    foldersResult = await listChildFolders(folderId);
  } else if (parentId) {
    foldersResult = await listChildFolders(parentId === "null" ? null : parentId);
  } else {
    foldersResult = await listChildFolders(null);
  }

  if (folderId) {
    const { resources } = await listResources(folderId);
    return NextResponse.json({
      folders: foldersResult.folders,
      resources,
    });
  }

  return NextResponse.json({ folders: foldersResult.folders });
}

export async function POST(request: Request) {
  const admin = await getAdminSessionFromRoute(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, parent_id } = body;

  if (!name || typeof name !== "string") {
    return NextResponse.json(
      { error: "Name is required." },
      { status: 400 }
    );
  }

  const result = await createFolder(
    { name, parent_id: parent_id ?? null },
    admin.user.id
  );

  if (result.error || !result.folder) {
    return NextResponse.json(
      { error: result.error },
      { status: 400 }
    );
  }

  return NextResponse.json(result.folder, { status: 201 });
}
