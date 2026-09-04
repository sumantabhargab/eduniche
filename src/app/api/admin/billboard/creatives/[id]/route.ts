import { NextResponse } from "next/server";
import { getAdminSessionFromRoute } from "@/modules/content-cms/lib/auth";

const SLOT_DEFINITIONS: Record<string, { page: string; placement: string; label: string }> = {
  landing_main: { page: "landing", placement: "below-hero", label: "Landing Page — Main Billboard" },
  dashboard_featured: { page: "dashboard", placement: "below-summary", label: "Dashboard — Featured Partner" },
  learning_secondary: { page: "learning", placement: "below-content", label: "Learning — Secondary Billboard" },
  resources_featured: { page: "resources", placement: "below-resources", label: "Resources — Featured Partner" },
};

function isValidHttpsUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminSessionFromRoute(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();

    const { createServiceClient } = await import("@/lib/supabase/server");
    const supabase = createServiceClient();
    if (!supabase) {
      return NextResponse.json({ error: "Server not configured." }, { status: 500 });
    }

    // Fetch existing record to compare creative_url for cleanup
    const { data: existing } = await supabase
      .from("billboard_creatives")
      .select("creative_url")
      .eq("id", id)
      .maybeSingle();

    if (!existing) {
      return NextResponse.json({ error: "Creative not found." }, { status: 404 });
    }

    const oldCreativeUrl = existing.creative_url;

    // Build update object from allowed fields
    const updates: Record<string, unknown> = {};

    if (body.brand_name !== undefined) {
      const name = String(body.brand_name).trim();
      if (name.length === 0 || name.length > 120) {
        return NextResponse.json({ error: "Brand name must be 1–120 characters." }, { status: 400 });
      }
      updates.brand_name = name;
    }
    if (body.destination_url !== undefined) {
      if (!isValidHttpsUrl(String(body.destination_url))) {
        return NextResponse.json({ error: "Destination URL must be a valid HTTPS URL." }, { status: 400 });
      }
      updates.destination_url = String(body.destination_url);
    }
    if (body.slot_id !== undefined) {
      if (!SLOT_DEFINITIONS[body.slot_id]) {
        return NextResponse.json({ error: "Invalid slot selection." }, { status: 400 });
      }
      updates.slot_id = body.slot_id;
    }
    if (body.is_active !== undefined) updates.is_active = Boolean(body.is_active);
    if (body.priority !== undefined) updates.priority = Number(body.priority) || 0;
    if (body.start_at !== undefined) updates.start_at = body.start_at || null;
    if (body.end_at !== undefined) updates.end_at = body.end_at || null;
    if (body.creative_url !== undefined) {
      const newPath = String(body.creative_url).replace(/^billboard-ads\//, "");
      updates.creative_url = body.creative_url.startsWith("billboard-ads/")
        ? body.creative_url
        : `billboard-ads/${newPath}`;
      if (body.creative_type !== undefined) {
        updates.creative_type = String(body.creative_type);
      }
    }

    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("billboard_creatives")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("[billboard] update error:", error);
      return NextResponse.json({ error: "Failed to update creative." }, { status: 500 });
    }

    // If creative_url changed, delete the old storage file
    const newUrl = updates.creative_url as string | undefined;
    if (newUrl && newUrl !== oldCreativeUrl) {
      const oldPath = oldCreativeUrl.replace(/^billboard-ads\//, "");
      await supabase.storage.from("billboard-ads").remove([oldPath]);
    }

    return NextResponse.json({ creative: data });
  } catch {
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
