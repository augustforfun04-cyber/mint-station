"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { FlaskConical, Loader2, Rocket } from "lucide-react";
import { ApiKeyPanel } from "@/components/api-key-panel";
import { MintDestination } from "@/components/mint-destination";
import { LaunchResult } from "@/components/launch-result";
import { useBankrSession } from "@/components/bankr-session";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  CHAINS,
  DEFAULT_FORM,
  QUOTE_TOKENS,
  buildDeployPayload,
  validateDeployForm,
  type DeployFormState,
  type DeployResult,
  type LaunchChain,
  type QuoteToken,
} from "@/lib/bankr";

const HISTORY_KEY = "bankr.deploy.history";

export function DeployForm() {
  const { apiKey, authKind, authHeaders } = useBankrSession();
  const [form, setForm] = useState<DeployFormState>(DEFAULT_FORM);
  const [busy, setBusy] = useState<"simulate" | "deploy" | null>(null);
  const [result, setResult] = useState<DeployResult | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  const patch = (next: Partial<DeployFormState>) =>
    setForm((prev) => ({ ...prev, ...next }));

  const partnerMode = authKind === "partner";
  const quoteOptions = useMemo(
    () =>
      (Object.entries(QUOTE_TOKENS) as [QuoteToken, (typeof QUOTE_TOKENS)[QuoteToken]][])
        .filter(([, meta]) => meta.chains.includes(form.chain)),
    [form.chain],
  );

  async function submit(simulateOnly: boolean) {
    setLastError(null);
    if (!apiKey) {
      const msg = "Simpan Bankr API key dulu.";
      setLastError(msg);
      toast.error(msg);
      return;
    }
    const invalid = validateDeployForm(form, authKind);
    if (invalid) {
      setLastError(invalid);
      toast.error(invalid);
      return;
    }
    const payload = buildDeployPayload(form, { simulateOnly, authKind });
    setBusy(simulateOnly ? "simulate" : "deploy");
    try {
      const res = await fetch("/api/bankr/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as DeployResult & {
        message?: string;
        error?: string;
      };
      if (!res.ok) {
        const msg =
          data.error ||
          data.message ||
          `Deploy gagal (${res.status}). Cek kuota, saldo ETH, atau umur wallet.`;
        setLastError(msg);
        toast.error(msg);
        return;
      }
      const next: DeployResult = {
        ...data,
        simulated: simulateOnly || res.status === 200,
        chain: data.chain || form.chain,
        success: data.success !== false,
      };
      setResult(next);
      if (!simulateOnly && next.tokenAddress) {
        persistHistory({
          ...next,
          tokenName: form.tokenName,
          tokenSymbol: form.tokenSymbol,
          mintedTo: form.mintToDestination ? form.destinationValue : "",
        });
      }
      toast.success(
        simulateOnly
          ? "Simulasi berhasil. Belum ada transaksi on-chain."
          : "Token berhasil di-deploy.",
      );
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : "Gagal menghubungi Bankr.";
      setLastError(msg);
      toast.error(msg);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      <ApiKeyPanel />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          <section className="rounded-2xl border border-white/10 bg-black/30 p-4 sm:p-5">
            <h3 className="font-heading text-base font-semibold">Identitas token</h3>
            <p className="mt-1 mb-4 text-sm text-muted-foreground">
              Supply tetap 100 miliar, tidak mintable setelah launch. Pool
              Uniswap V4 dibuat otomatis lewat Doppler.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel>Nama token</FieldLabel>
                <Input
                  value={form.tokenName}
                  onChange={(e) => patch({ tokenName: e.target.value })}
                  placeholder="My Agent"
                  maxLength={100}
                />
              </Field>
              <Field>
                <FieldLabel>Simbol</FieldLabel>
                <Input
                  value={form.tokenSymbol}
                  onChange={(e) =>
                    patch({ tokenSymbol: e.target.value.toUpperCase() })
                  }
                  placeholder="AGENT"
                  maxLength={20}
                  className="font-mono uppercase"
                />
                <FieldDescription>Opsional. Maks 20 karakter.</FieldDescription>
              </Field>
              <Field className="sm:col-span-2">
                <FieldLabel>Deskripsi</FieldLabel>
                <Textarea
                  value={form.description}
                  onChange={(e) => patch({ description: e.target.value })}
                  placeholder="Token agent yang membiayai compute dari trading fee."
                  rows={3}
                />
              </Field>
              <Field>
                <FieldLabel>URL logo</FieldLabel>
                <Input
                  value={form.image}
                  onChange={(e) => patch({ image: e.target.value })}
                  placeholder="https://…"
                />
              </Field>
              <Field>
                <FieldLabel>Website</FieldLabel>
                <Input
                  value={form.websiteUrl}
                  onChange={(e) => patch({ websiteUrl: e.target.value })}
                  placeholder="https://…"
                />
              </Field>
              <Field className="sm:col-span-2">
                <FieldLabel>Tweet bukti sosial</FieldLabel>
                <Input
                  value={form.tweetUrl}
                  onChange={(e) => patch({ tweetUrl: e.target.value })}
                  placeholder="https://x.com/user/status/…"
                />
              </Field>
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-black/30 p-4 sm:p-5">
            <h3 className="font-heading text-base font-semibold">Rantai & opsi launch</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel>Chain</FieldLabel>
                <Select
                  value={form.chain}
                  onValueChange={(value) => {
                    const chain = value as LaunchChain;
                    patch({
                      chain,
                      quoteToken: chain === "base" ? form.quoteToken : "weth",
                    });
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CHAINS.map((chain) => (
                      <SelectItem
                        key={chain.id}
                        value={chain.id}
                        disabled={partnerMode && chain.id !== "base"}
                      >
                        {chain.label}
                        {chain.sponsored ? " · gas disponsori" : " · gas sendiri"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldDescription>
                  Form web default Base. API Bankr default Robinhood jika chain
                  tidak dikirim — di sini chain selalu eksplisit.
                </FieldDescription>
              </Field>
              <Field>
                <FieldLabel>Quote token</FieldLabel>
                <Select
                  value={form.quoteToken}
                  onValueChange={(value) =>
                    patch({ quoteToken: value as QuoteToken })
                  }
                  disabled={partnerMode || form.chain !== "base"}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {quoteOptions.map(([id, meta]) => (
                      <SelectItem key={id} value={id}>
                        {meta.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldDescription>
                  BNKR, ba3Pump, cbHYPE, cbZEC, TAO hanya untuk User Key di Base.
                </FieldDescription>
              </Field>
              <label className="flex items-center justify-between gap-3 rounded-xl border border-white/10 px-3 py-2">
                <span>
                  <span className="block text-sm font-medium">Quote-only fees</span>
                  <span className="text-xs text-muted-foreground">
                    Fee creator 100% dalam quote token. Take-nya sama.
                  </span>
                </span>
                <Switch
                  checked={form.quoteOnlyFees}
                  onCheckedChange={(checked) => patch({ quoteOnlyFees: checked })}
                />
              </label>
              <label className="flex items-center justify-between gap-3 rounded-xl border border-white/10 px-3 py-2">
                <span>
                  <span className="block text-sm font-medium">Degen mode</span>
                  <span className="text-xs text-muted-foreground">
                    Mulai di market cap $2.500. Tidak untuk Partner Key.
                  </span>
                </span>
                <Switch
                  checked={form.degenMode && !partnerMode}
                  disabled={partnerMode}
                  onCheckedChange={(checked) => patch({ degenMode: checked })}
                />
              </label>
            </div>
          </section>

          <MintDestination
            form={form}
            onChange={patch}
            partnerMode={partnerMode}
          />

          {lastError ? (
            <Alert variant="destructive">
              <AlertTitle>Deploy ditolak</AlertTitle>
              <AlertDescription>{lastError}</AlertDescription>
            </Alert>
          ) : null}

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="flex-1"
              disabled={busy !== null}
              onClick={() => void submit(true)}
            >
              {busy === "simulate" ? (
                <Loader2 className="animate-spin" />
              ) : (
                <FlaskConical />
              )}
              Simulasikan dulu
            </Button>
            <Button
              type="button"
              size="lg"
              className="flex-1 bg-lime-400 text-black hover:bg-lime-300"
              disabled={busy !== null}
              onClick={() => void submit(false)}
            >
              {busy === "deploy" ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Rocket />
              )}
              Deploy token
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Kuota: 3 percobaan terhitung / 24 jam per wallet Bankr, jarak
            minimal 1 menit. Simulasi tidak memakai kuota. Setelah metadata
            pinning, percobaan tetap terhitung meski gagal di langkah berikutnya.
          </p>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <LaunchPreview form={form} partnerMode={partnerMode} />
          <LaunchResult result={result} />
        </aside>
      </div>
    </div>
  );
}

function LaunchPreview({
  form,
  partnerMode,
}: {
  form: DeployFormState;
  partnerMode: boolean;
}) {
  const chain = CHAINS.find((c) => c.id === form.chain);
  const mintOn = form.mintToDestination && !partnerMode;

  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
      <p className="text-xs font-medium tracking-wide text-lime-200/80 uppercase">
        Ringkasan
      </p>
      <h4 className="mt-1 text-lg font-semibold">
        {form.tokenName || "Nama token"}{" "}
        <span className="font-mono text-sm text-muted-foreground">
          ${form.tokenSymbol || "TICKER"}
        </span>
      </h4>
      <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
        <li>Rantai: {chain?.label}</li>
        <li>Quote: {QUOTE_TOKENS[form.quoteToken].label}</li>
        <li>
          Mint:{" "}
          {mintOn
            ? `15% ke ${form.destinationValue || "wallet tujuan"}`
            : "mati — 100% ke pool"}
        </li>
        <li>Degen: {form.degenMode && !partnerMode ? "ya ($2.500)" : "tidak"}</li>
        <li>Fee: {form.quoteOnlyFees ? "quote-only" : "token + quote"}</li>
      </ul>
    </div>
  );
}

function persistHistory(entry: Record<string, unknown>) {
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    const list = raw ? (JSON.parse(raw) as unknown[]) : [];
    const next = [{ ...entry, savedAt: Date.now() }, ...list].slice(0, 20);
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  } catch {
    /* ignore quota */
  }
}
