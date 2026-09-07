import {
  arbitrum,
  avalanche,
  base,
  baseSepolia,
  bsc,
  mainnet,
  optimism,
  polygon,
  robinhood,
  unichain,
  worldchain,
  type Chain,
} from "viem/chains";

export type ChainOption = {
  id: number;
  key: string;
  label: string;
  short: string;
  native: string;
  testnet?: boolean;
  chain: Chain;
};

export const CHAIN_OPTIONS: ChainOption[] = [
  { id: base.id, key: "base", label: "Base", short: "Base", native: "ETH", chain: base },
  {
    id: robinhood.id,
    key: "robinhood",
    label: "Robinhood Chain",
    short: "Robinhood",
    native: "ETH",
    chain: robinhood,
  },
  {
    id: baseSepolia.id,
    key: "base-sepolia",
    label: "Base Sepolia (tes)",
    short: "Sepolia",
    native: "ETH",
    testnet: true,
    chain: baseSepolia,
  },
  { id: mainnet.id, key: "ethereum", label: "Ethereum", short: "ETH", native: "ETH", chain: mainnet },
  { id: bsc.id, key: "bnb", label: "BNB Chain", short: "BNB", native: "BNB", chain: bsc },
  { id: arbitrum.id, key: "arbitrum", label: "Arbitrum One", short: "ARB", native: "ETH", chain: arbitrum },
  { id: polygon.id, key: "polygon", label: "Polygon", short: "POL", native: "POL", chain: polygon },
  { id: optimism.id, key: "optimism", label: "Optimism", short: "OP", native: "ETH", chain: optimism },
  { id: unichain.id, key: "unichain", label: "Unichain", short: "UNI", native: "ETH", chain: unichain },
  { id: worldchain.id, key: "world", label: "World Chain", short: "World", native: "ETH", chain: worldchain },
  { id: avalanche.id, key: "avalanche", label: "Avalanche C-Chain", short: "AVAX", native: "AVAX", chain: avalanche },
];

export function chainById(id: number) {
  return CHAIN_OPTIONS.find((c) => c.id === id) ?? CHAIN_OPTIONS[0];
}

export function explorerToken(chainId: number, address: string) {
  const chain = chainById(chainId).chain;
  const baseUrl = chain.blockExplorers?.default.url ?? "https://basescan.org";
  return `${baseUrl}/token/${address}`;
}

export function explorerTx(chainId: number, hash: string) {
  const chain = chainById(chainId).chain;
  const baseUrl = chain.blockExplorers?.default.url ?? "https://basescan.org";
  return `${baseUrl}/tx/${hash}`;
}

export function explorerAddress(chainId: number, address: string) {
  const chain = chainById(chainId).chain;
  const baseUrl = chain.blockExplorers?.default.url ?? "https://basescan.org";
  return `${baseUrl}/address/${address}`;
}
