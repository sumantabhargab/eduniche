import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/billboard
 * Public endpoint — returns eligible creatives for a slot.
 * Query param: slot=<slotId>
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slotId = searchParams.get("slot");

    if (!slotId) {
      return NextResponse.json(
        { error: "Missing required parameter: slot" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const now = new Date().toISOString();

    const { data: creatives, error } = await supabase
      .from("billboard_creatives")
      .select("*")
      .eq("slot_id", slotId)
      .eq("is_active", true)
      .or(`start_at.is.null,start_at.lte.${now}`)
      .or(`end_at.is.null,end_at.gte.${now}`)
      .order("priority", { ascending: false })
      .order("created_at", { ascending: true });

    if (error) {
      console.error("[billboard] query error:", error);
      return NextResponse.json(
        { error: "Failed to load advertisements" },
        { status: 500 }
      );
    }

    // Generate signed URLs (valid 1 hour) for the private bucket.
    // Skip creatives whose storage file is missing — avoids showing broken images.
    const signed = await Promise.all(
      (creatives ?? []).map(async (c) => {
        const storagePath = c.creative_url.replace(/^billboard-ads\//, "");
        const { data: urlData, error: urlError } = await supabase.storage
          .from("billboard-ads")
          .createSignedUrl(storagePath, 3600);

        if (urlError || !urlData?.signedUrl) {
          console.warn(`[billboard] missing storage file for creative ${c.id}: ${storagePath}`);
          return null;
        }

        return {
          ...c,
          creative_url: urlData.signedUrl,
        };
      })
    );

    const results = signed.filter((c): c is NonNullable<typeof c> => c !== null);

    return NextResponse.json({ creatives: results });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
