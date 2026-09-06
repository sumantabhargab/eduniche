/**
 * GET /api/admin/mock-tests
 * List all mock tests (admin view — includes drafts).
 *
 * POST /api/admin/mock-tests
 * Ingest a mock test PDF from the local premium_mock_tests/ directory.
 *
 * This endpoint is designed to be called from a local ingestion script
 * or admin tool that reads files from the local filesystem and POSTs them here.
 *
 * Expected multipart form-data:
 *   - file: the PDF file
 *   - metadata: JSON string with all mock test metadata
 */

import { NextResponse } from "next/server";
import { getAdminSessionFromRoute } from "@/modules/content-cms/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { getSignedUrl } from "@/modules/content-cms/lib/storage";

// GET: list all mock tests (admin)
export async function GET() {
  const admin = await getAdminSessionFromRoute(new Request("http://localhost"));
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createServiceClient();
    if (!supabase) {
      return NextResponse.json({ error: "Server not configured." }, { status: 500 });
    }

    const { data, error } = await supabase
      .from("mock_tests")
      .select("*")
      .order("branch", { ascending: true })
      .order("mock_number", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ tests: data });
  } catch (e) {
    return NextResponse.json({ error: "Failed to list mock tests." }, { status: 500 });
  }
}

// POST: ingest a new mock test
export async function POST(request: Request) {
  const admin = await getAdminSessionFromRoute(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createServiceClient();
    if (!supabase) {
      return NextResponse.json({ error: "Server not configured." }, { status: 500 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const metadataStr = formData.get("metadata") as string | null;

    if (!file) {
      return NextResponse.json({ error: "PDF file is required." }, { status: 400 });
    }

    if (!metadataStr) {
      return NextResponse.json({ error: "metadata JSON is required." }, { status: 400 });
    }

    const metadata = JSON.parse(metadataStr);

    // Validate required fields
    const requiredFields = ["branch", "branch_code", "branch_name", "mock_number", "title"];
    for (const field of requiredFields) {
      if (!metadata[field]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
      }
    }

    // Validate file type
    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "File must be a PDF." }, { status: 400 });
    }

    // Upload to Supabase Storage (mock-tests bucket)
    const storagePath = `mock-tests/${metadata.branch}/mock_${String(metadata.mock_number).padStart(2, "0")}/EduNeuro_${metadata.branch_code}_Mock_${String(metadata.mock_number).padStart(2, "0")}.pdf`;

    const { error: uploadError } = await supabase.storage
      .from("mock-tests")
      .upload(storagePath, file, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 });
    }

    // Create or update database record
    const { data: existing } = await supabase
      .from("mock_tests")
      .select("id")
      .eq("branch", metadata.branch)
      .eq("mock_number", metadata.mock_number)
      .maybeSingle();

    const record = {
      branch: metadata.branch,
      branch_code: metadata.branch_code,
      branch_name: metadata.branch_name,
      mock_number: metadata.mock_number,
      title: metadata.title,
      storage_path: storagePath,
      file_size: file.size,
      mime_type: "application/pdf",
      original_filename: file.name,
      question_count: metadata.question_count || 0,
      maximum_marks: metadata.maximum_marks || 0,
      duration_minutes: metadata.duration_minutes || 180,
      subject_distribution: metadata.subject_distribution || [],
      difficulty_distribution: metadata.difficulty_distribution || { easy: 25, moderate: 50, hard: 25 },
      generation_basis: metadata.generation_basis || "previous_year_question_analysis",
      access_tier: "premium",
      visibility: metadata.visibility || "published",
      metadata: metadata.metadata || {},
    };

    let result;
    if (existing?.id) {
      ({ data: result } = await supabase
        .from("mock_tests")
        .update(record)
        .eq("id", existing.id)
        .select()
        .single());
    } else {
      ({ data: result } = await supabase
        .from("mock_tests")
        .insert(record)
        .select()
        .single());
    }

    if (!result) {
      return NextResponse.json({ error: "Failed to create database record." }, { status: 500 });
    }

    return NextResponse.json({ test: result }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: "Ingestion failed." }, { status: 500 });
  }
}
