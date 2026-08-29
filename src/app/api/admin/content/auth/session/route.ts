import { NextResponse } from "next/server";
import { getAdminSessionFromRoute } from "@/modules/content-cms/lib/auth";

export async function GET(request: Request) {
  const admin = await getAdminSessionFromRoute(request);
  if (!admin) {
    return NextResponse.json({ authenticated: false });
  }
  return NextResponse.json({
    authenticated: true,
    user: { email: admin.user.email, role: admin.user.role },
  });
}
