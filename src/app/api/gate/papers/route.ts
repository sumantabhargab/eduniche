import { NextResponse } from "next/server";
import { PAPERS } from "@/lib/gate/config";

export async function GET() {
  return NextResponse.json({ papers: PAPERS });
}
