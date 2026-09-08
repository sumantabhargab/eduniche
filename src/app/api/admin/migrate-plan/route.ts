/**
 * DEPRECATED: One-time migration endpoint — plan column was added in migration.
 * Returns 410 Gone to reduce attack surface.
 */

import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: "GONE",
        message: "This migration endpoint has been removed. The plan column was added via Supabase migration 20260830000001.",
      },
    },
    { status: 410 }
  );
}

export async function GET() {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: "GONE",
        message: "This migration endpoint has been removed. The plan column was added via Supabase migration 20260830000001.",
      },
    },
    { status: 410 }
  );
}
