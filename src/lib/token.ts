import { formatUnits, isAddress, parseUnits, zeroAddress } from "viem";
import { base } from "viem/chains";

const ZERO = BigInt(0);
const HUNDRED = BigInt(100);

export const DEAD_ADDRESS = "0x000000000000000000000000000000000000dEaD";

export type MintMode = "percent" | "amount";
export type RemainderTarget = "deployer" | "custom" | "dead";
export type TokenPreset = "memecoin" | "agent" | "utility" | "fair" | "custom";

export type DeployFormState = {
  preset: TokenPreset;
  chainId: number;
  tokenName: string;
  tokenSymbol: string;
  description: string;
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

export const PRESETS: Record<
  Exclude<TokenPreset, "custom">,
  {
    label: string;
    blurb: string;
    patch: Partial<DeployFormState>;
  }
> = {
  memecoin: {
    label: "Memecoin",
    blurb: "Supply besar, 18 desimal — standar meme 2026 di Base.",
    patch: {
      decimals: 18,
      totalSupply: "1000000000",
      mintMode: "percent",
      mintPercent: 100,
      mintable: false,
      burnable: true,
      capMaxSupply: true,
    },
  },
  agent: {
    label: "Agent / AI",
    blurb: "Supply 100 miliar ala token agent, mint ke treasury tujuan.",
    patch: {
      decimals: 18,
      totalSupply: "100000000000",
      mintMode: "percent",
      mintPercent: 15,
      mintable: false,
      burnable: false,
      capMaxSupply: true,
    },
  },
  utility: {
    label: "Utility",
    blurb: "Supply menengah, sisa ke deployer untuk likuiditas.",
    patch: {
      decimals: 18,
      totalSupply: "100000000",
      mintMode: "percent",
      mintPercent: 20,
      mintable: true,
      burnable: true,
      capMaxSupply: true,
      maxSupply: "200000000",
    },
  },
  fair: {
    label: "Fair (tanpa premint)",
    blurb: "0% ke wallet lain — seluruh supply ke deployer/LP.",
    patch: {
      decimals: 18,
      totalSupply: "1000000000",
      mintMode: "percent",
      mintPercent: 0,
      mintable: false,
      burnable: false,
      capMaxSupply: true,
    },
  },
};

export const DEFAULT_FORM: DeployFormState = {
  preset: "memecoin",
  chainId: base.id,
  tokenName: "",
  tokenSymbol: "",
  description: "",
  decimals: 18,
  totalSupply: "1000000000",
  mintMode: "percent",
  mintPercent: 100,
  mintAmount: "",
  destination: "",
  remainderTarget: "deployer",
  remainderWallet: "",
  mintable: false,
  burnable: true,
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

export function applyPreset(
  current: DeployFormState,
  preset: TokenPreset,
): DeployFormState {
  if (preset === "custom") return { ...current, preset };
  const next = { ...current, ...PRESETS[preset].patch, preset };
  if (next.capMaxSupply && !PRESETS[preset].patch.maxSupply) {
    next.maxSupply = next.totalSupply;
  }
  return next;
}

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
  if (!form.tokenSymbol.trim()) return "Simbol token wajib diisi.";
  if (form.tokenSymbol.trim().length > 16) return "Simbol maksimal 16 karakter.";
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
    return "Wallet tujuan mint tidak valid.";
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
    if (alloc.maxSupply <= ZERO) return "Max supply harus lebih dari 0, atau matikan cap.";
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

export function isValidEvmAddress(value: string) {
  return isAddress(value.trim(), { strict: false });
}

export function shortenAddress(address?: string, size = 4) {
  if (!address) return "—";
  if (address.length <= size * 2 + 2) return address;
  return `${address.slice(0, size + 2)}…${address.slice(-size)}`;
}
