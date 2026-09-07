import { jsonError, bankrAuthHeaders, bankrFetch } from "@/lib/bankr-server";

export async function GET(request: Request) {
  const auth = bankrAuthHeaders(request, true);
  if (auth.error || !auth.headers) return jsonError(auth.error ?? "Unauthorized", 401);

  const result = await bankrFetch("/wallet/me", {
    method: "GET",
    headers: auth.headers,
  });
  return Response.json(result.body, { status: result.status });
}
