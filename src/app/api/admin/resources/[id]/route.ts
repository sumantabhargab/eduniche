/**
 * PUT /api/admin/resources/[id]
 *
 * Updates an existing resource's metadata and/or file.
 * Requires admin authentication.
 *
 * Body (multipart/form-data or JSON):
 *   name?: string
 *   description?: string
 *   branch?: string
 *   subject?: string
 *   resource_type?: string
 *   visibility?: "draft" | "published" | "archived"
 *   access_tier?: "free" | "premium"
 *   folder_id?: string
 *   file?: File — optional replacement file
 */

import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/markdown",
];

export const dynamic = "force-dynamic";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .maybeSingle();

    if ((profile as any)?.role !== "admin") {
      return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    }

    const { id } = await params;

    // Check if resource exists
    const { data: existing } = await supabase
      .from("content_resources")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (!existing) {
      return NextResponse.json({ error: "Resource not found." }, { status: 404 });
    }

    const contentType = request.headers.get("content-type") || "";
    let updates: Record<string, unknown> = {};
    let newFile: File | null = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const name = formData.get("name") as string | null;
      const description = formData.get("description") as string | null;
      const branch = formData.get("branch") as string | null;
      const subject = formData.get("subject") as string | null;
      const resourceType = formData.get("resource_type") as string | null;
      const visibility = formData.get("visibility") as string | null;
      const accessTier = formData.get("access_tier") as string | null;
      const folderId = formData.get("folder_id") as string | null;
      newFile = formData.get("file") as File | null;

      if (name) updates.name = name;
      if (description !== null) updates.description = description;
      if (branch !== null) updates.branch = branch;
      if (subject !== null) updates.subject = subject;
      if (resourceType !== null) updates.resource_type = resourceType;
      if (visibility && ["draft", "published", "archived"].includes(visibility)) {
        updates.visibility = visibility;
      }
      if (accessTier === "premium" || accessTier === "free") {
        updates.access_tier = accessTier;
      }
      if (folderId) updates.folder_id = folderId;
    } else {
      const body = await request.json();
      if (body.name) updates.name = body.name;
      if (body.description !== undefined) updates.description = body.description;
      if (body.branch !== undefined) updates.branch = body.branch;
      if (body.subject !== undefined) updates.subject = body.subject;
      if (body.resource_type !== undefined) updates.resource_type = body.resource_type;
      if (body.visibility && ["draft", "published", "archived"].includes(body.visibility)) {
        updates.visibility = body.visibility;
      }
      if (body.access_tier === "premium" || body.access_tier === "free") {
        updates.access_tier = body.access_tier;
      }
      if (body.folder_id) updates.folder_id = body.folder_id;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No updates provided." }, { status: 400 });
    }

    updates.updated_at = new Date().toISOString();

    // Handle file replacement
    if (newFile) {
      if (newFile.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File too large. Max ${MAX_FILE_SIZE / 1024 / 1024} MB.` },
          { status: 400 }
        );
      }

      if (!ALLOWED_MIME_TYPES.includes(newFile.type)) {
        return NextResponse.json(
          { error: "Unsupported file type." },
          { status: 400 }
        );
      }

      // Upload new file
      const fileExtension = newFile.name.split(".").pop() || "pdf";
      const newStoragePath = `resources/${id}.${fileExtension}`;

      const { error: uploadError } = await supabase.storage
        .from("content-files")
        .upload(newStoragePath, newFile, {
          contentType: newFile.type,
          upsert: true,
        });

      if (uploadError) {
        console.error("[Admin Resources] update upload error:", uploadError);
        return NextResponse.json(
          { error: "Failed to upload replacement file." },
          { status: 500 }
        );
      }

      // Delete old file
      if (existing.storage_path !== newStoragePath) {
        await supabase.storage.from("content-files").remove([existing.storage_path]);
      }

      updates.storage_path = newStoragePath;
      updates.original_filename = newFile.name;
      updates.mime_type = newFile.type;
      updates.file_size = newFile.size;
    }

    const { data: resource, error: updateError } = await supabase
      .from("content_resources")
      .update(updates)
      .eq("id", id)
      .select("id, name, original_filename, mime_type, visibility, access_tier, branch, subject, resource_type, description, updated_at")
      .single();

    if (updateError || !resource) {
      console.error("[Admin Resources] update error:", updateError);
      return NextResponse.json({ error: "Failed to update resource." }, { status: 500 });
    }

    return NextResponse.json({ resource });
  } catch (e) {
    console.error("[Admin Resources] error:", e);
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .maybeSingle();

    if ((profile as any)?.role !== "admin") {
      return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    }

    const { id } = await params;

    // Get resource to delete the file too
    const { data: existing } = await supabase
      .from("content_resources")
      .select("storage_path, name")
      .eq("id", id)
      .maybeSingle();

    if (!existing) {
      return NextResponse.json({ error: "Resource not found." }, { status: 404 });
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from("content_resources")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("[Admin Resources] delete error:", deleteError);
      return NextResponse.json({ error: "Failed to delete resource." }, { status: 500 });
    }

    // Delete file from storage
    await supabase.storage.from("content-files").remove([existing.storage_path]);

    return NextResponse.json({ success: true, message: `"${existing.name}" deleted.` });
  } catch (e) {
    console.error("[Admin Resources] error:", e);
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
