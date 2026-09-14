/**
 * PDF serving route for trend-based mock papers.
 * Serves the pre-generated PDF from public/predicted-papers/pdf/
 */

import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PDF_DIR = process.cwd() + "/public/predicted-papers/pdf";

interface RouteParams {
  branch: string;
  paperId: string;
}

function getPdfFilename(branch: string, paperId: string): string | null {
  // Extract paper number from paperId (e.g., "CS-M1" -> "01", "CS-M4" -> "04")
  const match = paperId.match(/M(\d)/);
  if (!match) return null;

  const paperNum = String(parseInt(match[1])).padStart(2, "0");
  return `PadhaiShuru_GATE_${branch.toUpperCase()}_Trend_Mock_${paperNum}.pdf`;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<RouteParams> }
) {
  try {
    const { branch, paperId } = await params;
    const filename = getPdfFilename(branch, paperId);

    if (!filename) {
      return NextResponse.json(
        { error: "Invalid paper ID" },
        { status: 400 }
      );
    }

    const filepath = `${PUBLIC_PDF_DIR}/${filename}`;

    // Check if file exists
    const fs = await import("fs");
    if (!fs.existsSync(filepath)) {
      return NextResponse.json(
        { error: "PDF not found", filename },
        { status: 404 }
      );
    }

    // Read and serve the PDF
    const fileBuffer = fs.readFileSync(filepath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Content-Length": fileBuffer.length.toString(),
        "Cache-Control": "public, max-age=86400", // 24 hours
      },
    });
  } catch (error) {
    console.error("Error serving PDF:", error);
    return NextResponse.json(
      { error: "Failed to serve PDF" },
      { status: 500 }
    );
  }
}
