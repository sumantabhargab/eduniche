/**
 * GET /api/content/resources — list published content resources for the library.
 *
 * Query params:
 *   visibility: "published" (default), "draft", "all"
 *   folder_id: filter by folder (subject level)
 *   branch: filter by branch code
 *   subject: filter by subject
 *   limit: max results (default 50, max 100)
 */

import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const visibility = url.searchParams.get("visibility") || "published";
    const folderId = url.searchParams.get("folder_id");
    const branch = url.searchParams.get("branch");
    const subject = url.searchParams.get("subject");
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "50", 10) || 50, 100);

    const serviceClient = createServiceClient();
    if (!serviceClient) {
      return NextResponse.json({ error: "Server not configured." }, { status: 500 });
    }

    let query = serviceClient
      .from("content_resources")
      .select("id, name, original_filename, mime_type, file_size, storage_path, folder_id, branch, subject, resource_type, visibility, access_tier, tags, description, created_at, updated_at")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (visibility !== "all") {
      query = query.eq("visibility", visibility);
    }

    if (folderId) {
      query = query.eq("folder_id", folderId);
    }

    if (branch) {
      query = query.eq("branch", branch);
    }

    if (subject) {
      query = query.eq("subject", subject);
    }

    const { data: resources, error } = await query;

    if (error) {
      console.error("[api/content/resources] fetch error:", error);
      return NextResponse.json({ error: "Failed to load resources." }, { status: 500 });
    }

    return NextResponse.json({
      resources: resources ?? [],
    });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
