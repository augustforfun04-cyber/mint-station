"use client";

import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { ImageIcon, Loader2 } from "lucide-react";
import { useAccount, usePublicClient, useSwitchChain, useWalletClient } from "wagmi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CHAIN_OPTIONS, chainById, explorerToken, explorerTx } from "@/lib/chains";
import { asAppChainId } from "@/lib/wagmi";
import { manualTokenAbi, manualTokenBytecode } from "@/lib/contract";
import { pushHistory } from "@/lib/history";
import {
  DEFAULT_FORM,
  computeAllocation,
  constructorArgs,
  displayAmount,
  shortenAddress,
  validateDeployForm,
  websiteHost,
  websiteHref,
  type DeployFormState,
} from "@/lib/token";

const fieldClass =
  "h-11 rounded-xl border-white/10 bg-zinc-900/80 px-3 text-sm placeholder:text-zinc-500";

export function DeployForm() {
  const { address, isConnected, chainId } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const { switchChainAsync } = useSwitchChain();
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<DeployFormState>(DEFAULT_FORM);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    token: string;
    tx: string;
    chainId: number;
  } | null>(null);

  const patch = (next: Partial<DeployFormState>) =>
    setForm((prev) => ({ ...prev, ...next }));

  const alloc = useMemo(() => computeAllocation(form, address), [form, address]);
  const destPct =
    alloc.total === BigInt(0)
      ? 0
      : Number((alloc.toDestination * BigInt(1000)) / alloc.total) / 10;
  const chain = chainById(form.chainId);

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

  async function deploy() {
    setError(null);
    const invalid = validateDeployForm(form, address);
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
      if (chainId !== form.chainId) {
        await switchChainAsync({ chainId: asAppChainId(form.chainId) });
      }
      const args = constructorArgs(form, address);
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
      setResult({ token, tx: hash, chainId: form.chainId });
      pushHistory({
        savedAt: Date.now(),
        chainId: form.chainId,
        tokenName: form.tokenName.trim(),
        tokenSymbol: form.tokenSymbol.trim().toUpperCase(),
        tokenAddress: token,
        txHash: hash,
        destination: form.destination.trim(),
        mintedToDestination: displayAmount(alloc.toDestination, form.decimals),
        totalSupply: form.totalSupply,
        website: form.website.trim(),
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

  return (
    <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="max-w-xl space-y-6">
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
              placeholder="symbol"
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
            placeholder="A short description of the token."
          />
        </label>

        <div className="space-y-1.5">
          <span className="text-sm text-zinc-400">Token image</span>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex min-h-36 w-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/15 bg-zinc-900/40 text-sm text-zinc-400 hover:border-white/25"
          >
            {form.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={form.image}
                alt=""
                className="h-28 w-28 rounded-2xl object-cover"
              />
            ) : (
              <>
                <ImageIcon className="size-8 opacity-50" />
                <span className="rounded-full border border-white/15 px-3 py-1 text-xs">
                  Choose image
                </span>
              </>
            )}
          </button>
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
            placeholder="https://…"
            inputMode="url"
            autoComplete="url"
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

        <label className="block space-y-1.5">
          <span className="text-sm text-zinc-400">Chain</span>
          <Select
            value={String(form.chainId)}
            onValueChange={(value) => patch({ chainId: Number(value) })}
          >
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
            Paired with {chain.native}. Gas dibayar dari wallet yang terhubung.
          </p>
        </label>

        <div className="space-y-3">
          <span className="text-sm text-zinc-400">Mint supply ke wallet tujuan</span>
          <Input
            className={`${fieldClass} font-mono`}
            value={form.destination}
            onChange={(e) => patch({ destination: e.target.value })}
            placeholder="0x…"
          />
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>{form.mintPercent}% ke tujuan</span>
            <span>
              {displayAmount(alloc.toDestination, form.decimals)} / {form.totalSupply}
            </span>
          </div>
          <Slider
            min={0}
            max={100}
            step={1}
            value={[form.mintPercent]}
            onValueChange={(value) =>
              patch({ mintMode: "percent", mintPercent: value[0] ?? 0 })
            }
          />
          <p className="text-xs text-zinc-500">
            Sisa {100 - form.mintPercent}% masuk wallet deployer.
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
              {form.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.image} alt="" className="size-full object-cover" />
              ) : (
                <ImageIcon className="size-5 text-zinc-500" />
              )}
            </div>
            <div>
              <p className="font-medium">{form.tokenName || "Your token"}</p>
              <p className="text-sm text-zinc-500">
                {form.tokenSymbol || "ticker"}
              </p>
            </div>
          </div>
          <dl className="mt-5 space-y-3 text-sm">
            <Row label="Chain" value={chain.short} />
            <Row label="Paired with" value={chain.native} />
            <Row label="Supply" value={form.totalSupply} />
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
            <Row
              label="Mint to"
              value={
                destPct > 0
                  ? `${destPct}% ${shortenAddress(form.destination, 3)}`
                  : "deployer only"
              }
            />
            <Row label="Remainder" value={`${Math.round((100 - destPct) * 10) / 10}% deployer`} />
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
