import { NextResponse } from "next/server";
import { getAdminSessionFromRoute } from "@/modules/content-cms/lib/auth";
import {
  validateUuid,
  validateResourceName,
  validateVisibility,
  validateAccessTier,
} from "@/modules/content-cms/lib/validators";
import { createResource } from "@/modules/content-cms/services/resource-service";
import { getFolder } from "@/modules/content-cms/services/folder-service";
import { STORAGE_BUCKET } from "@/modules/content-cms/config/constants";

/**
 * Phase 2: Confirm a successful direct upload.
 *
 * After the client PUTs the binary data to the signed URL returned by
 * /api/admin/content/upload-url, it calls this endpoint to create the
 * database metadata row linking the stored object to the folder.
 *
 * This endpoint does NOT receive the file binary — only the storage path.
 */
export async function POST(request: Request) {
  const admin = await getAdminSessionFromRoute(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      path,
      folder_id,
      original_filename,
      file_size,
      content_type,
      visibility,
      access_tier,
    } = body;

    if (!path || typeof path !== "string") {
      return NextResponse.json(
        { error: "Storage path is required." },
        { status: 400 }
      );
    }

    if (!folder_id || typeof folder_id !== "string") {
      return NextResponse.json(
        { error: "folder_id is required." },
        { status: 400 }
      );
    }

    if (typeof file_size !== "number" || file_size <= 0) {
      return NextResponse.json(
        { error: "Valid file_size is required." },
        { status: 400 }
      );
    }

    if (!original_filename || typeof original_filename !== "string") {
      return NextResponse.json(
        { error: "original_filename is required." },
        { status: 400 }
      );
    }

    const folderResult = await getFolder(folder_id);
    if (folderResult.error || !folderResult.folder) {
      return NextResponse.json(
        { error: folderResult.error || "Folder not found." },
        { status: 404 }
      );
    }

    const baseName = original_filename.includes(".")
      ? original_filename.slice(0, original_filename.lastIndexOf("."))
      : original_filename;
    const nameCheck = validateResourceName(baseName);
    if (!nameCheck.valid) {
      return NextResponse.json({ error: nameCheck.error }, { status: 400 });
    }

    // Default: Free tier, Draft visibility (safe defaults)
    const tierCheck = validateAccessTier(access_tier);
    if (!tierCheck.valid) {
      return NextResponse.json({ error: tierCheck.error }, { status: 400 });
    }
    const resolvedTier = tierCheck.value;

    const visCheck = validateVisibility(visibility);
    if (!visCheck.valid) {
      return NextResponse.json({ error: visCheck.error }, { status: 400 });
    }
    const resolvedVisibility = visCheck.value;

    const result = await createResource(
      {
        name: nameCheck.value,
        original_filename,
        mime_type: content_type || "application/octet-stream",
        file_size,
        storage_path: path,
        folder_id,
        branch: folderResult.folder.branch,
        subject: folderResult.folder.subject,
        resource_type: folderResult.folder.resource_type,
        visibility: resolvedVisibility,
        access_tier: resolvedTier,
      },
      admin.user.id
    );

    if (result.error || !result.resource) {
      // Best-effort cleanup: remove the orphaned file from storage
      try {
        const { createServiceClient } = await import(
          "@/lib/supabase/server"
        );
        const supabase = createServiceClient();
        if (supabase) {
          await supabase.storage.from(STORAGE_BUCKET).remove([path]);
        }
      } catch {
        // Cleanup failed — log but don't block the error response
      }
      return NextResponse.json(
        { error: result.error || "Failed to save file metadata." },
        { status: 500 }
      );
    }

    return NextResponse.json(result.resource, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong while confirming the upload." },
      { status: 500 }
    );
  }
}
