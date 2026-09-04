import { NextResponse } from "next/server";
import { getAdminSessionFromRoute } from "@/modules/content-cms/lib/auth";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
]);
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function POST(request: Request) {
  const admin = await getAdminSessionFromRoute(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { filename, file_size, content_type, creative_id } = body;

    if (!filename || typeof filename !== "string") {
      return NextResponse.json({ error: "Filename is required." }, { status: 400 });
    }
    if (typeof file_size !== "number" || file_size <= 0 || file_size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: `File size must be between 1 byte and ${MAX_FILE_SIZE / 1024 / 1024}MB.` }, { status: 400 });
    }

    const ext = filename.includes(".")
      ? filename.slice(filename.lastIndexOf(".")).toLowerCase()
      : "";
    const allowedExts = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"];
    if (!allowedExts.includes(ext)) {
      return NextResponse.json({ error: "Unsupported file type." }, { status: 400 });
    }

    // Build path
    let storagePath: string;
    if (creative_id && typeof creative_id === "string") {
      // For replacement, use creative_id as folder
      storagePath = `${creative_id}/${crypto.randomUUID()}${ext}`;
    } else {
      // Fallback — random path
      storagePath = `temp/${crypto.randomUUID()}${ext}`;
    }

    const { createServiceClient } = await import("@/lib/supabase/server");
    const supabase = createServiceClient();
    if (!supabase) {
      return NextResponse.json({ error: "Server not configured." }, { status: 500 });
    }

    const { data, error } = await supabase.storage
      .from("billboard-ads")
      .createSignedUploadUrl(storagePath, { upsert: false });

    if (error || !data) {
      console.error("[billboard] upload-url sign error:", error);
      return NextResponse.json({ error: "Could not create upload URL." }, { status: 500 });
    }

    return NextResponse.json({
      signedUrl: data.signedUrl,
      path: data.path,
      token: data.token,
      expiresIn: 900,
    }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
