import { jsonError, bankrAuthHeaders, bankrFetch } from "@/lib/bankr-server";

export async function POST(request: Request) {
  const auth = bankrAuthHeaders(request, true);
  if (auth.error || !auth.headers) return jsonError(auth.error ?? "Unauthorized", 401);

  let token = "";
  try {
    const body = (await request.json()) as { token?: string };
    token = body.token?.trim() ?? "";
  } catch {
    return jsonError("Body JSON tidak valid.");
  }
  if (!token) return jsonError("Alamat token wajib diisi.");

  const result = await bankrFetch(
    `/token-launches/${encodeURIComponent(token)}/fees/claim`,
    {
      method: "POST",
      headers: auth.headers,
      body: "{}",
    },
  );
  return Response.json(result.body, { status: result.status });
}
