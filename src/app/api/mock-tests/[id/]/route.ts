/**
 * GET /api/mock-tests/[id]
 * Returns mock test metadata.
 * Checks premium access if the test is premium-tier.
 */

import { NextResponse } from "next/server";
import { getMockTest } from "@/lib/mock-tests/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { test, error, requiresPremium } = await getMockTest(id, true);

    if (requiresPremium) {
      return NextResponse.json(
        { error: "Premium access required. Please upgrade your plan.", requiresPremium: true },
        { status: 403 }
      );
    }

    if (error || !test) {
      return NextResponse.json({ error: "Mock test not found." }, { status: 404 });
    }

    // Return metadata only (no storage_path to client)
    const { storage_path, ...safe } = test;
    return NextResponse.json({ test: safe });
  } catch {
    return NextResponse.json({ error: "Failed to load mock test." }, { status: 500 });
  }
}
