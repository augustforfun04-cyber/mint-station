"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { explorerToken, chainById } from "@/lib/chains";
import { EMPTY_HISTORY, readHistory, subscribeHistory } from "@/lib/history";
import { shortenAddress } from "@/lib/token";
import { Badge } from "@/components/ui/badge";

function getServerSnapshot() {
  return EMPTY_HISTORY;
}

export function HistoryList() {
  const items = useSyncExternalStore(
    subscribeHistory,
    readHistory,
    getServerSnapshot,
  );

  if (items.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-white/15 p-6 text-sm text-muted-foreground">
        Belum ada deploy dari browser ini. Setelah transaksi sukses, token
        tersimpan di sini (localStorage), bukan di server pihak ketiga.
      </p>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <article
          key={item.txHash}
          className="rounded-2xl border border-white/10 bg-black/30 p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold">{item.tokenName}</h3>
              <p className="font-mono text-xs text-muted-foreground">
                ${item.tokenSymbol} · {shortenAddress(item.tokenAddress, 4)}
              </p>
            </div>
            <Badge variant="secondary">{chainById(item.chainId).short}</Badge>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Pair {item.pair ?? "WETH"} · Keep {item.keepPercent ?? "—"}% · Fee{" "}
            {item.swapFee ?? "—"}% · Mint {item.mintedToDestination} / {item.totalSupply}
          </p>
          <div className="mt-3 flex gap-3 text-xs">
            {item.website ? (
              <a
                className="hover:underline"
                href={
                  item.website.includes("://")
                    ? item.website
                    : `https://${item.website}`
                }
                target="_blank"
                rel="noreferrer"
              >
                Website
              </a>
            ) : null}
            <a
              className="text-lime-300 hover:underline"
              href={explorerToken(item.chainId, item.tokenAddress)}
              target="_blank"
              rel="noreferrer"
            >
              Explorer
            </a>
            <Link className="hover:underline" href="/claim">
              Claim
            </Link>
            <Link className="hover:underline" href={`/mint?token=${item.tokenAddress}`}>
              Mint lagi
            </Link>
            <Link className="hover:underline" href={`/inspect?token=${item.tokenAddress}`}>
              Inspect
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}
