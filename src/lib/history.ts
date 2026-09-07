export type DeployRecord = {
  savedAt: number;
  chainId: number;
  tokenName: string;
  tokenSymbol: string;
  tokenAddress: string;
  txHash: string;
  destination: string;
  mintedToDestination: string;
  totalSupply: string;
};

const KEY = "manual.token.deploys";

export function readHistory(): DeployRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as DeployRecord[]) : [];
  } catch {
    return [];
  }
}

export function pushHistory(entry: DeployRecord) {
  const next = [entry, ...readHistory().filter((e) => e.txHash !== entry.txHash)].slice(
    0,
    40,
  );
  window.localStorage.setItem(KEY, JSON.stringify(next));
}
