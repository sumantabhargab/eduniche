/**
 * GET /api/mock-tests
 * Lists all published mock tests.
 * Returns only metadata (no PDF URLs).
 * Premium access check is enforced in the browser-based PDF delivery endpoints.
 */

import { NextResponse } from "next/server";
import { listMockTests } from "@/lib/mock-tests/server";

export async function GET() {
  try {
    const { tests, error } = await listMockTests();

    if (error) {
      return NextResponse.json({ error: Array.isArray(tests) && tests.length === 0 ? error : "Failed to list mock tests." }, { status: 500 });
    }

    return NextResponse.json({ tests });
  } catch {
    return NextResponse.json({ error: "Failed to list mock tests." }, { status: 500 });
  }
}
