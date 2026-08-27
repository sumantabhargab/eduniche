import { NextResponse } from "next/server";
import { getAdminSession, createRouteSupabaseClient, adminLogin } from "@/modules/content-cms/lib/auth";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    // Response must be created before signInWithPassword so the
    // @supabase/ssr onAuthStateChange callback can flush session
    // cookies to response.cookies via applyServerStorage.
    const response = NextResponse.next({
      request: { headers: request.headers },
    });

    // SSR-aware client: reads existing cookies from request headers,
    // writes new session cookies to the NextResponse after signIn.
    const supabase = createRouteSupabaseClient(request, response);

    if (!supabase) {
      return NextResponse.json(
        { error: "Server not configured." },
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
  } catch {
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}
