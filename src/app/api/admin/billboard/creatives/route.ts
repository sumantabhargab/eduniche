import { NextResponse } from "next/server";
import { getAdminSessionFromRoute } from "@/modules/content-cms/lib/auth";

const SLOT_DEFINITIONS: Record<string, { page: string; placement: string; label: string }> = {
  landing_main: { page: "landing", placement: "below-hero", label: "Landing Page — Main Billboard" },
  dashboard_featured: { page: "dashboard", placement: "below-summary", label: "Dashboard — Featured Partner" },
  learning_secondary: { page: "learning", placement: "below-content", label: "Learning — Secondary Billboard" },
  resources_featured: { page: "resources", placement: "below-resources", label: "Resources — Featured Partner" },
};

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
]);

const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"]);
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function isValidHttpsUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function validateFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return { valid: false, error: `Unsupported file type: ${file.type}. Allowed: JPG, JPEG, PNG, WEBP, GIF, SVG.` };
  }
  const ext = "." + file.name.split(".").pop()?.toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return { valid: false, error: `Unsupported file extension. Allowed: .jpg, .jpeg, .png, .webp, .gif, .svg.` };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB.` };
  }
  if (file.size === 0) {
    return { valid: false, error: "File is empty." };
  }
  return { valid: true };
}

// ============================================================
// GET /api/admin/billboard/creatives — list all
// ============================================================
export async function GET(request: Request) {
  const admin = await getAdminSessionFromRoute(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { createServiceClient } = await import("@/lib/supabase/server");
    const supabase = createServiceClient();
    if (!supabase) {
      return NextResponse.json({ error: "Server not configured." }, { status: 500 });
    }

    const { data, error } = await supabase
      .from("billboard_creatives")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[billboard] list error:", error);
      return NextResponse.json({ error: "Failed to load creatives." }, { status: 500 });
    }

    // Enrich with slot friendly names
    const enriched = (data ?? []).map((c: Record<string, unknown>) => {
      const slotDef = SLOT_DEFINITIONS[c.slot_id as string];
      return {
        ...c,
        slot_label: slotDef?.label ?? c.slot_id,
      };
    });

    return NextResponse.json({ creatives: enriched });
  } catch {
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

// ============================================================
// POST /api/admin/billboard/creatives — create
// ============================================================
export async function POST(request: Request) {
  const admin = await getAdminSessionFromRoute(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      slot_id,
      brand_name,
      destination_url,
      is_active = true,
      priority = 0,
      start_at,
      end_at,
      file_name,
      file_size,
      content_type,
    } = body;

    // Validate required fields
    if (!slot_id || typeof slot_id !== "string") {
      return NextResponse.json({ error: "Slot selection is required." }, { status: 400 });
    }
    if (!SLOT_DEFINITIONS[slot_id]) {
      return NextResponse.json({ error: "Invalid slot selection." }, { status: 400 });
    }
    if (!brand_name || typeof brand_name !== "string" || brand_name.trim().length === 0) {
      return NextResponse.json({ error: "Brand name is required." }, { status: 400 });
    }
    if (brand_name.trim().length > 120) {
      return NextResponse.json({ error: "Brand name must be 120 characters or fewer." }, { status: 400 });
    }
    if (!destination_url || typeof destination_url !== "string") {
      return NextResponse.json({ error: "Destination URL is required." }, { status: 400 });
    }
    if (!isValidHttpsUrl(destination_url)) {
      return NextResponse.json({ error: "Destination URL must be a valid HTTPS URL." }, { status: 400 });
    }
    if (!file_name || typeof file_name !== "string") {
      return NextResponse.json({ error: "File upload is required." }, { status: 400 });
    }

    // Validate file info
    const syntheticFile = new File([""], file_name, { type: content_type || "application/octet-stream" });
    Object.defineProperty(syntheticFile, "size", { value: file_size ?? 0, writable: false });
    const fileCheck = validateFile(syntheticFile);
    if (!fileCheck.valid) {
      return NextResponse.json({ error: fileCheck.error }, { status: 400 });
    }

    // Build storage path
    const ext = "." + file_name.split(".").pop()?.toLowerCase();
    const storagePath = `${slot_id}/${crypto.randomUUID()}${ext}`;

    const { createServiceClient } = await import("@/lib/supabase/server");
    const supabase = createServiceClient();
    if (!supabase) {
      return NextResponse.json({ error: "Server not configured." }, { status: 500 });
    }

    // Create signed upload URL
    const { data: signData, error: signError } = await supabase.storage
      .from("billboard-ads")
      .createSignedUploadUrl(storagePath, { upsert: false });

    if (signError || !signData) {
      console.error("[billboard] sign error:", signError);
      return NextResponse.json({ error: "Could not create upload URL." }, { status: 500 });
    }

    // Create the creative record
    const { data: creative, error: dbError } = await supabase
      .from("billboard_creatives")
      .insert({
        slot_id,
        brand_name: brand_name.trim(),
        destination_url,
        is_active: Boolean(is_active),
        priority: Number(priority) || 0,
        start_at: start_at || null,
        end_at: end_at || null,
        creative_url: storagePath,
        creative_type: content_type || "image/jpeg",
      })
      .select()
      .single();

    if (dbError || !creative) {
      // Roll back: try to delete the signed URL path if it was already uploaded
      await supabase.storage.from("billboard-ads").remove([storagePath]);
      console.error("[billboard] insert error:", dbError);
      return NextResponse.json({ error: "Failed to create ad record." }, { status: 500 });
    }

    return NextResponse.json({
      creative,
      upload: { signedUrl: signData.signedUrl, path: signData.path, token: signData.token, expiresIn: 900 },
    }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
