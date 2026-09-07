export const BANKR_API_BASE = "https://api.bankr.bot";

export const TOTAL_SUPPLY = 100_000_000_000;
export const CREATOR_SHARE = 0.15;
export const LP_SHARE = 0.85;
export const CREATOR_TOKENS = TOTAL_SUPPLY * CREATOR_SHARE;
export const LP_TOKENS = TOTAL_SUPPLY * LP_SHARE;

export type LaunchChain = "base" | "robinhood" | "arbitrum";
export type RecipientType = "wallet" | "ens" | "x" | "farcaster";
export type AuthKind = "user" | "partner";
export type QuoteToken = "weth" | "bnkr" | "ba3pump" | "cbhype" | "cbzec" | "tao";

export const CHAINS: {
  id: LaunchChain;
  label: string;
  network: string;
  chainId: number;
  native: string;
  explorerToken: (address: string) => string;
  explorerTx: (hash: string) => string;
  sponsored: boolean;
  defaultForApi: boolean;
}[] = [
  {
    id: "base",
    label: "Base",
    network: "Base",
    chainId: 8453,
    native: "ETH",
    explorerToken: (a) => `https://basescan.org/token/${a}`,
    explorerTx: (h) => `https://basescan.org/tx/${h}`,
    sponsored: true,
    defaultForApi: false,
  },
  {
    id: "robinhood",
    label: "Robinhood Chain",
    network: "Robinhood Chain",
    chainId: 4663,
    native: "ETH",
    explorerToken: (a) => `https://robinhoodchain.blockscout.com/token/${a}`,
    explorerTx: (h) => `https://robinhoodchain.blockscout.com/tx/${h}`,
    sponsored: false,
    defaultForApi: true,
  },
  {
    id: "arbitrum",
    label: "Arbitrum One",
    network: "Arbitrum",
    chainId: 42161,
    native: "ETH",
    explorerToken: (a) => `https://arbiscan.io/token/${a}`,
    explorerTx: (h) => `https://arbiscan.io/tx/${h}`,
    sponsored: false,
    defaultForApi: false,
  },
];

export const QUOTE_TOKENS: Record<
  QuoteToken,
  { label: string; address?: string; chains: LaunchChain[] }
> = {
  weth: { label: "WETH", chains: ["base", "robinhood", "arbitrum"] },
  bnkr: {
    label: "BNKR",
    address: "0x22af33fe49fd1fa80c7149773dde5890d3c76f3b",
    chains: ["base"],
  },
  ba3pump: {
    label: "ba3Pump",
    address: "0x5577a294ae5a21446a11b0e4100ca83803995720",
    chains: ["base"],
  },
  cbhype: {
    label: "cbHYPE",
    address: "0xB200000000000000000000451d033a5000cb479e",
    chains: ["base"],
  },
  cbzec: {
    label: "cbZEC",
    address: "0xB2000000000000000000008501b13360000cb2EC",
    chains: ["base"],
  },
  tao: {
    label: "TAO",
    address: "0xf3081494b87e8d5fb7960f066e931d1d0e6e3d67",
    chains: ["base"],
  },
};

export const FEE_SPLIT = [
  { label: "Creator (95% dari pool swap 0.7%)", volume: "0.665%" },
  { label: "LP fee (terkunci di pool)", volume: "0.285%" },
  { label: "Bankr protocol", volume: "0.475%" },
  { label: "BNKR buyback", volume: "0.2375%" },
  { label: "Protocol Doppler", volume: "~0.0875%" },
] as const;

export type FeeRecipient = {
  type: RecipientType;
  value: string;
};

export type DeployPayload = {
  tokenName: string;
  tokenSymbol?: string;
  description?: string;
  image?: string;
  websiteUrl?: string;
  tweetUrl?: string;
  chain: LaunchChain;
  feeRecipient?: FeeRecipient;
  disableVesting?: boolean;
  quoteOnlyFees?: boolean;
  degenMode?: boolean;
  simulateOnly?: boolean;
  pairedTokenAddress?: string;
};

export type DeployFormState = {
  tokenName: string;
  tokenSymbol: string;
  description: string;
  image: string;
  websiteUrl: string;
  tweetUrl: string;
  chain: LaunchChain;
  quoteToken: QuoteToken;
  quoteOnlyFees: boolean;
  degenMode: boolean;
  mintToDestination: boolean;
  destinationType: RecipientType;
  destinationValue: string;
};

export type DeployResult = {
  success?: boolean;
  tokenAddress?: string;
  poolId?: string;
  txHash?: string;
  activityId?: string;
  chain?: string;
  feeDistribution?: Record<
    string,
    { address?: string; bps?: number } | undefined
  >;
  message?: string;
  error?: string;
  simulated?: boolean;
};

export type LaunchItem = {
  activityId?: string;
  status?: string;
  launchType?: string;
  tokenName?: string;
  tokenSymbol?: string;
  chain?: string;
  tokenAddress?: string;
  poolId?: string;
  txHash?: string;
  imageUri?: string;
  tweetUrl?: string;
  websiteUrl?: string;
  timestamp?: number;
  deployer?: { walletAddress?: string; xUsername?: string };
  feeRecipient?: { walletAddress?: string; xUsername?: string };
  unclaimedFees?: {
    tokenAmount?: string;
    tokenSymbol?: string;
    wethAmount?: string;
    usdValue?: number;
  } | null;
};

export type WalletMe = {
  success?: boolean;
  wallets?: { chain: string; address: string }[];
  socialAccounts?: { platform: string; username: string }[];
  bankrClub?: { active?: boolean };
  refCode?: string;
};

const EVM_ADDRESS = /^0x[a-fA-F0-9]{40}$/;

export function inferAuthKind(key: string): AuthKind {
  if (key.startsWith("bk_ptr_")) return "partner";
  return "user";
}

export function chainMeta(chain: string) {
  return CHAINS.find((c) => c.id === chain) ?? CHAINS[0];
}

export function sanitizeRecipient(type: RecipientType, raw: string) {
  const value = raw.trim();
  if (type === "x" || type === "farcaster") {
    return value.replace(/^@/, "");
  }
  return value;
}

export function isValidEvmAddress(value: string) {
  return EVM_ADDRESS.test(value.trim());
}

export function validateDestination(
  type: RecipientType,
  value: string,
): string | null {
  const v = value.trim();
  if (!v) return "Wallet tujuan wajib diisi.";
  if (type === "wallet" && !isValidEvmAddress(v)) {
    return "Alamat EVM tidak valid. Gunakan format 0x diikuti 40 karakter hex.";
  }
  if (type === "ens" && !v.includes(".")) {
    return "ENS harus berbentuk nama.eth atau sejenisnya.";
  }
  return null;
}

export function validateDeployForm(
  form: DeployFormState,
  authKind: AuthKind,
): string | null {
  const name = form.tokenName.trim();
  if (name.length < 1) return "Nama token wajib diisi.";
  if (name.length > 100) return "Nama token maksimal 100 karakter.";
  const symbol = form.tokenSymbol.trim();
  if (symbol && (symbol.length < 1 || symbol.length > 20)) {
    return "Simbol token 1–20 karakter.";
  }
  if (form.image && !isHttpUrl(form.image)) {
    return "URL gambar harus http atau https.";
  }
  if (form.websiteUrl && !isHttpUrl(form.websiteUrl)) {
    return "URL website harus http atau https.";
  }
  if (form.tweetUrl && !isHttpUrl(form.tweetUrl)) {
    return "URL tweet harus http atau https.";
  }
  if (form.chain !== "base" && form.quoteToken !== "weth") {
    return "Quote token selain WETH hanya tersedia di Base.";
  }
  if (authKind === "partner" && form.degenMode) {
    return "Degen mode ditolak untuk Partner Key.";
  }
  if (authKind === "partner" && form.chain !== "base") {
    return "Deploy Partner Key hanya bisa di Base.";
  }
  if (authKind === "partner" && form.quoteToken !== "weth") {
    return "Quote token tambahan tidak tersedia untuk Partner Key.";
  }
  if (form.mintToDestination) {
    if (authKind === "partner") {
      return "Partner Key tidak memint creator allocation. Matikan mint, atau pakai User API Key.";
    }
    return validateDestination(form.destinationType, form.destinationValue);
  }
  if (authKind === "partner") {
    return validateDestination(form.destinationType, form.destinationValue);
  }
  return null;
}

export function buildDeployPayload(
  form: DeployFormState,
  options: { simulateOnly: boolean; authKind: AuthKind },
): DeployPayload {
  const payload: DeployPayload = {
    tokenName: form.tokenName.trim(),
    chain: form.chain,
  };

  const symbol = form.tokenSymbol.trim().toUpperCase();
  if (symbol) payload.tokenSymbol = symbol;
  if (form.description.trim()) payload.description = form.description.trim();
  if (form.image.trim()) payload.image = form.image.trim();
  if (form.websiteUrl.trim()) payload.websiteUrl = form.websiteUrl.trim();
  if (form.tweetUrl.trim()) payload.tweetUrl = form.tweetUrl.trim();
  if (form.quoteOnlyFees) payload.quoteOnlyFees = true;
  if (form.degenMode && options.authKind !== "partner") payload.degenMode = true;
  if (options.simulateOnly) payload.simulateOnly = true;

  if (
    form.chain === "base" &&
    form.quoteToken !== "weth" &&
    options.authKind !== "partner"
  ) {
    payload.pairedTokenAddress = QUOTE_TOKENS[form.quoteToken].address;
  }

  const destination = sanitizeRecipient(
    form.destinationType,
    form.destinationValue,
  );

  if (form.mintToDestination && destination && options.authKind !== "partner") {
    payload.feeRecipient = {
      type: form.destinationType,
      value: destination,
    };
    payload.disableVesting = false;
  } else if (destination) {
    payload.feeRecipient = {
      type: form.destinationType,
      value: destination,
    };
    payload.disableVesting = true;
  } else {
    payload.disableVesting = true;
  }

  if (options.authKind === "partner") {
    delete payload.disableVesting;
    delete payload.degenMode;
    delete payload.pairedTokenAddress;
  }

  return payload;
}

export function formatTokenAmount(amount: number) {
  return new Intl.NumberFormat("id-ID").format(amount);
}

export function shortenAddress(address?: string, size = 4) {
  if (!address) return "—";
  if (address.length <= size * 2 + 2) return address;
  return `${address.slice(0, size + 2)}…${address.slice(-size)}`;
}

export function isHttpUrl(value: string) {
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export const DEFAULT_FORM: DeployFormState = {
  tokenName: "",
  tokenSymbol: "",
  description: "",
  image: "",
  websiteUrl: "",
  tweetUrl: "",
  chain: "base",
  quoteToken: "weth",
  quoteOnlyFees: false,
  degenMode: false,
  mintToDestination: true,
  destinationType: "wallet",
  destinationValue: "",
};

export function bankrTokenUrl(chain: string, address: string) {
  const path = chain === "robinhood" ? "robinhood" : chain === "arbitrum" ? "arbitrum" : "base";
  return `https://bankr.bot/launches/${address}?chain=${path}`;
}
