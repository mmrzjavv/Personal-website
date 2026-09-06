import { getBackendUrl, jsonResponse } from "@/lib/backend";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const response = await fetch(`${getBackendUrl()}/api/projects`, {
      cache: "no-store",
    });
    return jsonResponse(response);
  } catch {
    return Response.json({ error: "Content API is unavailable" }, { status: 503 });
  }
}
