/**
 * GET /api/library/document/[id] - Serves a protected document viewer page
 */

import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getSignedUrl } from "@/modules/content-cms/lib/storage";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Server not configured." }, { status: 500 });
    }

    const { id } = await params;

    // Fetch resource metadata
    const { data: resource, error } = await supabase
      .from("content_resources")
      .select("id, name, original_filename, mime_type, storage_path, access_tier, visibility, description, folder_id")
      .eq("id", id)
      .eq("visibility", "published")
      .maybeSingle();

    if (error || !resource) {
      return NextResponse.json({ error: "Document not found." }, { status: 404 });
    }

    // Fetch folder breadcrumbs
    let breadcrumbs: { id: string; name: string }[] = [];
    if (resource.folder_id) {
      const { data: bc } = await supabase.rpc("get_folder_breadcrumbs", {
        start_folder_id: resource.folder_id,
      });
      if (bc) {
        breadcrumbs = bc as { id: string; name: string }[];
      }
    }

    // Check premium access
    if (resource.access_tier === "premium") {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        return NextResponse.json({ error: "Premium access required. Please sign in." }, { status: 401 });
      }

      const { data: sub } = await supabase
        .from("user_subscriptions")
        .select("status, expires_at")
        .eq("user_id", session.user.id)
        .eq("status", "active")
        .gte("expires_at", new Date().toISOString())
        .maybeSingle();

      if (!sub) {
        return NextResponse.json({ error: "Premium access required. Please upgrade." }, { status: 403 });
      }
    }

    // Generate signed URL for the file
    const urlResult = await getSignedUrl(resource.storage_path);

    if (!urlResult.success || !urlResult.url) {
      return NextResponse.json({ error: "Failed to load document." }, { status: 500 });
    }

    return NextResponse.json({
      document: {
        id: resource.id,
        name: resource.name,
        original_filename: resource.original_filename,
        mime_type: resource.mime_type,
        description: resource.description,
        access_tier: resource.access_tier,
        folder_id: resource.folder_id,
        breadcrumbs,
        signed_url: urlResult.url,
      },
    });
  } catch (e) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
