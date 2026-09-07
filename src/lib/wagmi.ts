import { createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";
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
} from "viem/chains";

const chains = [
  base,
  robinhood,
  baseSepolia,
  mainnet,
  bsc,
  arbitrum,
  polygon,
  optimism,
  unichain,
  worldchain,
  avalanche,
] as const;

export const wagmiConfig = createConfig({
  chains,
  connectors: [injected({ shimDisconnect: true })],
  transports: {
    [base.id]: http(),
    [robinhood.id]: http("https://rpc.mainnet.chain.robinhood.com"),
    [baseSepolia.id]: http(),
    [mainnet.id]: http(),
    [bsc.id]: http(),
    [arbitrum.id]: http(),
    [polygon.id]: http(),
    [optimism.id]: http(),
    [unichain.id]: http(),
    [worldchain.id]: http(),
    [avalanche.id]: http(),
  },
  ssr: false,
});

export type AppChainId = (typeof wagmiConfig)["chains"][number]["id"];

export function asAppChainId(id: number): AppChainId {
  return id as AppChainId;
}

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
