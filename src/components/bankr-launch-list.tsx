"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { bankrChainId, pairLabel, type BankrLaunch } from "@/lib/bankr";
import { explorerToken, chainById } from "@/lib/chains";
import { shortenAddress } from "@/lib/token";

export function BankrLaunchList() {
  const [launches, setLaunches] = useState<BankrLaunch[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/bankr/launches")
      .then(async (res) => {
        const data = (await res.json()) as { launches?: BankrLaunch[]; error?: string };
        if (!res.ok) throw new Error(data.error || "Bankr launches gagal.");
        if (!cancelled) setLaunches(data.launches ?? []);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Bankr launches gagal.");
          setLaunches([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (launches === null) {
    return <p className="text-sm text-zinc-500">Memuat launch Bankr yang pair saham…</p>;
  }

  if (error) {
    return (
      <p className="rounded-2xl border border-dashed border-white/15 p-6 text-sm text-zinc-500">
        {error}
      </p>
    );
  }

  if (launches.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-white/15 p-6 text-sm text-zinc-500">
        Belum ada launch Bankr dengan pair saham di 50 transaksi terakhir.
      </p>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {launches.map((item) => {
        const chainId = bankrChainId(item.chain);
        return (
          <article
            key={item.txHash || item.tokenAddress}
            className="rounded-2xl border border-white/10 bg-black/30 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold">{item.tokenName}</h3>
                <p className="font-mono text-xs text-muted-foreground">
                  ${item.tokenSymbol} · {shortenAddress(item.tokenAddress, 4)}
                </p>
              </div>
              <Badge variant="secondary">{chainById(chainId).short}</Badge>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Paired with {pairLabel(item)} · {item.status}
            </p>
            <div className="mt-3 flex gap-3 text-xs">
              {item.websiteUrl ? (
                <a className="hover:underline" href={item.websiteUrl} target="_blank" rel="noreferrer">
                  Website
                </a>
              ) : null}
              <a
                className="text-lime-300 hover:underline"
                href={explorerToken(chainId, item.tokenAddress)}
                target="_blank"
                rel="noreferrer"
              >
                Explorer
              </a>
            </div>
          </article>
        );
      })}
    </div>
  );
}
