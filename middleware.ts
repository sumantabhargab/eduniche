import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Track referral code from URL params
  const refCode = request.nextUrl.searchParams.get("ref");
  if (refCode) {
    response.cookies.set("eduniche_ref", refCode, {
      maxAge: 60 * 60 * 24 * 30, // 30 days
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
  }

  // Admin route protection — lightweight pre-filter
  if (request.nextUrl.pathname.startsWith("/admin")) {
    if (request.nextUrl.pathname === "/admin/login") {
      return response;
    }

    const hasSession =
      request.cookies.has("sb-access-token") ||
      request.cookies.has("supabase-auth-token");

    if (!hasSession) {
      return NextResponse.redirect(
        new URL("/admin/login", request.url)
      );
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/admin/content/upload).*)",
  ],
};
