export type PairKind = "crypto" | "stock";

export type PairOption = {
  id: string;
  label: string;
  name: string;
  kind: PairKind;
};

export const PAIR_OPTIONS: PairOption[] = [
  { id: "WETH", label: "WETH", name: "Ether", kind: "crypto" },
  { id: "USDC", label: "USDC", name: "USD Coin", kind: "crypto" },
  { id: "NVDA", label: "NVDA", name: "NVIDIA", kind: "stock" },
  { id: "TSLA", label: "TSLA", name: "Tesla", kind: "stock" },
  { id: "AAPL", label: "AAPL", name: "Apple", kind: "stock" },
  { id: "META", label: "META", name: "Meta Platforms", kind: "stock" },
  { id: "MSFT", label: "MSFT", name: "Microsoft", kind: "stock" },
  { id: "AMD", label: "AMD", name: "AMD", kind: "stock" },
  { id: "GOOGL", label: "GOOGL", name: "Alphabet", kind: "stock" },
  { id: "AMZN", label: "AMZN", name: "Amazon", kind: "stock" },
  { id: "SBCX", label: "SBCX", name: "SBCX", kind: "stock" },
  { id: "SPY", label: "SPY", name: "SPDR S&P 500", kind: "stock" },
  { id: "COIN", label: "COIN", name: "Coinbase", kind: "stock" },
  { id: "HOOD", label: "HOOD", name: "Robinhood", kind: "stock" },
];

export const FEATURED_PAIRS = ["NVDA", "SBCX", "TSLA", "AAPL", "META", "WETH", "USDC"];

export const SWAP_FEE_PRESETS = [0.3, 1, 2, 3, 5, 8, 10];
export const KEEP_PRESETS = [10, 15, 30, 50, 80];

export function pairById(id: string) {
  return PAIR_OPTIONS.find((p) => p.id === id) ?? PAIR_OPTIONS[0];
}
