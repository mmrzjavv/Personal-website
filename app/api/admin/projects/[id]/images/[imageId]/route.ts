import { NextRequest } from "next/server";
import { adminHeaders, getBackendUrl, jsonResponse } from "@/lib/backend";

export const dynamic = "force-dynamic";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; imageId: string }> },
) {
  const { id, imageId } = await params;
  try {
    const response = await fetch(
      `${getBackendUrl()}/api/admin/projects/${encodeURIComponent(id)}/images/${encodeURIComponent(imageId)}`,
      { method: "DELETE", headers: adminHeaders(request) },
    );
    return jsonResponse(response);
  } catch {
    return Response.json({ error: "Content API is unavailable" }, { status: 503 });
  }
}
