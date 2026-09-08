import { base, robinhood } from "viem/chains";

export type BankrLaunch = {
  activityId?: string;
  status: string;
  tokenName: string;
  tokenSymbol: string;
  chain: string;
  tokenAddress: string;
  txHash: string;
  websiteUrl?: string | null;
  timestamp: number;
  deployer?: { walletAddress?: string; xUsername?: string | null };
  pairedStock?: { address: string; symbol: string } | null;
  pairedToken?: { address: string; symbol: string } | null;
};

export type BankrLaunchList = {
  launches: BankrLaunch[];
};

export type BankrLivePair = {
  chain: string;
  symbol: string;
  address: string;
  kind: "stock" | "crypto";
};

const BANKR_LAUNCHES = "https://api.bankr.bot/token-launches";

export async function fetchBankrLaunches(): Promise<BankrLaunch[]> {
  const res = await fetch(BANKR_LAUNCHES, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error("Bankr launches tidak tersedia.");
  const data = (await res.json()) as BankrLaunchList;
  return data.launches ?? [];
}

export function stockPairedLaunches(launches: BankrLaunch[]) {
  return launches.filter((item) => item.pairedStock?.symbol);
}

export function quotePairedLaunches(launches: BankrLaunch[]) {
  return launches.filter((item) => item.pairedToken?.symbol);
}

export function uniqueStockPairs(launches: BankrLaunch[]): BankrLivePair[] {
  const seen = new Map<string, BankrLivePair>();
  for (const item of launches) {
    const stock = item.pairedStock;
    if (!stock?.symbol || !stock.address) continue;
    const key = `${item.chain}:${stock.symbol}`;
    if (!seen.has(key)) {
      seen.set(key, {
        chain: item.chain,
        symbol: stock.symbol,
        address: stock.address,
        kind: "stock",
      });
    }
  }
  return [...seen.values()];
}

export function uniqueQuotePairs(launches: BankrLaunch[]): BankrLivePair[] {
  const seen = new Map<string, BankrLivePair>();
  for (const item of launches) {
    const quote = item.pairedToken;
    if (!quote?.symbol || !quote.address) continue;
    const key = `${item.chain}:${quote.symbol}`;
    if (!seen.has(key)) {
      seen.set(key, {
        chain: item.chain,
        symbol: quote.symbol,
        address: quote.address,
        kind: "crypto",
      });
    }
  }
  return [...seen.values()];
}

export function bankrChainId(chain: string) {
  if (chain === "robinhood") return robinhood.id;
  if (chain === "base") return base.id;
  if (chain === "arbitrum") return 42161;
  return base.id;
}

export function pairLabel(item: BankrLaunch) {
  return item.pairedStock?.symbol ?? item.pairedToken?.symbol ?? "WETH";
}
