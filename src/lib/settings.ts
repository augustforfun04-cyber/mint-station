export type AppSettings = {
  pair: string;
  keepPercent: number;
  swapFee: number;
  claimWallet: string;
  ipfsGateway: string;
};

const KEY = "mint-station.settings";
const listeners = new Set<() => void>();

export const DEFAULT_SETTINGS: AppSettings = {
  pair: "WETH",
  keepPercent: 50,
  swapFee: 1,
  claimWallet: "",
  ipfsGateway: "https://ipfs.io/ipfs/",
};

function notify() {
  for (const listener of listeners) listener();
}

export function readSettings(): AppSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<AppSettings>) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function writeSettings(next: AppSettings) {
  window.localStorage.setItem(KEY, JSON.stringify(next));
  notify();
}

export function subscribeSettings(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

export function resolveMediaUrl(value: string, gateway = DEFAULT_SETTINGS.ipfsGateway) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("ipfs://")) {
    const path = trimmed.replace(/^ipfs:\/\//, "").replace(/^ipfs\//, "");
    return `${gateway.replace(/\/?$/, "/")}${path}`;
  }
  return trimmed;
}
