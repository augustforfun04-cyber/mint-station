"use client";

import { useMemo, useRef, useState, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { ImageIcon, Loader2 } from "lucide-react";
import { useAccount, usePublicClient, useSwitchChain, useWalletClient } from "wagmi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CHAIN_OPTIONS, chainById, explorerToken, explorerTx } from "@/lib/chains";
import { asAppChainId } from "@/lib/wagmi";
import { manualTokenAbi, manualTokenBytecode } from "@/lib/contract";
import { pushHistory } from "@/lib/history";
import { SWAP_FEE_PRESETS, defaultPairId, pairFitsChain } from "@/lib/pairs";
import { useBankrCatalog } from "@/hooks/use-bankr-catalog";
import { readSettings, resolveMediaUrl, subscribeSettings, DEFAULT_SETTINGS } from "@/lib/settings";
import {
  DEFAULT_FORM,
  computeAllocation,
  constructorArgs,
  displayAmount,
  shortenAddress,
  validateDeployForm,
  websiteHost,
  websiteHref,
  withMintPercent,
  type DeployFormState,
} from "@/lib/token";
import type { ImportedToken } from "@/lib/import-token";
import { cn } from "@/lib/utils";

const fieldClass =
  "h-11 rounded-xl border-white/10 bg-zinc-900/80 px-3 text-sm placeholder:text-zinc-500";

export function DeployForm() {
  const { address, isConnected, chainId } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const { switchChainAsync } = useSwitchChain();
  const fileRef = useRef<HTMLInputElement>(null);
  const defaults = useSyncExternalStore(
    subscribeSettings,
    readSettings,
    () => DEFAULT_SETTINGS,
  );
  const [draft, setForm] = useState<DeployFormState | null>(null);
  const form = useMemo(
    () =>
      draft ?? {
        ...DEFAULT_FORM,
        pair: defaults.pair,
        swapFee: defaults.swapFee,
        keepPercent: defaults.keepPercent,
        mintPercent: 100 - defaults.keepPercent,
        destination: defaults.claimWallet,
        feeReceiver: defaults.claimWallet,
      },
    [draft, defaults],
  );
  const bankr = useBankrCatalog(form.chainId);
  const [busy, setBusy] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [importQuery, setImportQuery] = useState("");
  const [moreLinks, setMoreLinks] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    token: string;
    tx: string;
    chainId: number;
  } | null>(null);

  const patch = (next: Partial<DeployFormState>) => setForm({ ...form, ...next });

  const alloc = useMemo(() => computeAllocation(form, address), [form, address]);
  const destPct =
    alloc.total === BigInt(0)
      ? 0
      : Number((alloc.toDestination * BigInt(1000)) / alloc.total) / 10;
  const chain = chainById(form.chainId);
  const pair = bankr.resolve(
    pairFitsChain(form.pair, form.chainId, bankr.catalog) ? form.pair : bankr.defaultId,
  );
  const previewImage = resolveMediaUrl(form.image, defaults.ipfsGateway);
  const liveForPair = bankr.launches.filter(
    (item) =>
      item.pairedStock?.symbol === pair.symbol &&
      (item.chain === "base" ? form.chainId === 8453 : item.chain === "robinhood" ? form.chainId === 4663 : false),
  );

  function setChain(nextChainId: number) {
    const nextPair = pairFitsChain(form.pair, nextChainId, bankr.catalog)
      ? form.pair
      : defaultPairId(nextChainId);
    patch({ chainId: nextChainId, pair: nextPair });
  }

  async function onPickImage(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Pilih file gambar.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => patch({ image: String(reader.result ?? "") });
    reader.readAsDataURL(file);
  }

  async function importToken() {
    setFetching(true);
    setError(null);
    try {
      const res = await fetch(`/api/import?q=${encodeURIComponent(importQuery)}`);
      const data = (await res.json()) as ImportedToken & { error?: string };
      if (!res.ok) throw new Error(data.error || "Import gagal.");
      patch({
        tokenName: data.name || form.tokenName,
        tokenSymbol: data.symbol || form.tokenSymbol,
        image: data.image || form.image,
        website: data.website || form.website,
        twitter: data.twitter || form.twitter,
        telegram: data.telegram || form.telegram,
        description: data.description || form.description,
      });
      toast.success("Metadata diisi dari Dexscreener.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Import gagal.";
      setError(msg);
      toast.error(msg);
    } finally {
      setFetching(false);
    }
  }

  async function deploy() {
    setError(null);
    const next = pairFitsChain(form.pair, form.chainId, bankr.catalog)
      ? form
      : { ...form, pair: pair.id };
    const invalid = validateDeployForm(next, address);
    if (invalid) {
      setError(invalid);
      toast.error(invalid);
      return;
    }
    if (!isConnected || !address || !walletClient || !publicClient) {
      const msg = "Hubungkan wallet dulu.";
      setError(msg);
      toast.error(msg);
      return;
    }
    setBusy(true);
    try {
      if (chainId !== next.chainId) {
        await switchChainAsync({ chainId: asAppChainId(next.chainId) });
      }
      const args = constructorArgs(next, address);
      const hash = await walletClient.deployContract({
        abi: manualTokenAbi,
        bytecode: manualTokenBytecode,
        args: [...args],
        account: address,
        chain: chain.chain,
      });
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      const token = receipt.contractAddress;
      if (!token) throw new Error("Alamat kontrak kosong.");
      setResult({ token, tx: hash, chainId: next.chainId });
      pushHistory({
        savedAt: Date.now(),
        chainId: next.chainId,
        tokenName: next.tokenName.trim(),
        tokenSymbol: next.tokenSymbol.trim().toUpperCase(),
        tokenAddress: token,
        txHash: hash,
        destination: next.destination.trim(),
        mintedToDestination: displayAmount(alloc.toDestination, next.decimals),
        totalSupply: next.totalSupply,
        website: next.website.trim(),
        launcher: address,
        pair: pair.id,
        swapFee: next.swapFee,
        keepPercent: next.keepPercent,
        feeReceiver: next.feeReceiver.trim() || address,
      });
      toast.success("Token launched.");
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Launch gagal. Cek gas dan jaringan.";
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  const cryptoPairs = bankr.pairs.filter((p) => p.kind === "crypto");
  const stockPairs = bankr.pairs.filter((p) => p.kind === "stock");

  return (
    <div className="grid items-start gap-10 md:grid-cols-[minmax(0,1fr)_320px]">
      <div className="max-w-xl space-y-6">
        <div className="flex gap-2">
          <Input
            className={fieldClass}
            value={importQuery}
            onChange={(e) => setImportQuery(e.target.value)}
            placeholder="CA, Solana mint, or Dexscreener URL"
          />
          <Button
            type="button"
            variant="secondary"
            className="h-11 rounded-xl"
            disabled={fetching}
            onClick={() => void importToken()}
          >
            {fetching ? <Loader2 className="animate-spin" /> : "Fetch"}
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1.5">
            <span className="text-sm text-zinc-400">Name</span>
            <Input
              className={fieldClass}
              value={form.tokenName}
              onChange={(e) => patch({ tokenName: e.target.value })}
              placeholder="Token name"
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-sm text-zinc-400">Ticker</span>
            <Input
              className={`${fieldClass} uppercase`}
              value={form.tokenSymbol}
              onChange={(e) => patch({ tokenSymbol: e.target.value.toUpperCase() })}
              placeholder="SYMBOL"
              maxLength={16}
            />
          </label>
        </div>

        <label className="block space-y-1.5">
          <span className="text-sm text-zinc-400">Description</span>
          <Textarea
            className="min-h-24 rounded-xl border-white/10 bg-zinc-900/80 placeholder:text-zinc-500"
            value={form.description}
            onChange={(e) => patch({ description: e.target.value })}
            placeholder="short description of the token."
          />
        </label>

        <div className="space-y-1.5">
          <span className="text-sm text-zinc-400">Token image</span>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex min-h-32 w-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/15 bg-zinc-900/40 text-sm text-zinc-400 hover:border-white/25"
          >
            {previewImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewImage} alt="" className="h-24 w-24 rounded-2xl object-cover" />
            ) : (
              <>
                <ImageIcon className="size-8 opacity-50" />
                <span>Choose image.</span>
              </>
            )}
          </button>
          <Input
            className={fieldClass}
            value={form.image.startsWith("data:") ? "" : form.image}
            onChange={(e) => patch({ image: e.target.value })}
            placeholder="ipfs://… or https://…"
          />
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => void onPickImage(e.target.files?.[0])}
          />
        </div>

        <label className="block space-y-1.5">
          <span className="text-sm text-zinc-400">Website</span>
          <Input
            className={fieldClass}
            value={form.website}
            onChange={(e) => patch({ website: e.target.value })}
            placeholder="URL"
            inputMode="url"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1.5">
            <span className="text-sm text-zinc-400">X profile</span>
            <Input
              className={fieldClass}
              value={form.twitter}
              onChange={(e) => patch({ twitter: e.target.value })}
              placeholder="x.com/handle"
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-sm text-zinc-400">Telegram</span>
            <Input
              className={fieldClass}
              value={form.telegram}
              onChange={(e) => patch({ telegram: e.target.value })}
              placeholder="t.me/community"
            />
          </label>
        </div>

        <button
          type="button"
          className="text-xs text-zinc-400 hover:text-white"
          onClick={() => setMoreLinks((v) => !v)}
        >
          {moreLinks ? "Fewer links" : "More links"}
        </button>
        {moreLinks ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5">
              <span className="text-sm text-zinc-400">Discord</span>
              <Input
                className={fieldClass}
                value={form.discord}
                onChange={(e) => patch({ discord: e.target.value })}
                placeholder="https://"
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-sm text-zinc-400">Farcaster</span>
              <Input
                className={fieldClass}
                value={form.farcaster}
                onChange={(e) => patch({ farcaster: e.target.value })}
                placeholder="https://"
              />
            </label>
            <label className="space-y-1.5 sm:col-span-2">
              <span className="text-sm text-zinc-400">Docs</span>
              <Input
                className={fieldClass}
                value={form.docs}
                onChange={(e) => patch({ docs: e.target.value })}
                placeholder="https://"
              />
            </label>
          </div>
        ) : null}

        <label className="block space-y-1.5">
          <span className="text-sm text-zinc-400">Chain</span>
          <Select value={String(form.chainId)} onValueChange={(value) => setChain(Number(value))}>
            <SelectTrigger className="h-11 w-full rounded-xl border-white/10 bg-zinc-900/80">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CHAIN_OPTIONS.map((option) => (
                <SelectItem key={option.id} value={String(option.id)}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-zinc-500">
            Paired with {pair.symbol}. Gas dibayar dari wallet yang terhubung
            {pair.kind === "stock"
              ? ". Saham tokenized Bankr (B20 di Base, saham Robinhood di Robinhood Chain)."
              : ""}
          </p>
        </label>

        <div className="space-y-2">
          <span className="text-sm text-zinc-400">Pair</span>
          <div className="flex flex-wrap gap-2">
            {bankr.featured.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => patch({ pair: option.id })}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs",
                  pair.id === option.id
                    ? "border-white bg-white text-black"
                    : "border-white/15 text-zinc-300 hover:border-white/30",
                )}
              >
                {option.label}
                {option.live ? (
                  <span
                    className={cn(
                      "ml-1 text-[10px]",
                      pair.id === option.id ? "text-zinc-500" : "text-lime-400",
                    )}
                  >
                    live
                  </span>
                ) : null}
              </button>
            ))}
            <Select value={pair.id} onValueChange={(value) => patch({ pair: value })}>
              <SelectTrigger className="h-8 w-auto rounded-full border-white/15 px-3 text-xs">
                <SelectValue placeholder="Semua" />
              </SelectTrigger>
              <SelectContent>
                {cryptoPairs.length ? (
                  <SelectGroup>
                    <SelectLabel>Quote Bankr</SelectLabel>
                    {cryptoPairs.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.label} · {option.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ) : null}
                {stockPairs.length ? (
                  <SelectGroup>
                    <SelectLabel>Saham Bankr</SelectLabel>
                    {stockPairs.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.label}
                        {option.live ? " · live" : ""} · {option.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ) : null}
              </SelectContent>
            </Select>
          </div>
          {bankr.error ? (
            <p className="text-xs text-zinc-500">Menu saham memakai daftar Bankr docs. Live feed sedang offline.</p>
          ) : liveForPair.length ? (
            <p className="text-xs text-zinc-500">
              {liveForPair.length} launch Bankr sudah pakai pair {pair.symbol} di chain ini.
            </p>
          ) : pair.kind === "stock" ? (
            <p className="text-xs text-zinc-500">
              Pair ini ada di registry Bankr. Belum ada deploy live dengan ticker ini di 50 launch terakhir.
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <span className="text-sm text-zinc-400">Swap fee</span>
          <div className="flex flex-wrap gap-2">
            {SWAP_FEE_PRESETS.map((fee) => (
              <button
                key={fee}
                type="button"
                onClick={() => patch({ swapFee: fee })}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs",
                  form.swapFee === fee
                    ? "border-white bg-white text-black"
                    : "border-white/15 text-zinc-300 hover:border-white/30",
                )}
              >
                {fee}%
              </button>
            ))}
            <Input
              className="h-8 w-16 rounded-full border-white/15 bg-zinc-900/80 px-2 text-xs"
              value={String(form.swapFee)}
              onChange={(e) => patch({ swapFee: Number(e.target.value) || 0 })}
              inputMode="decimal"
            />
          </div>
          <p className="text-xs text-zinc-500">
            Catatan untuk LP. Bankr Doppler memakai 0.7% pool fee (95% ke creator). Token ini tidak
            memotong fee on-chain.
          </p>
        </div>

        <div className="space-y-3">
          <span className="text-sm text-zinc-400">Mint supply ke wallet tujuan</span>
          <Input
            className={`${fieldClass} font-mono`}
            value={form.destination}
            onChange={(e) => patch({ destination: e.target.value })}
            placeholder="0x..."
          />
          <Slider
            value={[form.mintPercent]}
            min={0}
            max={100}
            step={1}
            onValueChange={(value) => setForm(withMintPercent(form, value[0] ?? 0))}
          />
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="text-lime-300">{form.mintPercent}% ke tujuan</span>
            <span>
              {displayAmount(alloc.toDestination, form.decimals)} / {form.totalSupply || "0"}
            </span>
          </div>
          <p className="text-xs text-zinc-500">
            Sisa {form.keepPercent}% masuk wallet deployer
          </p>
        </div>

        <Accordion type="single" collapsible>
          <AccordionItem value="advanced">
            <AccordionTrigger className="text-sm text-zinc-300">Advanced</AccordionTrigger>
            <AccordionContent>
              <div className="grid gap-3 pt-1">
                <label className="space-y-1.5">
                  <span className="text-sm text-zinc-400">Total supply</span>
                  <Input
                    className={fieldClass}
                    value={form.totalSupply}
                    onChange={(e) => {
                      const totalSupply = e.target.value;
                      patch({ totalSupply, maxSupply: totalSupply });
                    }}
                    inputMode="decimal"
                  />
                </label>
                <label className="space-y-1.5">
                  <span className="text-sm text-zinc-400">Fee receiver</span>
                  <Input
                    className={`${fieldClass} font-mono`}
                    value={form.feeReceiver}
                    onChange={(e) => patch({ feeReceiver: e.target.value })}
                    placeholder={address || "0x…"}
                  />
                </label>
                <label className="flex items-center justify-between rounded-xl border border-white/10 px-3 py-2 text-sm">
                  Mintable setelah launch
                  <Switch
                    checked={form.mintable}
                    onCheckedChange={(checked) => patch({ mintable: checked })}
                  />
                </label>
                <label className="flex items-center justify-between rounded-xl border border-white/10 px-3 py-2 text-sm">
                  Burnable
                  <Switch
                    checked={form.burnable}
                    onCheckedChange={(checked) => patch({ burnable: checked })}
                  />
                </label>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {error ? <p className="text-sm text-red-400">{error}</p> : null}

        <Button
          type="button"
          size="lg"
          className="h-12 w-full rounded-full bg-white text-black hover:bg-zinc-200"
          disabled={busy}
          onClick={() => void deploy()}
        >
          {busy ? <Loader2 className="animate-spin" /> : null}
          Launch token
        </Button>
      </div>

      <aside className="lg:sticky lg:top-24">
        <div className="rounded-3xl border border-white/10 bg-zinc-950 p-5">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center overflow-hidden rounded-2xl bg-zinc-800">
              {previewImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewImage} alt="" className="size-full object-cover" />
              ) : (
                <ImageIcon className="size-5 text-zinc-500" />
              )}
            </div>
            <div>
              <p className="font-medium">{form.tokenName || "Your token"}</p>
              <p className="text-sm text-zinc-500">{form.tokenSymbol || "ticker"}</p>
            </div>
          </div>
          <dl className="mt-5 space-y-3 text-sm">
            <Row label="Chain" value={chain.short} />
            <Row label="Paired with" value={pair.symbol} />
            <Row label="Supply" value={form.totalSupply} />
            <Row
              label="Mint to"
              value={
                destPct > 0
                  ? `${Math.round(destPct)}% ${shortenAddress(form.destination, 3) || "—"}`
                  : "0% —"
              }
            />
            <Row label="Remainder" value={`${form.keepPercent}% deployer`} />
            <Row label="Swap fee" value={`${form.swapFee}%`} />
            {form.website.trim() ? (
              <div className="flex items-center justify-between gap-3">
                <dt className="text-zinc-500">Website</dt>
                <dd className="text-right">
                  <a
                    className="text-zinc-200 hover:underline"
                    href={websiteHref(form.website)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {websiteHost(form.website)}
                  </a>
                </dd>
              </div>
            ) : null}
            <Row label="Launch" value="network gas" />
          </dl>
          {result ? (
            <div className="mt-5 border-t border-white/10 pt-4 text-xs">
              <a
                className="block font-mono text-lime-300 hover:underline"
                href={explorerToken(result.chainId, result.token)}
                target="_blank"
                rel="noreferrer"
              >
                {shortenAddress(result.token, 6)}
              </a>
              <a
                className="mt-1 block text-zinc-500 hover:underline"
                href={explorerTx(result.chainId, result.tx)}
                target="_blank"
                rel="noreferrer"
              >
                View transaction
              </a>
            </div>
          ) : null}
        </div>
      </aside>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-zinc-500">{label}</dt>
      <dd className="text-right text-zinc-200">{value}</dd>
    </div>
  );
}
