"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { parseUnits } from "viem";
import {
  useAccount,
  usePublicClient,
  useReadContract,
  useSwitchChain,
  useWalletClient,
} from "wagmi";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { chainById, CHAIN_OPTIONS, explorerTx } from "@/lib/chains";
import { manualTokenAbi } from "@/lib/contract";
import { isValidEvmAddress } from "@/lib/token";
import { asAppChainId } from "@/lib/wagmi";

export function MintForm({ initialToken = "" }: { initialToken?: string }) {
  const { address, isConnected, chainId } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const { switchChainAsync } = useSwitchChain();
  const [token, setToken] = useState(initialToken);
  const [targetChain, setTargetChain] = useState(CHAIN_OPTIONS[0].id);
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tx, setTx] = useState<string | null>(null);

  const tokenAddress = isValidEvmAddress(token)
    ? (token.trim() as `0x${string}`)
    : undefined;

  const mintable = useReadContract({
    address: tokenAddress,
    abi: manualTokenAbi,
    functionName: "mintable",
    chainId: asAppChainId(targetChain),
    query: { enabled: Boolean(tokenAddress) },
  });
  const decimals = useReadContract({
    address: tokenAddress,
    abi: manualTokenAbi,
    functionName: "decimals",
    chainId: asAppChainId(targetChain),
    query: { enabled: Boolean(tokenAddress) },
  });
  const owner = useReadContract({
    address: tokenAddress,
    abi: manualTokenAbi,
    functionName: "owner",
    chainId: asAppChainId(targetChain),
    query: { enabled: Boolean(tokenAddress) },
  });
  const symbol = useReadContract({
    address: tokenAddress,
    abi: manualTokenAbi,
    functionName: "symbol",
    chainId: asAppChainId(targetChain),
    query: { enabled: Boolean(tokenAddress) },
  });

  async function mint() {
    setError(null);
    setTx(null);
    if (!tokenAddress) {
      setError("Alamat token tidak valid.");
      return;
    }
    if (!isValidEvmAddress(to)) {
      setError("Wallet tujuan mint tidak valid.");
      return;
    }
    if (!isConnected || !address || !walletClient || !publicClient) {
      setError("Hubungkan wallet owner.");
      return;
    }
    const dec = Number(decimals.data ?? 18);
    let parsed: bigint;
    try {
      parsed = parseUnits(amount.trim(), dec);
    } catch {
      setError("Jumlah mint tidak valid.");
      return;
    }
    if (parsed <= BigInt(0)) {
      setError("Jumlah mint harus lebih dari 0.");
      return;
    }
    setBusy(true);
    try {
      if (chainId !== targetChain) {
        await switchChainAsync({ chainId: asAppChainId(targetChain) });
      }
      const hash = await walletClient.writeContract({
        address: tokenAddress,
        abi: manualTokenAbi,
        functionName: "mint",
        args: [to.trim() as `0x${string}`, parsed],
        account: address,
        chain: chainById(targetChain).chain,
      });
      await publicClient.waitForTransactionReceipt({ hash });
      setTx(hash);
      toast.success("Mint terkirim ke wallet tujuan.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Mint gagal.";
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-black/30 p-4 sm:p-5">
      <h2 className="font-heading text-base font-semibold">Mint supply tambahan</h2>
      <p className="mt-1 mb-4 text-sm text-muted-foreground">
        Hanya untuk token yang kamu deploy dengan opsi mintable. Owner memanggil
        <code className="mx-1 font-mono">mint(tujuan, jumlah)</code> langsung
        on-chain.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field className="sm:col-span-2">
          <FieldLabel>Alamat token</FieldLabel>
          <Input
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="0x…"
            className="font-mono"
          />
        </Field>
        <Field>
          <FieldLabel>Chain token</FieldLabel>
          <select
            className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm"
            value={targetChain}
            onChange={(e) => setTargetChain(Number(e.target.value))}
          >
            {CHAIN_OPTIONS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </Field>
        <Field>
          <FieldLabel>Wallet tujuan</FieldLabel>
          <Input
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="0x…"
            className="font-mono"
          />
        </Field>
        <Field className="sm:col-span-2">
          <FieldLabel>Jumlah (human, bukan wei)</FieldLabel>
          <Input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="1000000"
            inputMode="decimal"
          />
          <FieldDescription>
            {symbol.data ? `Simbol ${String(symbol.data)} · ` : ""}
            desimal {decimals.data === undefined ? "…" : String(decimals.data)}
            {mintable.data === false
              ? " · token ini tidak mintable"
              : mintable.data === true
                ? " · mintable"
                : ""}
            {owner.data
              ? ` · owner ${String(owner.data).slice(0, 8)}…`
              : ""}
          </FieldDescription>
        </Field>
      </div>
      {error ? (
        <Alert variant="destructive" className="mt-4">
          <AlertTitle>Mint ditolak</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      <Button
        type="button"
        className="mt-4"
        disabled={busy}
        onClick={() => void mint()}
      >
        {busy ? <Loader2 className="animate-spin" /> : null}
        Mint ke wallet tujuan
      </Button>
      {tx ? (
        <a
          className="mt-3 block text-xs text-lime-300 hover:underline"
          href={explorerTx(targetChain, tx)}
          target="_blank"
          rel="noreferrer"
        >
          {tx}
        </a>
      ) : null}
    </section>
  );
}
