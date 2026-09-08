import { formatUnits, isAddress, parseUnits, zeroAddress } from "viem";
import { base } from "viem/chains";

const ZERO = BigInt(0);
const HUNDRED = BigInt(100);

export const DEAD_ADDRESS = "0x000000000000000000000000000000000000dEaD";

export type MintMode = "percent" | "amount";
export type RemainderTarget = "deployer" | "custom" | "dead";

export type DeployFormState = {
  chainId: number;
  tokenName: string;
  tokenSymbol: string;
  image: string;
  description: string;
  twitter: string;
  telegram: string;
  website: string;
  discord: string;
  farcaster: string;
  docs: string;
  pair: string;
  swapFee: number;
  keepPercent: number;
  feeReceiver: string;
  decimals: number;
  totalSupply: string;
  mintMode: MintMode;
  mintPercent: number;
  mintAmount: string;
  destination: string;
  remainderTarget: RemainderTarget;
  remainderWallet: string;
  mintable: boolean;
  burnable: boolean;
  capMaxSupply: boolean;
  maxSupply: string;
};

export const DEFAULT_FORM: DeployFormState = {
  chainId: base.id,
  tokenName: "",
  tokenSymbol: "",
  image: "",
  description: "",
  twitter: "",
  telegram: "",
  website: "",
  discord: "",
  farcaster: "",
  docs: "",
  pair: "WETH",
  swapFee: 1,
  keepPercent: 50,
  feeReceiver: "",
  decimals: 18,
  totalSupply: "1000000000",
  mintMode: "percent",
  mintPercent: 50,
  mintAmount: "",
  destination: "",
  remainderTarget: "deployer",
  remainderWallet: "",
  mintable: false,
  burnable: false,
  capMaxSupply: true,
  maxSupply: "1000000000",
};

export type Allocation = {
  total: bigint;
  toDestination: bigint;
  toRemainder: bigint;
  maxSupply: bigint;
  remainderAddress: `0x${string}`;
};

export function parseTokenAmount(value: string, decimals: number): bigint {
  const trimmed = value.trim().replaceAll(",", "");
  if (!trimmed) return ZERO;
  return parseUnits(trimmed, decimals);
}

export function formatTokenAmount(value: bigint, decimals: number) {
  return formatUnits(value, decimals);
}

export function displayAmount(value: bigint, decimals: number) {
  const raw = formatUnits(value, decimals);
  const [whole, frac = ""] = raw.split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  if (!frac || /^0+$/.test(frac)) return grouped;
  return `${grouped},${frac.replace(/0+$/, "")}`;
}

export function remainderAddress(
  form: DeployFormState,
  deployer?: string,
): `0x${string}` {
  if (form.remainderTarget === "dead") return DEAD_ADDRESS;
  if (form.remainderTarget === "custom") {
    return (form.remainderWallet.trim() || zeroAddress) as `0x${string}`;
  }
  return (deployer?.trim() || zeroAddress) as `0x${string}`;
}

export function computeAllocation(
  form: DeployFormState,
  deployer?: string,
): Allocation {
  const total = parseTokenAmount(form.totalSupply, form.decimals);
  let toDestination = ZERO;
  if (form.mintMode === "percent") {
    const pct = BigInt(Math.max(0, Math.min(100, Math.round(form.mintPercent))));
    toDestination = (total * pct) / HUNDRED;
  } else {
    toDestination = parseTokenAmount(form.mintAmount, form.decimals);
  }
  if (toDestination > total) toDestination = total;
  const toRemainder = total - toDestination;
  const maxSupply = form.capMaxSupply
    ? parseTokenAmount(form.maxSupply || form.totalSupply, form.decimals)
    : ZERO;
  return {
    total,
    toDestination,
    toRemainder,
    maxSupply,
    remainderAddress: remainderAddress(form, deployer),
  };
}

export function validateDeployForm(
  form: DeployFormState,
  deployer?: string,
): string | null {
  if (!form.tokenName.trim()) return "Nama token wajib diisi.";
  if (form.tokenName.trim().length > 64) return "Nama token maksimal 64 karakter.";
  if (!form.tokenSymbol.trim()) return "Ticker wajib diisi.";
  if (form.tokenSymbol.trim().length > 16) return "Ticker maksimal 16 karakter.";
  if (form.website.trim() && !isValidWebsite(form.website)) {
    return "Website harus berupa URL yang valid.";
  }
  if (form.docs.trim() && !isValidWebsite(form.docs)) {
    return "Docs harus berupa URL yang valid.";
  }
  if (form.swapFee < 0.3 || form.swapFee > 80) return "Swap fee harus 0.3–80%.";
  if (form.keepPercent < 0 || form.keepPercent > 80) {
    return "You Keep maksimal 80% (sisa ke wallet pair).";
  }
  if (form.decimals < 0 || form.decimals > 18) return "Desimal harus 0–18.";
  let total: bigint;
  try {
    total = parseTokenAmount(form.totalSupply, form.decimals);
  } catch {
    return "Total supply tidak valid.";
  }
  if (total <= ZERO) return "Total supply harus lebih dari 0.";
  const alloc = computeAllocation(form, deployer);
  if (form.mintMode === "amount") {
    try {
      parseTokenAmount(form.mintAmount || "0", form.decimals);
    } catch {
      return "Jumlah mint tidak valid.";
    }
  }
  if (alloc.toDestination > alloc.total) {
    return "Mint ke wallet tujuan melebihi total supply.";
  }
  if (alloc.toDestination > ZERO && !isAddress(form.destination.trim(), { strict: false })) {
    return "Wallet pair / tujuan untuk sisa supply tidak valid.";
  }
  if (form.feeReceiver.trim() && !isAddress(form.feeReceiver.trim(), { strict: false })) {
    return "Fee receiver tidak valid.";
  }
  if (alloc.toDestination === ZERO && alloc.toRemainder === ZERO) {
    return "Tidak ada token yang di-mint.";
  }
  if (form.remainderTarget === "custom" && alloc.toRemainder > ZERO) {
    if (!isAddress(form.remainderWallet.trim(), { strict: false })) {
      return "Wallet sisa supply tidak valid.";
    }
  }
  if (form.capMaxSupply) {
    if (alloc.maxSupply <= ZERO) return "Max supply harus lebih dari 0.";
    if (alloc.total > alloc.maxSupply) return "Total supply tidak boleh melebihi max supply.";
  }
  return null;
}

export function constructorArgs(
  form: DeployFormState,
  deployer?: string,
): readonly [
  string,
  string,
  number,
  bigint,
  bigint,
  `0x${string}`,
  bigint,
  `0x${string}`,
  boolean,
  boolean,
] {
  const alloc = computeAllocation(form, deployer);
  const destination = (
    alloc.toDestination > ZERO ? form.destination.trim() : zeroAddress
  ) as `0x${string}`;
  return [
    form.tokenName.trim(),
    form.tokenSymbol.trim().toUpperCase(),
    form.decimals,
    alloc.total,
    form.capMaxSupply ? alloc.maxSupply : ZERO,
    destination,
    alloc.toDestination,
    alloc.remainderAddress,
    form.mintable,
    form.burnable,
  ];
}

export function withKeepPercent(form: DeployFormState, keepPercent: number): DeployFormState {
  const keep = Math.max(0, Math.min(80, keepPercent));
  return {
    ...form,
    keepPercent: keep,
    mintMode: "percent",
    mintPercent: 100 - keep,
  };
}

export function isValidWebsite(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return true;
  try {
    const url = new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function websiteHref(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return trimmed.includes("://") ? trimmed : `https://${trimmed}`;
}

export function websiteHost(value: string) {
  try {
    return new URL(websiteHref(value)).hostname.replace(/^www\./, "") || value.trim();
  } catch {
    return value.trim();
  }
}

export function isValidEvmAddress(value: string) {
  return isAddress(value.trim(), { strict: false });
}

export function shortenAddress(address?: string, size = 4) {
  if (!address) return "—";
  if (address.length <= size * 2 + 2) return address;
  return `${address.slice(0, size + 2)}…${address.slice(-size)}`;
}
