/**
 * GET /api/errors — receive error reports from ErrorBoundary
 */

import { NextResponse } from "next/server";

export async function POST(request: Request) {
  // Log errors server-side for debugging
  const body = await request.json().catch(() => ({}));
  console.error("[Client Error Report]", JSON.stringify(body, null, 2));

  return NextResponse.json({ received: true });
}
