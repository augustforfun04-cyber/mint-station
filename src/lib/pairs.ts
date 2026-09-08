import { base, robinhood } from "viem/chains";

export type PairKind = "crypto" | "stock";

export type PairOption = {
  id: string;
  symbol: string;
  label: string;
  name: string;
  kind: PairKind;
  chainIds: number[];
  address?: `0x${string}`;
  venue: "weth" | "stable" | "bankr-quote" | "b20" | "robinhood-stock";
  live?: boolean;
};

const BASE = base.id;
export const ROBINHOOD_ID = robinhood.id;
const RH = robinhood.id;

/** Bankr docs: default quote is WETH; Base also allows 5 pairedTokenAddress quotes. */
const BANKR_QUOTES: PairOption[] = [
  {
    id: "weth",
    symbol: "WETH",
    label: "WETH",
    name: "Ether",
    kind: "crypto",
    chainIds: [BASE, RH],
    venue: "weth",
  },
  {
    id: "usdc",
    symbol: "USDC",
    label: "USDC",
    name: "USD Coin",
    kind: "crypto",
    chainIds: [BASE, RH],
    venue: "stable",
  },
  {
    id: "base:BNKR",
    symbol: "BNKR",
    label: "BNKR",
    name: "BankrCoin",
    kind: "crypto",
    chainIds: [BASE],
    address: "0x22af33fe49fd1fa80c7149773dde5890d3c76f3b",
    venue: "bankr-quote",
  },
  {
    id: "base:ba3Pump",
    symbol: "ba3Pump",
    label: "ba3Pump",
    name: "Bankr-bridged PUMP",
    kind: "crypto",
    chainIds: [BASE],
    address: "0x5577a294ae5a21446a11b0e4100ca83803995720",
    venue: "bankr-quote",
  },
  {
    id: "base:cbHYPE",
    symbol: "cbHYPE",
    label: "cbHYPE",
    name: "Coinbase Wrapped HYPE",
    kind: "crypto",
    chainIds: [BASE],
    address: "0xB200000000000000000000451d033a5000cb479e",
    venue: "bankr-quote",
  },
  {
    id: "base:cbZEC",
    symbol: "cbZEC",
    label: "cbZEC",
    name: "Coinbase Wrapped ZEC",
    kind: "crypto",
    chainIds: [BASE],
    address: "0xB2000000000000000000008501b13360000cb2EC",
    venue: "bankr-quote",
  },
  {
    id: "base:TAO",
    symbol: "TAO",
    label: "TAO",
    name: "Bittensor",
    kind: "crypto",
    chainIds: [BASE],
    address: "0xf3081494b87e8d5fb7960f066e931d1d0e6e3d67",
    venue: "bankr-quote",
  },
];

/** Coinbase B20 equities on Base — Bankr pairedStockAddress. */
const B20: Array<[string, string, `0x${string}`]> = [
  ["AAPL", "Apple", "0xb200000000000000000000C2e324d24d7eEcd1fb"],
  ["AMZN", "Amazon", "0xb200000000000000000000d9192b6B456483C2E8"],
  ["COIN", "Coinbase", "0xb200000000000000000000c85a31389D71F3ecfb"],
  ["CRCL", "Circle", "0xB20000000000000000000019f6E7C675b73C2e4D"],
  ["GOOGL", "Alphabet", "0xb2000000000000000000002D0BA3164cc74f58B7"],
  ["INTC", "Intel", "0xB2000000000000000000004AFF16039bA04bdFBc"],
  ["META", "Meta Platforms", "0xb2000000000000000000008bC8786B856E61707C"],
  ["MSFT", "Microsoft", "0xB200000000000000000000Ab99cFa739E253872B"],
  ["MSTR", "MicroStrategy", "0xb2000000000000000000004884b426556b92883d"],
  ["NVDA", "NVIDIA", "0xb20000000000000000000078ee7ce2fE4908108C"],
  ["SNDK", "Sandisk", "0xb200000000000000000000397293Cb8cda9a10c5"],
  ["SPCX", "SpaceX (tokenized)", "0xb2000000000000000000007b9fcbd005511aCBd5"],
  ["TSLA", "Tesla", "0xb2000000000000000000001e800a7f5189430cD0"],
];

/** Robinhood Chain stocks seen on Bankr Doppler launches + common tickers. */
const ROBINHOOD_STOCKS: Array<[string, string, `0x${string}` | undefined]> = [
  ["NVDA", "NVIDIA", "0xd0601ce157db5bdc3162bbac2a2c8af5320d9eec"],
  ["TSLA", "Tesla", "0x322f0929c4625ed5bad873c95208d54e1c003b2d"],
  ["AAPL", "Apple", undefined],
  ["GME", "GameStop", "0x1b0e319c6a659f002271b69db8a7df2f911c153e"],
  ["MSTR", "MicroStrategy", "0xec262a75e413fafd0df80480274532c79d42da09"],
  ["ADBE", "Adobe", "0x232b8ed6377be97813853b0ac104c4cda8378d1b"],
  ["DDOG", "Datadog", "0x27c99fbde9d0d2aa4f4bfb4943f237843ddf6958"],
  ["SPY", "SPDR S&P 500", undefined],
  ["QQQ", "Invesco QQQ", undefined],
  ["HOOD", "Robinhood", undefined],
  ["MSFT", "Microsoft", undefined],
  ["AMZN", "Amazon", undefined],
  ["META", "Meta Platforms", undefined],
];

export const PAIR_OPTIONS: PairOption[] = [
  ...BANKR_QUOTES,
  ...B20.map(([symbol, name, address]) => ({
    id: `base:${symbol}`,
    symbol,
    label: symbol,
    name: `${name} (B20)`,
    kind: "stock" as const,
    chainIds: [BASE],
    address,
    venue: "b20" as const,
  })),
  ...ROBINHOOD_STOCKS.map(([symbol, name, address]) => ({
    id: `robinhood:${symbol}`,
    symbol,
    label: symbol,
    name: `${name} (Robinhood)`,
    kind: "stock" as const,
    chainIds: [RH],
    address,
    venue: "robinhood-stock" as const,
  })),
];

export const SWAP_FEE_PRESETS = [0.3, 0.7, 1, 2, 3, 5, 8, 10];
export const KEEP_PRESETS = [0, 10, 15, 30, 50, 80];

export type LivePair = {
  chain: string;
  symbol: string;
  address: string;
  kind?: PairKind;
};

export function chainKeyToId(chain: string) {
  if (chain === "robinhood") return RH;
  if (chain === "base") return BASE;
  if (chain === "arbitrum") return 42161;
  return 0;
}

export function pairsForChain(chainId: number, catalog: PairOption[] = PAIR_OPTIONS) {
  const list = catalog.filter((p) => p.chainIds.includes(chainId));
  if (list.length) return list;
  return catalog.filter((p) => p.venue === "weth" || p.venue === "stable");
}

export function featuredPairIds(chainId: number) {
  if (chainId === RH) {
    return [
      "weth",
      "robinhood:NVDA",
      "robinhood:TSLA",
      "robinhood:AAPL",
      "robinhood:GME",
      "robinhood:MSTR",
      "usdc",
    ];
  }
  if (chainId === BASE) {
    return [
      "weth",
      "base:NVDA",
      "base:TSLA",
      "base:AAPL",
      "base:META",
      "base:MSTR",
      "base:BNKR",
      "usdc",
    ];
  }
  return ["weth", "usdc"];
}

export function pairById(id: string, catalog: PairOption[] = PAIR_OPTIONS) {
  const normalized = id === "WETH" ? "weth" : id;
  return (
    catalog.find((p) => p.id === normalized || p.symbol === id) ?? catalog[0]
  );
}

export function defaultPairId(chainId: number) {
  return featuredPairIds(chainId)[0] ?? "weth";
}

export function pairFitsChain(id: string, chainId: number, catalog: PairOption[] = PAIR_OPTIONS) {
  const option = pairById(id, catalog);
  if (option.venue === "weth" || option.venue === "stable") {
    return option.id === id || option.symbol === id || id === "WETH";
  }
  return option.chainIds.includes(chainId) && (option.id === id || option.symbol === id);
}

export function catalogWithLive(live: LivePair[]): PairOption[] {
  const byId = new Map(PAIR_OPTIONS.map((p) => [p.id, { ...p }]));
  const extras: PairOption[] = [];
  for (const row of live) {
    const chainId = chainKeyToId(row.chain);
    if (!chainId) continue;
    const id = `${row.chain}:${row.symbol}`;
    const existing = byId.get(id);
    if (existing) {
      existing.live = true;
      if (!existing.address && row.address) {
        existing.address = row.address as `0x${string}`;
      }
      continue;
    }
    extras.push({
      id,
      symbol: row.symbol,
      label: row.symbol,
      name: `${row.symbol} (${row.chain})`,
      kind: row.kind ?? "stock",
      chainIds: [chainId],
      address: row.address as `0x${string}`,
      venue: chainId === RH ? "robinhood-stock" : "b20",
      live: true,
    });
  }
  return [...byId.values(), ...extras];
}

export function mergeLiveStockPairs(live: LivePair[]) {
  return catalogWithLive(live).filter((p) => p.live && p.kind === "stock");
}
