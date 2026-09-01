/**
 * GET /api/library/resources
 *
 * Returns all published content_resources with folder metadata.
 * Query params:
 *   search (optional) — filter by name, subject, or resource_type
 *   branch (optional) — filter by branch
 *   subject (optional) — filter by subject
 *   resource_type (optional) — filter by resource_type
 *   limit (optional) — max results, default 100
 */

import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const supabase = await createServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Server not configured." }, { status: 500 });
    }

    // Auth is optional — guests see published resources, logged-in users see the same
    const { data: { session } } = await supabase.auth.getSession();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";
    const branch = searchParams.get("branch")?.trim() || "";
    const subject = searchParams.get("subject")?.trim() || "";
    const resourceType = searchParams.get("resource_type")?.trim() || "";
    const limit = Math.min(parseInt(searchParams.get("limit") || "100", 10), 200);

    // Build query for published resources
    let query = supabase
      .from("content_resources")
      .select(`
        id,
        name,
        original_filename,
        mime_type,
        description,
        branch,
        subject,
        resource_type,
        visibility,
        file_size,
        created_at,
        folder_id,
        content_folders!inner(
          id,
          name,
          parent_id,
          resource_type
        )
      `)
      .eq("visibility", "published")
      .order("created_at", { ascending: false })
      .limit(limit);

    // Apply filters
    if (search) {
      query = query.or(
        `name.ilike.%${search}%,subject.ilike.%${search}%,resource_type.ilike.%${search}%`
      );
    }

    if (branch) {
      query = query.eq("branch", branch);
    }

    if (subject) {
      query = query.eq("subject", subject);
    }

    if (resourceType) {
      query = query.eq("resource_type", resourceType);
    }

    const { data: resources, error } = await query;

    if (error) {
      console.error("[Resources API] query error:", error);
      return NextResponse.json({ error: "Failed to fetch resources." }, { status: 500 });
    }

    // Also fetch all folders for the section tree
    const { data: folders } = await supabase
      .from("content_folders")
      .select("id, name, parent_id, resource_type")
      .order("name");

    return NextResponse.json({
      resources: resources ?? [],
      folders: folders ?? [],
    });
  } catch (e) {
    console.error("[Resources API] error:", e);
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
