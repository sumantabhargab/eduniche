import { NextResponse } from "next/server";
import { getAdminSessionFromRoute, createRouteSupabaseClient, adminLogin } from "@/modules/content-cms/lib/auth";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    // NextResponse.next() is for middleware pass-through — it creates a
    // Response that expects further pipeline processing. In a Route Handler
    // (the terminal handler) that incompatible Response causes the SSR
    // cookie machinery to throw "[object Response]".  Use NextResponse.json()
    // which gives us a fully-formed Response with a working cookies() setter.
    const response = NextResponse.json({ ok: true }, {
      status: 200,
      headers: new Headers(request.headers),
    });

    // SSR-aware client: reads existing cookies from request headers,
    // writes new session cookies to the NextResponse after signIn.
    const supabase = createRouteSupabaseClient(request, response);

    if (!supabase) {
      return NextResponse.json(
        { error: "Server not configured. Supabase credentials are missing." },
        { status: 500 }
      );
    }

    const result = await adminLogin(supabase, email, password);

    if (!result.session) {
      return NextResponse.json(
        { error: result.error || "Invalid credentials." },
        { status: 401 }
      );
    }

    return response;
  } catch (err) {
    // Log the actual error so server logs reveal the failing line / cause.
    console.error("[login] unexpected server error:", err);
    const message = err instanceof Error ? err.message : "Something went wrong.";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
