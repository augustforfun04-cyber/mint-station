"use client";

import { useEffect, useMemo, useState } from "react";
import type { BankrLaunch, BankrLivePair } from "@/lib/bankr";
import {
  catalogWithLive,
  defaultPairId,
  featuredPairIds,
  pairById,
  pairsForChain,
  type PairOption,
} from "@/lib/pairs";

type BankrCatalogResponse = {
  launches?: BankrLaunch[];
  quotes?: BankrLaunch[];
  pairs?: BankrLivePair[];
  quotePairs?: BankrLivePair[];
};

export function useBankrCatalog(chainId: number) {
  const [live, setLive] = useState<BankrLivePair[]>([]);
  const [launches, setLaunches] = useState<BankrLaunch[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/bankr/launches")
      .then(async (res) => {
        const data = (await res.json()) as BankrCatalogResponse & { error?: string };
        if (!res.ok) throw new Error(data.error || "Bankr launches gagal.");
        if (cancelled) return;
        setLive([...(data.pairs ?? []), ...(data.quotePairs ?? [])]);
        setLaunches(data.launches ?? []);
        setError(null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Bankr launches gagal.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const catalog = useMemo(() => catalogWithLive(live), [live]);
  const pairs = useMemo(() => pairsForChain(chainId, catalog), [catalog, chainId]);
  const featured = useMemo(() => {
    const wanted = featuredPairIds(chainId);
    const featuredSet = new Set(wanted);
    const fromWanted = wanted
      .map((id) => pairById(id, catalog))
      .filter((p) => p.chainIds.includes(chainId));
    const liveExtras = pairs.filter((p) => p.live && !featuredSet.has(p.id));
    const seen = new Set<string>();
    const out: PairOption[] = [];
    for (const option of [...fromWanted, ...liveExtras]) {
      if (seen.has(option.id)) continue;
      seen.add(option.id);
      out.push(option);
    }
    return out;
  }, [catalog, pairs, chainId]);

  return {
    catalog,
    pairs,
    featured,
    launches,
    error,
    resolve: (id: string) => pairById(id, catalog),
    defaultId: defaultPairId(chainId),
  };
}
