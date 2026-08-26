import { NextResponse } from "next/server";

/**
 * POST /api/events
 *
 * Accepts analytics events from the client.
 * Currently stores them; can be extended to forward to a warehouse.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Basic validation
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const events = Array.isArray(body.events) ? body.events : [body];

    // Log for development — in production this would forward to a data warehouse
    console.log(
      `[events] received ${events.length} event(s)`,
      JSON.stringify(events).slice(0, 500)
    );

    return NextResponse.json({ received: events.length }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
}
