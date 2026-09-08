import { NextRequest } from "next/server";
import { adminHeaders, getBackendUrl, jsonResponse } from "@/lib/backend";

export const dynamic = "force-dynamic";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const response = await fetch(`${getBackendUrl()}/api/admin/projects/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: adminHeaders(request),
    });
    return jsonResponse(response);
  } catch {
    return Response.json({ error: "Content API is unavailable" }, { status: 503 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const response = await fetch(`${getBackendUrl()}/api/admin/projects/${encodeURIComponent(id)}`, {
      method: "PUT",
      headers: adminHeaders(request),
      body: await request.formData(),
    });
    return jsonResponse(response);
  } catch {
    return Response.json({ error: "Content API is unavailable" }, { status: 503 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const response = await fetch(`${getBackendUrl()}/api/admin/projects/${encodeURIComponent(id)}/images`, {
      method: "PATCH",
      headers: { ...adminHeaders(request), "content-type": "application/json" },
      body: await request.text(),
    });
    return jsonResponse(response);
  } catch {
    return Response.json({ error: "Content API is unavailable" }, { status: 503 });
  }
}
