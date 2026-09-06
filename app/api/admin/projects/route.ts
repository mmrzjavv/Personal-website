import { NextRequest } from "next/server";
import { adminHeaders, getBackendUrl, jsonResponse } from "@/lib/backend";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${getBackendUrl()}/api/admin/projects`, {
      headers: adminHeaders(request),
      cache: "no-store",
    });
    return jsonResponse(response);
  } catch {
    return Response.json({ error: "Content API is unavailable" }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const response = await fetch(`${getBackendUrl()}/api/admin/projects`, {
      method: "POST",
      headers: adminHeaders(request),
      body: await request.formData(),
    });
    return jsonResponse(response);
  } catch {
    return Response.json({ error: "Content API is unavailable" }, { status: 503 });
  }
}
