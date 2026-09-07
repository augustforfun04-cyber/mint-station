import { jsonError, bankrAuthHeaders, bankrFetch } from "@/lib/bankr-server";
import type { DeployPayload } from "@/lib/bankr";

export async function POST(request: Request) {
  const auth = bankrAuthHeaders(request, true);
  if (auth.error || !auth.headers) return jsonError(auth.error ?? "Unauthorized", 401);

  let payload: DeployPayload;
  try {
    payload = (await request.json()) as DeployPayload;
  } catch {
    return jsonError("Body JSON tidak valid.");
  }

  if (!payload?.tokenName?.trim()) {
    return jsonError("tokenName wajib diisi.");
  }

  const result = await bankrFetch("/token-launches/deploy", {
    method: "POST",
    headers: auth.headers,
    body: JSON.stringify(payload),
  });

  return Response.json(result.body, { status: result.status });
}
