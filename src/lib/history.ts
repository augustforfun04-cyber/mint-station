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
export const EMPTY_HISTORY: DeployRecord[] = [];
const listeners = new Set<() => void>();

let cachedRaw: string | null | undefined;
let cachedList: DeployRecord[] = EMPTY_HISTORY;

function notify() {
  for (const listener of listeners) listener();
}

export function readHistory(): DeployRecord[] {
  if (typeof window === "undefined") return EMPTY_HISTORY;
  const raw = window.localStorage.getItem(KEY);
  if (raw === cachedRaw) return cachedList;
  cachedRaw = raw;
  if (!raw) {
    cachedList = EMPTY_HISTORY;
    return cachedList;
  }
  try {
    cachedList = JSON.parse(raw) as DeployRecord[];
  } catch {
    cachedList = EMPTY_HISTORY;
  }
  return cachedList;
}

export function subscribeHistory(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

export function pushHistory(entry: DeployRecord) {
  const next = [entry, ...readHistory().filter((e) => e.txHash !== entry.txHash)].slice(
    0,
    40,
  );
  const raw = JSON.stringify(next);
  window.localStorage.setItem(KEY, raw);
  cachedRaw = raw;
  cachedList = next;
  notify();
}
