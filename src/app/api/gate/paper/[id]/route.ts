import { NextRequest, NextResponse } from "next/server";
import { getPaperById } from "@/lib/gate/config";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const paper = getPaperById(id);

    if (!paper) {
      return NextResponse.json({ error: "Paper not found" }, { status: 404 });
    }

    return NextResponse.json({ paper });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
