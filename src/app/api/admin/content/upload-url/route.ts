import { NextResponse } from "next/server";
import { getAdminSessionFromRoute } from "@/modules/content-cms/lib/auth";
import {
  validateFileUpload,
  validateResourceName,
} from "@/modules/content-cms/lib/validators";
import { getFolder } from "@/modules/content-cms/services/folder-service";
import { STORAGE_BUCKET } from "@/modules/content-cms/config/constants";

/**
 * Phase 1: Client requests a signed upload URL.
 *
 * Flow:
 *   1. Client POSTs { filename, file_size, folder_id, content_type }
 *   2. Server validates file type and size
 *   3. Server creates a signed upload URL (valid for 15 min)
 *   4. Server returns { signedUrl, path, expiresIn }
 *   5. Client PUTs the binary file directly to the signed URL
 *      (bypasses Next.js body parser completely)
 *   6. Client calls /api/admin/content/upload-confirm with { path }
 *      to create the database metadata row
 */

export async function POST(request: Request) {
  const admin = await getAdminSessionFromRoute(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { filename, file_size, folder_id, content_type } = body;

    if (!filename || typeof filename !== "string") {
      return NextResponse.json(
        { error: "Filename is required." },
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

    // Validate the folder exists
    const folderResult = await getFolder(folder_id);
    if (folderResult.error || !folderResult.folder) {
      return NextResponse.json(
        { error: folderResult.error || "Folder not found." },
        { status: 404 }
      );
    }

    // Validate file type using a synthetic File-like object
    const syntheticFile = new File([""], filename, {
      type: content_type || "application/octet-stream",
    });
    Object.defineProperty(syntheticFile, "size", {
      value: file_size,
      writable: false,
    });

    const uploadCheck = validateFileUpload(syntheticFile);
    if (!uploadCheck.valid) {
      return NextResponse.json({ error: uploadCheck.error }, { status: 400 });
    }

    // Validate the filename as a resource name
    const baseName = filename.includes(".")
      ? filename.slice(0, filename.lastIndexOf("."))
      : filename;
    const nameCheck = validateResourceName(baseName);
    if (!nameCheck.valid) {
      return NextResponse.json({ error: nameCheck.error }, { status: 400 });
    }

    // Build storage path: <folderId>/<resourceId><ext>
    const ext = filename.includes(".")
      ? filename.slice(filename.lastIndexOf(".")).toLowerCase()
      : "";
    const resourceId = crypto.randomUUID();
    const storagePath = `${folder_id}/${resourceId}${ext}`;

    // Create a signed upload URL valid for 15 minutes
    const { createServiceClient } = await import("@/lib/supabase/server");
    const supabase = createServiceClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Server not configured." },
        { status: 500 }
      );
    }

    const { data, error: signError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUploadUrl(storagePath, {
        upsert: false,
      });

    if (signError || !data) {
      return NextResponse.json(
        { error: signError?.message || "Could not create upload URL." },
        { status: 500 }
      );
    }

    const { signedUrl, token } = data;

    return NextResponse.json(
      {
        signedUrl,
        path: storagePath,
        token,
        expiresIn: 900,
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { error: "Something went wrong while preparing the upload." },
      { status: 500 }
    );
  }
}
