/**
 * PATCH /api/admin/mock-tests/[id]
 * Updates a mock test (e.g., visibility toggle).
 *
 * DELETE /api/admin/mock-tests/[id]
 * Deletes a mock test from both database and storage.
 */

import { NextResponse } from "next/server";
import { getAdminSessionFromRoute } from "@/modules/content-cms/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminSessionFromRoute(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const supabase = createServiceClient();

    if (!supabase) {
      return NextResponse.json({ error: "Server not configured." }, { status: 500 });
    }

    // Get the test first
    const { data: test } = await supabase
      .from("mock_tests")
      .select("storage_path")
      .eq("id", id)
      .maybeSingle();

    if (!test) {
      return NextResponse.json({ error: "Mock test not found." }, { status: 404 });
    }

    const { data, error } = await supabase
      .from("mock_tests")
      .update(body)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ test: data });
  } catch {
    return NextResponse.json({ error: "Failed to update mock test." }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminSessionFromRoute(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const supabase = createServiceClient();

    if (!supabase) {
      return NextResponse.json({ error: "Server not configured." }, { status: 500 });
    }

    // Get the test first
    const { data: test } = await supabase
      .from("mock_tests")
      .select("storage_path")
      .eq("id", id)
      .maybeSingle();

    if (!test) {
      return NextResponse.json({ error: "Mock test not found." }, { status: 404 });
    }

    // Delete from storage
    await supabase.storage.from("mock-tests").remove([test.storage_path]);

    // Delete from database
    const { error } = await supabase.from("mock_tests").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete mock test." }, { status: 500 });
  }
}
