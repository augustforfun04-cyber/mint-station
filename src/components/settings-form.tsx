"use client";

import { useState, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WalletBar } from "@/components/wallet-bar";
import { KEEP_PRESETS, PAIR_OPTIONS, SWAP_FEE_PRESETS } from "@/lib/pairs";
import {
  DEFAULT_SETTINGS,
  readSettings,
  subscribeSettings,
  writeSettings,
  type AppSettings,
} from "@/lib/settings";
import { isValidEvmAddress } from "@/lib/token";

export function SettingsForm() {
  const { address, isConnected } = useAccount();
  const stored = useSyncExternalStore(
    subscribeSettings,
    readSettings,
    () => DEFAULT_SETTINGS,
  );
  const [draft, setForm] = useState<AppSettings | null>(null);
  const form = draft ?? stored;

  function save() {
    if (form.claimWallet.trim() && !isValidEvmAddress(form.claimWallet)) {
      toast.error("Claim wallet tidak valid.");
      return;
    }
    writeSettings(form);
    toast.success("Settings disimpan di browser ini.");
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <section className="rounded-3xl border border-white/10 bg-zinc-950 p-5">
        <h2 className="font-medium">Wallet defaults</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Pair, keep, and reserved claim wallet — per browser, dipakai di form Launch.
        </p>
        {!isConnected ? (
          <div className="mt-4">
            <WalletBar />
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <p className="font-mono text-xs text-zinc-500">{address}</p>
            <label className="block space-y-1.5 text-sm">
              <span className="text-zinc-400">Default pair</span>
              <select
                className="h-11 w-full rounded-xl border border-white/10 bg-zinc-900 px-3"
                value={form.pair}
                onChange={(e) => setForm({ ...form, pair: e.target.value })}
              >
                {PAIR_OPTIONS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1.5 text-sm">
              <span className="text-zinc-400">Default you keep</span>
              <select
                className="h-11 w-full rounded-xl border border-white/10 bg-zinc-900 px-3"
                value={form.keepPercent}
                onChange={(e) =>
                  setForm({ ...form, keepPercent: Number(e.target.value) })
                }
              >
                {KEEP_PRESETS.map((k) => (
                  <option key={k} value={k}>
                    {k}%
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1.5 text-sm">
              <span className="text-zinc-400">Default swap fee</span>
              <select
                className="h-11 w-full rounded-xl border border-white/10 bg-zinc-900 px-3"
                value={form.swapFee}
                onChange={(e) => setForm({ ...form, swapFee: Number(e.target.value) })}
              >
                {SWAP_FEE_PRESETS.map((f) => (
                  <option key={f} value={f}>
                    {f}%
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1.5 text-sm">
              <span className="text-zinc-400">Reserved / pair wallet default</span>
              <Input
                className="h-11 rounded-xl border-white/10 bg-zinc-900 font-mono"
                value={form.claimWallet}
                onChange={(e) => setForm({ ...form, claimWallet: e.target.value })}
                placeholder="0x…"
              />
            </label>
            <Button type="button" onClick={save}>
              Save defaults
            </Button>
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-white/10 bg-zinc-950 p-5">
        <h2 className="font-medium">RPC & IPFS</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Only if the public RPC or IPFS pin fails. Gateway dipakai untuk preview{" "}
          <code>ipfs://</code>.
        </p>
        <label className="mt-4 block space-y-1.5 text-sm">
          <span className="text-zinc-400">IPFS gateway</span>
          <Input
            className="h-11 rounded-xl border-white/10 bg-zinc-900"
            value={form.ipfsGateway}
            onChange={(e) => setForm({ ...form, ipfsGateway: e.target.value })}
            placeholder="https://ipfs.io/ipfs/"
          />
        </label>
        <Button type="button" className="mt-4" variant="secondary" onClick={save}>
          Save gateway
        </Button>
      </section>
    </div>
  );
}
