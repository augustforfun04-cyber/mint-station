export type ImportedToken = {
  name: string;
  symbol: string;
  image: string;
  website: string;
  twitter: string;
  telegram: string;
  description: string;
  chainHint?: string;
};

type DexPair = {
  chainId?: string;
  url?: string;
  baseToken?: { address?: string; name?: string; symbol?: string };
  info?: {
    imageUrl?: string;
    websites?: { url?: string }[];
    socials?: { type?: string; url?: string }[];
  };
};

function extractAddress(query: string) {
  const trimmed = query.trim();
  const urlMatch = trimmed.match(/0x[a-fA-F0-9]{40}/);
  if (urlMatch) return urlMatch[0];
  const dex = trimmed.match(/dexscreener\.com\/[^/]+\/([a-zA-Z0-9]+)/i);
  if (dex?.[1] && dex[1].startsWith("0x")) return dex[1];
  return trimmed;
}

function fromPair(pair: DexPair): ImportedToken {
  const socials = pair.info?.socials ?? [];
  const twitter =
    socials.find((s) => /twitter|x/i.test(s.type ?? "") || /x\.com|twitter/i.test(s.url ?? ""))
      ?.url ?? "";
  const telegram =
    socials.find((s) => /telegram/i.test(s.type ?? "") || /t\.me/i.test(s.url ?? ""))?.url ?? "";
  return {
    name: pair.baseToken?.name ?? "",
    symbol: (pair.baseToken?.symbol ?? "").toUpperCase(),
    image: pair.info?.imageUrl ?? "",
    website: pair.info?.websites?.[0]?.url ?? "",
    twitter,
    telegram,
    description: pair.chainId ? `Imported from ${pair.chainId}.` : "",
    chainHint: pair.chainId,
  };
}

export async function fetchImportedToken(query: string): Promise<ImportedToken> {
  const q = query.trim();
  if (!q) throw new Error("Isi CA, mint, atau URL Dexscreener.");
  const address = extractAddress(q);
  const tokenUrl = `https://api.dexscreener.com/latest/dex/tokens/${encodeURIComponent(address)}`;
  const tokenRes = await fetch(tokenUrl, { next: { revalidate: 0 } });
  if (tokenRes.ok) {
    const data = (await tokenRes.json()) as { pairs?: DexPair[] };
    if (data.pairs?.length) return fromPair(data.pairs[0]);
  }
  const searchUrl = `https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(q)}`;
  const searchRes = await fetch(searchUrl, { next: { revalidate: 0 } });
  if (!searchRes.ok) throw new Error("Dexscreener tidak merespons.");
  const search = (await searchRes.json()) as { pairs?: DexPair[] };
  if (!search.pairs?.length) throw new Error("Token tidak ketemu di Dexscreener.");
  return fromPair(search.pairs[0]);
}
