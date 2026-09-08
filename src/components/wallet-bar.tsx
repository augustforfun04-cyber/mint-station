"use client";

import { useSyncExternalStore } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { Button } from "@/components/ui/button";
import { shortenAddress } from "@/lib/token";

function useMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export function WalletBar() {
  const mounted = useMounted();
  const { address, isConnected } = useAccount();
  const { connectors, connect, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();
  const injected = connectors.find((c) => c.id === "injected") ?? connectors[0];

  if (!mounted || !isConnected) {
    return (
      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          className="h-8 rounded-full bg-lime-400 px-4 text-black hover:bg-lime-300"
          onClick={() => injected && connect({ connector: injected })}
          disabled={!injected || isPending}
        >
          {isPending ? "Connecting…" : "Connect"}
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
    <button
      type="button"
      className="rounded-full border border-white/10 bg-zinc-900 px-3 py-1.5 font-mono text-xs text-zinc-200"
      onClick={() => disconnect()}
      title="Disconnect"
    >
      {shortenAddress(address, 4)}
    </button>
  );
}
