import { NextResponse } from "next/server";
import { adminLogout } from "@/modules/content-cms/lib/auth";

export async function POST() {
  await adminLogout();
  return NextResponse.json({ success: true });
}
