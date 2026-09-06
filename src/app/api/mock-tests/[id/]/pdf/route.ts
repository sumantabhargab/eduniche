/**
 * PDF proxy for mock tests — streams a mock test PDF from Supabase Storage
 * through this server-side route.
 *
 * Accepts a mock test `id`, re-verifies the test exists and is published,
 * re-checks premium access, generates a fresh signed URL server-side,
 * fetches the PDF bytes, and streams them to the client.
 *
 * Security:
 *   1. Client sends only the mock test ID — no storage paths, no tokens.
 *   2. Server re-verifies the test exists and is published.
 *   3. Premium access is re-checked server-side.
 *   4. Signed URL is generated server-side with service-role key.
 *   5. PDF bytes are streamed same-origin — no CORS issues.
 */

import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getSignedUrl } from "@/modules/content-cms/lib/storage";

const SIGNED_URL_TTL = 3600; // 1 hour

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

    // 1) Look up the mock test
    const { data: test, error: testError } = await supabase
      .from("mock_tests")
      .select("id, title, storage_path, mime_type, access_tier, visibility, branch, mock_number")
      .eq("id", id)
      .eq("visibility", "published")
      .maybeSingle();

    if (testError || !test) {
      return NextResponse.json({ error: "Mock test not found." }, { status: 404 });
    }

    // 2) Re-check premium access (all mock tests are premium)
    if (test.access_tier === "premium") {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        return NextResponse.json(
          { error: "Premium access required. Please sign in.", requiresPremium: true },
          { status: 401 }
        );
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
          return NextResponse.json(
            { error: "Premium access required. Please upgrade.", requiresPremium: true },
            { status: 403 }
          );
        }
      }
    }

    // 3) Generate a fresh signed URL server-side
    const urlResult = await getSignedUrl(test.storage_path, SIGNED_URL_TTL);
    if (!urlResult.success || !urlResult.url) {
      return NextResponse.json({ error: "Failed to generate access link." }, { status: 500 });
    }

    // 4) Fetch the PDF bytes from Supabase Storage
    const pdfRes = await fetch(urlResult.url, {
      credentials: "omit",
    });

    if (!pdfRes.ok || !pdfRes.body) {
      console.error(`[Mock PDF proxy] upstream fetch failed — ${pdfRes.status} ${pdfRes.statusText}`);
      return NextResponse.json(
        { error: "Failed to retrieve PDF from storage." },
        { status: pdfRes.status || 502 }
      );
    }

    // 5) Stream to client with explicit PDF headers
    const responseHeaders = new Headers(pdfRes.headers);
    responseHeaders.set("Content-Type", "application/pdf");
    responseHeaders.set("Accept-Ranges", "bytes");
    responseHeaders.set("Cache-Control", "private, no-store, no-cache, must-revalidate");
    responseHeaders.delete("Content-Disposition");

    return new NextResponse(pdfRes.body, {
      status: pdfRes.status,
      headers: responseHeaders,
    });
  } catch (e) {
    console.error("[Mock PDF proxy] error:", e);
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
