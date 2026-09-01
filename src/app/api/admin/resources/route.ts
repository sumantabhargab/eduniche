/**
 * POST /api/admin/resources
 *
 * Creates a new resource by uploading a file and creating the content_resources record.
 * Requires admin authentication.
 *
 * Body (multipart/form-data):
 *   file: File — the PDF or document to upload
 *   name: string — display name
 *   description?: string
 *   branch?: string
 *   subject?: string
 *   resource_type?: string
 *   folder_id?: string
 *   visibility?: "draft" | "published" (default: "draft")
 *   access_tier?: "free" | "premium" (default: "free")
 */

import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/markdown",
];

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Server not configured." }, { status: 500 });
    }

    // Auth check
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    // Admin check
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .maybeSingle();

    const role = (profile as any)?.role;
    if (profileError || role !== "admin") {
      return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const name = (formData.get("name") as string)?.trim();
    const description = (formData.get("description") as string)?.trim() || null;
    const branch = (formData.get("branch") as string)?.trim() || null;
    const subject = (formData.get("subject") as string)?.trim() || null;
    const resourceType = (formData.get("resource_type") as string)?.trim() || null;
    const folderId = (formData.get("folder_id") as string)?.trim() || null;
    const visibility = (formData.get("visibility") as string)?.trim() === "published"
      ? "published"
      : "draft";
    const accessTier = (formData.get("access_tier") as string)?.trim() === "premium"
      ? "premium"
      : "free";

    // Validate file
    if (!file) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024} MB.` },
        { status: 400 }
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload a PDF or document." },
        { status: 400 }
      );
    }

    // Validate name
    if (!name) {
      return NextResponse.json({ error: "Resource name is required." }, { status: 400 });
    }

    // Get a default folder if none provided
    let targetFolderId = folderId;
    if (!targetFolderId) {
      // Find or create "General" folder
      const { data: existingFolder } = await supabase
        .from("content_folders")
        .select("id")
        .eq("name", "General")
        .is("parent_id", null)
        .maybeSingle();

      if (existingFolder) {
        targetFolderId = existingFolder.id;
      } else {
        const { data: newFolder, error: folderError } = await supabase
          .from("content_folders")
          .insert({
            name: "General",
            resource_type: resourceType || "document",
            created_by: session.user.id,
          })
          .select("id")
          .single();

        if (folderError || !newFolder) {
          return NextResponse.json({ error: "Failed to create folder." }, { status: 500 });
        }
        targetFolderId = newFolder.id;
      }
    }

    // Upload file to Supabase Storage
    const fileId = crypto.randomUUID();
    const fileExtension = file.name.split(".").pop() || "pdf";
    const storagePath = `resources/${fileId}.${fileExtension}`;

    const { error: uploadError } = await supabase.storage
      .from("content-files")
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("[Admin Resources] upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload file." },
        { status: 500 }
      );
    }

    // Create content_resources record
    const { data: resource, error: resourceError } = await supabase
      .from("content_resources")
      .insert({
        name,
        original_filename: file.name,
        mime_type: file.type,
        file_size: file.size,
        storage_path: storagePath,
        folder_id: targetFolderId,
        branch,
        subject,
        resource_type: resourceType,
        visibility,
        description,
        uploaded_by: session.user.id,
      })
      .select("id, name, original_filename, mime_type, visibility, created_at")
      .single();

    if (resourceError || !resource) {
      console.error("[Admin Resources] insert error:", resourceError);
      // Clean up uploaded file
      await supabase.storage.from("content-files").remove([storagePath]);
      return NextResponse.json(
        { error: "Failed to create resource record." },
        { status: 500 }
      );
    }

    return NextResponse.json({ resource }, { status: 201 });
  } catch (e) {
    console.error("[Admin Resources] error:", e);
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
