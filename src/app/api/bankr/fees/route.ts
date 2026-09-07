import { jsonError, bankrFetch } from "@/lib/bankr-server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token")?.trim();
  const days = searchParams.get("days") ?? "30";
  if (!token) return jsonError("Parameter token wajib diisi.");

  const result = await bankrFetch(
    `/token-launches/${encodeURIComponent(token)}/fees?days=${encodeURIComponent(days)}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
    },
  );
  return Response.json(result.body, { status: result.status });
}
