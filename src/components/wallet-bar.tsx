"use client";

import { useSyncExternalStore } from "react";
import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { Button } from "@/components/ui/button";
import { chainById, CHAIN_OPTIONS } from "@/lib/chains";
import { shortenAddress } from "@/lib/token";
import { asAppChainId } from "@/lib/wagmi";

function useMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export function WalletBar() {
  const mounted = useMounted();
  const { address, isConnected, chainId } = useAccount();
  const { connectors, connect, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const injected = connectors.find((c) => c.id === "injected") ?? connectors[0];
  const meta = chainId ? chainById(chainId) : null;

  if (!mounted || !isConnected) {
    return (
      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          onClick={() => injected && connect({ connector: injected })}
          disabled={!injected || isPending}
        >
          {isPending ? "Menghubungkan…" : "Hubungkan wallet"}
        </Button>
        {error ? (
          <span className="max-w-40 truncate text-[11px] text-destructive">
            {error.message}
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <select
        className="h-8 rounded-lg border border-white/15 bg-black/40 px-2 text-xs"
        value={chainId}
        onChange={(e) => switchChain({ chainId: asAppChainId(Number(e.target.value)) })}
      >
        {CHAIN_OPTIONS.map((c) => (
          <option key={c.id} value={c.id}>
            {c.short}
          </option>
        ))}
      </select>
      <span className="hidden font-mono text-xs text-lime-200 sm:inline">
        {shortenAddress(address, 4)}
      </span>
      <Button type="button" size="sm" variant="outline" onClick={() => disconnect()}>
        Putus
      </Button>
      {meta?.testnet ? (
        <span className="text-[10px] text-amber-300">testnet</span>
      ) : null}
    </div>
  );
}
