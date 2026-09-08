import { NextRequest } from "next/server";
import { adminHeaders, getBackendUrl, jsonResponse } from "@/lib/backend";

export const dynamic = "force-dynamic";

export async function PATCH(request: NextRequest) {
  try {
    const response = await fetch(`${getBackendUrl()}/api/admin/projects/reorder`, {
      method: "PATCH",
      headers: { ...adminHeaders(request), "content-type": "application/json" },
      body: await request.text(),
    });
    return jsonResponse(response);
  } catch {
    return Response.json({ error: "Content API is unavailable" }, { status: 503 });
  }
}
