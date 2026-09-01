/**
 * GET /api/content/folders — list content folders for the library.
 *
 * Query params:
 *   parent_id: UUID of parent folder (null = root folders)
 *   all: "true" to return entire tree in one request
 *
 * Returns folder metadata (no secrets). Depth, premium flag, branch,
 * subject, resource_type, child_count, resource_count.
 */

import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const allParam = url.searchParams.get("all");
    const parentId = url.searchParams.get("parent_id");

    const supabase = createServiceClient();
    if (!supabase) {
      return NextResponse.json({ error: "Server not configured." }, { status: 500 });
    }

    // Full tree mode
    if (allParam === "true") {
      const { data, error } = await supabase
        .from("content_folders")
        .select("id, name, parent_id, depth, premium, branch, subject, resource_type, sort_order, created_at, updated_at")
        .order("depth", { ascending: true })
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true });

      if (error) {
        console.error("[api/content/folders] fetch error:", error);
        return NextResponse.json({ error: "Failed to load folders." }, { status: 500 });
      }

      return NextResponse.json({ folders: data ?? [] });
    }

    // Children of a specific parent
    const isRoot = parentId === null || parentId === "" || parentId === "null";

    const { data, error } = await supabase
      .from("content_folders")
      .select("*")
      .is("parent_id", isRoot ? null : parentId)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      console.error("[api/content/folders] fetch error:", error);
      return NextResponse.json({ error: "Failed to load folders." }, { status: 500 });
    }

    return NextResponse.json({ folders: data ?? [] });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
