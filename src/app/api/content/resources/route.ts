/**
 * GET /api/content/resources — list published content resources for the library.
 *
 * Query params:
 *  visibility: "published" (default), "draft", "all", or specific value
 *  limit: max results (default 50)
 */

import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const visibility = url.searchParams.get("visibility") || "published";
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "50", 10) || 50, 100);

    const serviceClient = createServiceClient();
    if (!serviceClient) {
      return NextResponse.json({ error: "Server not configured." }, { status: 500 });
    }

    let query = serviceClient
      .from("content_resources")
      .select("id, name, original_filename, mime_type, description, visibility, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (visibility !== "all") {
      query = query.eq("visibility", visibility);
    }

    const { data: resources, error } = await query;

    if (error) {
      console.error("[api/content/resources] fetch error:", error);
      return NextResponse.json({ error: "Failed to load resources." }, { status: 500 });
    }

    return NextResponse.json({
      resources: resources ?? [],
    });
  } catch (e) {
    console.error("[api/content/resources] error:", e);
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
