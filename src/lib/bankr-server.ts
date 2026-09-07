import { BANKR_API_BASE, inferAuthKind, type AuthKind } from "@/lib/bankr";

export type BankrForwardResult = {
  status: number;
  body: unknown;
};

function readKey(request: Request) {
  const headerKey = request.headers.get("x-bankr-key")?.trim();
  const envKey = process.env.BANKR_API_KEY?.trim();
  return headerKey || envKey || "";
}

function readKind(request: Request, key: string): AuthKind {
  const header = request.headers.get("x-bankr-auth");
  if (header === "partner" || header === "user") return header;
  return inferAuthKind(key);
}

export function bankrAuthHeaders(request: Request, required: boolean) {
  const key = readKey(request);
  const kind = readKind(request, key);
  if (required && !key) {
    return {
      error: "Masukkan Bankr API key (bk_usr_… atau bk_ptr_…).",
      kind,
      headers: null as Record<string, string> | null,
    };
  }
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };
  if (key) {
    if (kind === "partner") headers["X-Partner-Key"] = key;
    else headers["X-API-Key"] = key;
  }
  return { error: null as string | null, kind, headers };
}

export async function bankrFetch(
  path: string,
  init: RequestInit,
): Promise<BankrForwardResult> {
  const response = await fetch(`${BANKR_API_BASE}${path}`, {
    ...init,
    cache: "no-store",
  });
  const text = await response.text();
  let body: unknown = text;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = { error: text };
    }
  }
  return { status: response.status, body };
}

export function jsonError(message: string, status = 400) {
  return Response.json({ success: false, error: message }, { status });
}
