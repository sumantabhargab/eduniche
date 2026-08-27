import { NextResponse } from "next/server";
import { getAdminSession } from "@/modules/content-cms/lib/auth";
import { getResource, updateResource, deleteResource } from "@/modules/content-cms/services/resource-service";
import type { ResourceUpdateInput } from "@/modules/content-cms/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: resourceId } = await params;
  const result = await getResource(resourceId);

  if (result.error || !result.resource) {
    return NextResponse.json(
      { error: result.error || "Resource not found." },
      { status: 404 }
    );
  }

  return NextResponse.json(result.resource);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: resourceId } = await params;
  const body: ResourceUpdateInput = await request.json();
  const result = await updateResource(resourceId, body);

  if (result.error || !result.resource) {
    return NextResponse.json(
      { error: result.error },
      { status: 400 }
    );
  }

  return NextResponse.json(result.resource);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: resourceId } = await params;
  const result = await deleteResource(resourceId);

  if (!result.deleted) {
    return NextResponse.json(
      { error: result.error },
      { status: 400 }
    );
  }

  return NextResponse.json({ deleted: true });
}
