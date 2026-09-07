"use client";

import { useState } from "react";
import { Eye, EyeOff, KeyRound, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useBankrSession } from "@/components/bankr-session";
import { shortenAddress } from "@/lib/bankr";

export function ApiKeyPanel() {
  const {
    apiKey,
    setApiKey,
    authKind,
    wallet,
    walletError,
    loadingWallet,
    refreshWallet,
  } = useBankrSession();
  const [draft, setDraft] = useState<string | null>(null);
  const [show, setShow] = useState(false);
  const evm = wallet?.wallets?.find((w) => w.chain === "evm")?.address;
  const value = draft ?? apiKey;

  return (
    <section className="rounded-2xl border border-lime-400/20 bg-black/40 p-4 ring-1 ring-lime-400/10 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <KeyRound className="size-4 text-lime-300" />
            <h2 className="text-sm font-semibold">Kunci API Bankr</h2>
            {apiKey ? (
              <Badge variant="secondary" className="capitalize">
                {authKind === "partner" ? "Partner Key" : "User Key"}
              </Badge>
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground">
            Tempel kunci dari{" "}
            <a
              className="text-lime-300 underline-offset-2 hover:underline"
              href="https://bankr.bot"
              target="_blank"
              rel="noreferrer"
            >
              bankr.bot
            </a>{" "}
            atau CLI <code className="font-mono">bankr login</code>. Kunci
            disimpan di browser ini, tidak di-commit ke repo.
          </p>
          <div className="flex gap-2">
            <div className="relative min-w-0 flex-1">
              <Input
                value={value}
                onChange={(e) => setDraft(e.target.value)}
                type={show ? "text" : "password"}
                placeholder="bk_usr_… atau bk_ptr_…"
                className="pr-10 font-mono"
                autoComplete="off"
              />
              <button
                type="button"
                className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShow((s) => !s)}
                aria-label={show ? "Sembunyikan kunci" : "Tampilkan kunci"}
              >
                {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            <Button
              type="button"
              onClick={() => {
                const next = (draft ?? apiKey).trim();
                setApiKey(next);
                setDraft(null);
                toast.success(
                  next ? "Kunci API tersimpan di perangkat ini." : "Kunci API dihapus.",
                );
              }}
            >
              Simpan
            </Button>
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs lg:w-72">
          {loadingWallet ? (
            <p className="text-muted-foreground">Membaca wallet…</p>
          ) : walletError ? (
            <p className="text-destructive">{walletError}</p>
          ) : evm ? (
            <div className="space-y-1">
              <p className="text-muted-foreground">Wallet Bankr terhubung</p>
              <p className="font-mono text-sm text-lime-200">
                {shortenAddress(evm, 6)}
              </p>
              {wallet?.bankrClub?.active ? (
                <Badge>Bankr Club</Badge>
              ) : (
                <p className="text-muted-foreground">
                  Wallet harus ≥24 jam &amp; ≥0.002 ETH di rantai launch.
                </p>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground">
              Belum terhubung. Simpan kunci untuk melihat alamat wallet.
            </p>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-2"
            onClick={() => void refreshWallet()}
            disabled={!apiKey || loadingWallet}
          >
            <RefreshCw className="size-3.5" />
            Segarkan
          </Button>
        </div>
      </div>
    </section>
  );
}
