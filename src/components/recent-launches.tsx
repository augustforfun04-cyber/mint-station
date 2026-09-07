"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  bankrTokenUrl,
  chainMeta,
  shortenAddress,
  type LaunchItem,
} from "@/lib/bankr";

export function RecentLaunches({ limit = 12 }: { limit?: number }) {
  const [launches, setLaunches] = useState<LaunchItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/bankr/launches")
      .then(async (res) => {
        const data = (await res.json()) as {
          launches?: LaunchItem[];
          error?: string;
        };
        if (!res.ok) throw new Error(data.error || "Gagal memuat launch.");
        if (!cancelled) setLaunches(data.launches ?? []);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Gagal memuat launch.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <p className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
        {error}
      </p>
    );
  }

  if (!launches) {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-2xl border border-white/10 bg-white/5"
          />
        ))}
      </div>
    );
  }

  if (launches.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-white/15 p-6 text-sm text-muted-foreground">
        Belum ada launch yang bisa ditampilkan.
      </p>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {launches.slice(0, limit).map((item) => {
        const chain = chainMeta(item.chain || "base");
        const address = item.tokenAddress;
        return (
          <article
            key={item.activityId || address}
            className="rounded-2xl border border-white/10 bg-black/30 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold">{item.tokenName || "Token"}</h3>
                <p className="font-mono text-xs text-muted-foreground">
                  ${item.tokenSymbol} · {shortenAddress(address, 4)}
                </p>
              </div>
              <Badge variant="secondary" className="capitalize">
                {item.chain || "base"}
              </Badge>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Fee ke {shortenAddress(item.feeRecipient?.walletAddress, 4)}
              {item.feeRecipient?.xUsername
                ? ` (@${item.feeRecipient.xUsername})`
                : ""}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {address ? (
                <>
                  <Button size="xs" variant="outline" asChild>
                    <a
                      href={chain.explorerToken(address)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Explorer <ExternalLink className="size-3" />
                    </a>
                  </Button>
                  <Button size="xs" variant="ghost" asChild>
                    <a
                      href={bankrTokenUrl(item.chain || "base", address)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Bankr
                    </a>
                  </Button>
                  <Button size="xs" variant="ghost" asChild>
                    <Link href={`/fees?token=${address}`}>Cek fee</Link>
                  </Button>
                </>
              ) : null}
            </div>
          </article>
        );
      })}
    </div>
  );
}
