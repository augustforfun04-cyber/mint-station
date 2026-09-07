"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2, Rocket } from "lucide-react";
import { useAccount, usePublicClient, useWalletClient, useSwitchChain } from "wagmi";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CHAIN_OPTIONS, chainById, explorerToken, explorerTx } from "@/lib/chains";
import { asAppChainId } from "@/lib/wagmi";
import { manualTokenAbi, manualTokenBytecode } from "@/lib/contract";
import { pushHistory } from "@/lib/history";
import {
  DEFAULT_FORM,
  PRESETS,
  applyPreset,
  computeAllocation,
  constructorArgs,
  displayAmount,
  validateDeployForm,
  type DeployFormState,
  type MintMode,
  type RemainderTarget,
  type TokenPreset,
} from "@/lib/token";

export function DeployForm() {
  const { address, isConnected, chainId } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const { switchChainAsync } = useSwitchChain();
  const [form, setForm] = useState<DeployFormState>(DEFAULT_FORM);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    token: string;
    tx: string;
    chainId: number;
  } | null>(null);

  const patch = (next: Partial<DeployFormState>) =>
    setForm((prev) => ({ ...prev, ...next, preset: "custom" }));

  const alloc = useMemo(
    () => computeAllocation(form, address),
    [form, address],
  );

  async function deploy() {
    setError(null);
    const invalid = validateDeployForm(form, address);
    if (invalid) {
      setError(invalid);
      toast.error(invalid);
      return;
    }
    if (!isConnected || !address || !walletClient || !publicClient) {
      const msg = "Hubungkan wallet dulu. Tidak ada API pihak ketiga.";
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
        chain: chainById(form.chainId).chain,
      });
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      const token = receipt.contractAddress;
      if (!token) throw new Error("Deploy sukses tapi alamat kontrak kosong.");
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
      });
      toast.success("Token ter-deploy. Supply sudah di-mint sesuai form.");
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Deploy gagal. Cek gas dan jaringan.";
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  const destPct =
    alloc.total === BigInt(0) ? 0 : Number((alloc.toDestination * BigInt(1000)) / alloc.total) / 10;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="space-y-5">
        <section className="rounded-2xl border border-white/10 bg-black/30 p-4 sm:p-5">
          <h3 className="font-heading text-base font-semibold">Preset (semua tetap bisa diubah)</h3>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {(Object.keys(PRESETS) as Exclude<TokenPreset, "custom">[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setForm((prev) => applyPreset(prev, key))}
                className={`rounded-xl border px-3 py-2 text-left text-sm transition-colors ${
                  form.preset === key
                    ? "border-lime-400 bg-lime-400/10"
                    : "border-white/10 hover:bg-white/5"
                }`}
              >
                <span className="block font-medium">{PRESETS[key].label}</span>
                <span className="text-xs text-muted-foreground">{PRESETS[key].blurb}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-black/30 p-4 sm:p-5">
          <h3 className="font-heading text-base font-semibold">Identitas & rantai</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel>Nama</FieldLabel>
              <Input
                value={form.tokenName}
                onChange={(e) => patch({ tokenName: e.target.value })}
                placeholder="Manual Coin"
              />
            </Field>
            <Field>
              <FieldLabel>Simbol</FieldLabel>
              <Input
                value={form.tokenSymbol}
                onChange={(e) =>
                  patch({ tokenSymbol: e.target.value.toUpperCase() })
                }
                placeholder="MNL"
                className="font-mono uppercase"
              />
            </Field>
            <Field className="sm:col-span-2">
              <FieldLabel>Deskripsi (opsional, off-chain)</FieldLabel>
              <Textarea
                value={form.description}
                onChange={(e) => patch({ description: e.target.value })}
                placeholder="Catatan untuk kamu sendiri — tidak ditulis ke kontrak."
                rows={2}
              />
            </Field>
            <Field>
              <FieldLabel>Chain</FieldLabel>
              <Select
                value={String(form.chainId)}
                onValueChange={(value) => patch({ chainId: Number(value) })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CHAIN_OPTIONS.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.label}
                      {c.testnet ? " · testnet" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldDescription>
                Base paling umum untuk token baru. Base Sepolia untuk tes tanpa mainnet gas.
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel>Desimal</FieldLabel>
              <Select
                value={String(form.decimals)}
                onValueChange={(value) => patch({ decimals: Number(value) })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[18, 9, 8, 6, 0].map((d) => (
                    <SelectItem key={d} value={String(d)}>
                      {d}
                      {d === 18 ? " · ERC-20 standar" : d === 6 ? " · ala USDC" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-black/30 p-4 sm:p-5">
          <h3 className="font-heading text-base font-semibold">Supply manual</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel>Total supply awal</FieldLabel>
              <Input
                value={form.totalSupply}
                onChange={(e) => {
                  const totalSupply = e.target.value;
                  patch({
                    totalSupply,
                    maxSupply: form.capMaxSupply && form.preset !== "utility"
                      ? totalSupply
                      : form.maxSupply,
                  });
                }}
                inputMode="decimal"
                placeholder="1000000000"
              />
              <FieldDescription>Angka manusia, bukan wei. Contoh: 1000000000</FieldDescription>
            </Field>
            <Field>
              <FieldLabel>Max supply</FieldLabel>
              <Input
                value={form.maxSupply}
                onChange={(e) => patch({ maxSupply: e.target.value, capMaxSupply: true })}
                disabled={!form.capMaxSupply}
                inputMode="decimal"
              />
              <label className="mt-2 flex items-center gap-2 text-xs">
                <Switch
                  checked={form.capMaxSupply}
                  onCheckedChange={(checked) => patch({ capMaxSupply: checked })}
                />
                Cap max supply (0 di kontrak = tanpa batas jika mintable)
              </label>
            </Field>
            <label className="flex items-center justify-between gap-3 rounded-xl border border-white/10 px-3 py-2">
              <span>
                <span className="block text-sm font-medium">Mintable setelah deploy</span>
                <span className="text-xs text-muted-foreground">
                  Owner bisa mint lagi ke wallet mana pun lewat menu Mint.
                </span>
              </span>
              <Switch
                checked={form.mintable}
                onCheckedChange={(checked) => patch({ mintable: checked })}
              />
            </label>
            <label className="flex items-center justify-between gap-3 rounded-xl border border-white/10 px-3 py-2">
              <span>
                <span className="block text-sm font-medium">Burnable</span>
                <span className="text-xs text-muted-foreground">
                  Pemegang bisa burn token miliknya.
                </span>
              </span>
              <Switch
                checked={form.burnable}
                onCheckedChange={(checked) => patch({ burnable: checked })}
              />
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-lime-400/40 bg-lime-400/5 p-4 sm:p-5">
          <h3 className="font-heading text-base font-semibold">
            Mint supply ke wallet tujuan
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Kamu tentukan sendiri berapa yang di-mint ke alamat tujuan — persen
            atau jumlah exact. Bukan 15% tetap.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel>Cara isi</FieldLabel>
              <Select
                value={form.mintMode}
                onValueChange={(value) => patch({ mintMode: value as MintMode })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percent">Persen dari total supply</SelectItem>
                  <SelectItem value="amount">Jumlah exact</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            {form.mintMode === "percent" ? (
              <Field>
                <FieldLabel>Persen ke tujuan ({form.mintPercent}%)</FieldLabel>
                <Slider
                  min={0}
                  max={100}
                  step={1}
                  value={[form.mintPercent]}
                  onValueChange={(value) => patch({ mintPercent: value[0] ?? 0 })}
                />
              </Field>
            ) : (
              <Field>
                <FieldLabel>Jumlah mint</FieldLabel>
                <Input
                  value={form.mintAmount}
                  onChange={(e) => patch({ mintAmount: e.target.value })}
                  placeholder="250000000"
                  inputMode="decimal"
                />
              </Field>
            )}
            <Field className="sm:col-span-2">
              <FieldLabel>Wallet yang dituju</FieldLabel>
              <Input
                value={form.destination}
                onChange={(e) => patch({ destination: e.target.value })}
                placeholder="0x…"
                className="font-mono"
              />
              <FieldDescription>
                {displayAmount(alloc.toDestination, form.decimals)} token ({destPct}%)
                akan masuk wallet ini saat kontrak dibuat.
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel>Sisa supply</FieldLabel>
              <Select
                value={form.remainderTarget}
                onValueChange={(value) =>
                  patch({ remainderTarget: value as RemainderTarget })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="deployer">Wallet deployer (untuk LP)</SelectItem>
                  <SelectItem value="custom">Wallet lain</SelectItem>
                  <SelectItem value="dead">Burn (0x…dEaD)</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            {form.remainderTarget === "custom" ? (
              <Field>
                <FieldLabel>Wallet sisa</FieldLabel>
                <Input
                  value={form.remainderWallet}
                  onChange={(e) => patch({ remainderWallet: e.target.value })}
                  placeholder="0x…"
                  className="font-mono"
                />
              </Field>
            ) : (
              <p className="self-end text-xs text-muted-foreground">
                Sisa {displayAmount(alloc.toRemainder, form.decimals)} token.
              </p>
            )}
          </div>
          <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-black/40">
            <div
              className="h-full bg-emerald-600"
              style={{ width: `${Math.min(100, destPct)}%` }}
            />
            <div
              className="h-full bg-lime-400"
              style={{ width: `${Math.max(0, 100 - destPct)}%` }}
            />
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 text-xs">
            <span>
              <span className="mr-1 inline-block size-2 rounded-full bg-emerald-600" />
              Tujuan · {destPct}%
            </span>
            <span>
              <span className="mr-1 inline-block size-2 rounded-full bg-lime-400" />
              Sisa · {Math.round((100 - destPct) * 10) / 10}%
            </span>
          </div>
        </section>

        {error ? (
          <Alert variant="destructive">
            <AlertTitle>Belum bisa deploy</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <Button
          type="button"
          size="lg"
          className="w-full bg-lime-400 text-black hover:bg-lime-300"
          disabled={busy}
          onClick={() => void deploy()}
        >
          {busy ? <Loader2 className="animate-spin" /> : <Rocket />}
          Deploy & mint sekarang
        </Button>
        <p className="text-xs text-muted-foreground">
          Transaksi ditandatangani wallet kamu. Gas native di chain yang dipilih
          wajib ada. Tidak memakai Bankr API, partner key, atau server pihak ketiga.
        </p>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
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
            <li>Chain: {chainById(form.chainId).label}</li>
            <li>Supply: {form.totalSupply} · {form.decimals} desimal</li>
            <li>
              Mint tujuan: {displayAmount(alloc.toDestination, form.decimals)}
            </li>
            <li>
              Sisa: {displayAmount(alloc.toRemainder, form.decimals)}
            </li>
            <li>
              Setelah deploy: {form.mintable ? "bisa mint lagi" : "supply tetap"}
              {form.burnable ? " · burnable" : ""}
            </li>
          </ul>
        </div>
        {result ? (
          <div className="rounded-2xl border border-lime-400/30 bg-lime-400/5 p-4 text-sm">
            <p className="font-semibold text-lime-200">Deploy berhasil</p>
            <a
              className="mt-2 block font-mono text-xs hover:underline"
              href={explorerToken(result.chainId, result.token)}
              target="_blank"
              rel="noreferrer"
            >
              {result.token}
            </a>
            <a
              className="mt-1 block text-xs text-muted-foreground hover:underline"
              href={explorerTx(result.chainId, result.tx)}
              target="_blank"
              rel="noreferrer"
            >
              Lihat transaksi
            </a>
          </div>
        ) : (
          <p className="rounded-2xl border border-dashed border-white/15 p-4 text-sm text-muted-foreground">
            Alamat kontrak muncul di sini setelah wallet mengonfirmasi transaksi.
          </p>
        )}
      </aside>
    </div>
  );
}
