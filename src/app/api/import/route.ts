import { fetchImportedToken } from "@/lib/import-token";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  try {
    const token = await fetchImportedToken(query);
    return Response.json(token);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Import gagal.";
    return Response.json({ error: message }, { status: 400 });
  }
}
