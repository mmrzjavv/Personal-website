import { getBackendUrl } from "@/lib/backend";

export const dynamic = "force-dynamic";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ key: string[] }> },
) {
  const { key } = await params;
  const objectKey = key.map((part) => encodeURIComponent(part)).join("/");
  try {
    const response = await fetch(`${getBackendUrl()}/api/media/${objectKey}`, {
      cache: "no-store",
    });
    return new Response(response.body, {
      status: response.status,
      headers: {
        "content-type": response.headers.get("content-type") || "application/octet-stream",
        "cache-control": response.headers.get("cache-control") || "public, max-age=86400",
      },
    });
  } catch {
    return Response.json({ error: "Media API is unavailable" }, { status: 503 });
  }
}
