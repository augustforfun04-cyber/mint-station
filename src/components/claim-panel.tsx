"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useAccount } from "wagmi";
import { useSyncExternalStore } from "react";
import { WalletBar } from "@/components/wallet-bar";
import { EMPTY_HISTORY, readHistory, subscribeHistory } from "@/lib/history";
import { chainById, explorerToken } from "@/lib/chains";
import { shortenAddress } from "@/lib/token";
import { pairById } from "@/lib/pairs";

function snap() {
  return EMPTY_HISTORY;
}

export function ClaimPanel() {
  const { address, isConnected } = useAccount();
  const items = useSyncExternalStore(subscribeHistory, readHistory, snap);
  const mine = useMemo(() => {
    if (!address) return [];
    return items.filter(
      (item) => item.launcher?.toLowerCase() === address.toLowerCase(),
    );
  }, [address, items]);
  const [selected, setSelected] = useState<string>("");
  const token = mine.find((item) => item.tokenAddress === selected) ?? mine[0];

  if (!isConnected) {
    return (
      <div className="rounded-3xl border border-white/10 bg-zinc-950 p-6">
        <h2 className="text-lg font-medium">Claim reserved & fees</h2>
        <p className="mt-2 text-sm text-zinc-500">
          Connect wallet yang dipakai saat launch, pilih token, lalu cek reserved.
        </p>
        <div className="mt-4">
          <WalletBar />
        </div>
      </div>
    );
  }

  if (mine.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-white/15 p-6 text-sm text-zinc-500">
        Belum ada launch dari wallet ini di browser ini. Reserved tercatat setelah
        Launch sukses.
      </p>
    );
  }

  const keep = token?.keepPercent ?? 0;
  const pair = pairById(token?.pair ?? "weth");

  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        {mine.map((item) => (
          <button
            key={item.txHash}
            type="button"
            onClick={() => setSelected(item.tokenAddress)}
            className={`rounded-2xl border px-4 py-3 text-left ${
              token?.txHash === item.txHash
                ? "border-white bg-zinc-900"
                : "border-white/10 hover:border-white/25"
            }`}
          >
            <p className="font-medium">
              {item.tokenName} ${item.tokenSymbol}
            </p>
            <p className="text-xs text-zinc-500">
              Keep {item.keepPercent ?? 0}% · Pair {pairById(item.pair ?? "weth").label} · Fee{" "}
              {item.swapFee ?? 1}%
            </p>
          </button>
        ))}
      </div>
      {token ? (
        <div className="rounded-3xl border border-white/10 bg-zinc-950 p-5 text-sm">
          <p className="text-zinc-400">Reserved (permissionless, minted at launch)</p>
          <p className="mt-1 text-lg font-medium">{keep}% to deployer</p>
          <p className="mt-3 text-zinc-400">Pair / LP wallet</p>
          <p className="font-mono text-xs">{shortenAddress(token.destination, 6)}</p>
          <p className="mt-3 text-zinc-400">Fee receiver</p>
          <p className="font-mono text-xs">
            {shortenAddress(token.feeReceiver || address, 6)} · {token.swapFee ?? 1}%
            recorded · {pair.label}
          </p>
          <p className="mt-4 text-xs text-zinc-500">
            Fee LP tidak dipotong kontrak ERC-20 ini. Klaim fee di DEX setelah pool hidup.
            Reserved sudah masuk wallet saat launch. Bankr Doppler memakai 0.7% pool fee
            (95% ke creator) kalau kamu launch lewat Bankr, bukan dari form ini.
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-xs">
            <a
              className="text-lime-300 hover:underline"
              href={explorerToken(token.chainId, token.tokenAddress)}
              target="_blank"
              rel="noreferrer"
            >
              Explorer · {chainById(token.chainId).short}
            </a>
            <Link className="hover:underline" href={`/mint?token=${token.tokenAddress}`}>
              Mint extra
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
