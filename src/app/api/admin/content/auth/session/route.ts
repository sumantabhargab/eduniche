import { NextResponse } from "next/server";
import { getAdminSession, adminLogin } from "@/modules/content-cms/lib/auth";

export async function GET() {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ authenticated: false });
  }
  return NextResponse.json({
    authenticated: true,
    user: { email: admin.user.email, role: admin.user.role },
  });
}
