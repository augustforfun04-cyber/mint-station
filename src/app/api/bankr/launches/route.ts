import { bankrFetch } from "@/lib/bankr-server";

export async function GET() {
  const result = await bankrFetch("/token-launches", {
    method: "GET",
    headers: { Accept: "application/json" },
  });
  return Response.json(result.body, { status: result.status });
}
