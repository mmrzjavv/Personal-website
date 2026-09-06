export function getBackendUrl(): string {
  return process.env.PORTFOLIO_API_URL || "http://127.0.0.1:8000";
}

export function adminHeaders(request: Request): HeadersInit {
  const token = request.headers.get("x-admin-token");
  return token ? { "x-admin-token": token } : {};
}

export async function jsonResponse(response: Response): Promise<Response> {
  const body = await response.text();
  return new Response(body, {
    status: response.status,
    headers: { "content-type": response.headers.get("content-type") || "application/json" },
  });
}
