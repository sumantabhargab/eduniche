import { NextResponse } from "next/server";
import { getAdminSession } from "@/modules/content-cms/lib/auth";
import { searchResources } from "@/modules/content-cms/services/resource-service";

export async function GET(request: Request) {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";
  const branch = searchParams.get("branch") || "";
  const subject = searchParams.get("subject") || "";
  const visibility = searchParams.get("visibility") || "";

  if (!q.trim()) {
    return NextResponse.json({ folders: [], resources: [] });
  }

  const results = await searchResources(
    q.trim(),
    branch || undefined,
    subject || undefined,
    visibility || undefined
  );

  return NextResponse.json(results);
}
