/**
 * PDF proxy — streams a document PDF from Supabase Storage through this
 * server-side route.
 *
 * Accepts a document `id` query parameter, re-verifies the resource exists
 * and is published (and re-checks premium access), generates a fresh signed
 * URL server-side, fetches the PDF bytes, and streams them to the client
 * with Content-Type: application/pdf.
 *
 * Security:
 *   1. Client sends only the document ID — no storage paths, no tokens.
 *   2. Server re-verifies resource exists and is published.
 *   3. Premium access is re-checked server-side.
 *   4. Signed URL is generated server-side with service-role key.
 *   5. PDF bytes are streamed same-origin — no CORS issues.
 */

import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getSignedUrl } from "@/modules/content-cms/lib/storage";

// Match the same TTL as the document API
const SIGNED_URL_TTL = 3600;

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

    // 1) Look up the resource
    const { data: resource, error: resourceError } = await supabase
      .from("content_resources")
      .select("id, name, storage_path, mime_type, access_tier, visibility, folder_id")
      .eq("id", id)
      .eq("visibility", "published")
      .maybeSingle();

    if (resourceError || !resource) {
      return NextResponse.json({ error: "Document not found." }, { status: 404 });
    }

    // 2) Re-check premium access (same logic as the document API)
    if (resource.access_tier === "premium") {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        return NextResponse.json({ error: "Premium access required. Please sign in." }, { status: 401 });
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("plan")
        .eq("id", session.user.id)
        .maybeSingle();

      const plan = (profile as any)?.plan;
      const hasPremiumPlan = plan === "monthly_premium" || plan === "weekly_premium";

      if (!hasPremiumPlan) {
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
    }

    // 3) Generate a fresh signed URL server-side
    const urlResult = await getSignedUrl(resource.storage_path, SIGNED_URL_TTL);
    if (!urlResult.success || !urlResult.url) {
      return NextResponse.json({ error: "Failed to generate access link." }, { status: 500 });
    }

    // 4) Fetch the PDF bytes from Supabase Storage
    const pdfRes = await fetch(urlResult.url, {
      credentials: "omit",
    });

    if (!pdfRes.ok || !pdfRes.body) {
      console.error(`[PDF proxy] upstream fetch failed — ${pdfRes.status} ${pdfRes.statusText}`);
      return NextResponse.json(
        { error: "Failed to retrieve PDF from storage." },
        { status: pdfRes.status || 502 }
      );
    }

    // 5) Stream to client with explicit PDF headers
    const responseHeaders = new Headers(pdfRes.headers);
    responseHeaders.set("Content-Type", "application/pdf");
    responseHeaders.set("Accept-Ranges", "bytes");
    responseHeaders.set(
      "Cache-Control",
      "private, no-store, no-cache, must-revalidate"
    );
    responseHeaders.delete("Content-Disposition");

    return new NextResponse(pdfRes.body, {
      status: pdfRes.status,
      headers: responseHeaders,
    });
  } catch (e) {
    console.error("[PDF proxy] error:", e);
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
