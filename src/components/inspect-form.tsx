"use client";

import { useState } from "react";
import { createPublicClient, formatUnits, http } from "viem";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { chainById, CHAIN_OPTIONS, explorerToken } from "@/lib/chains";
import { manualTokenAbi } from "@/lib/contract";
import { isValidEvmAddress, shortenAddress } from "@/lib/token";

type Snapshot = {
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
  maxSupply: string;
  mintable: string;
  burnable: string;
  owner: string;
  balance?: string;
  token: `0x${string}`;
  chainId: number;
};

export function InspectForm({ initialToken = "" }: { initialToken?: string }) {
  const [token, setToken] = useState(initialToken);
  const [chainId, setChainId] = useState(CHAIN_OPTIONS[0].id);
  const [holder, setHolder] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Snapshot | null>(null);

  async function load() {
    setError(null);
    if (!isValidEvmAddress(token)) {
      setError("Alamat token tidak valid.");
      return;
    }
    const address = token.trim() as `0x${string}`;
    const chain = chainById(chainId).chain;
    const client = createPublicClient({ chain, transport: http() });
    setBusy(true);
    try {
      const [name, symbol, decimals, totalSupply, maxSupply, mintable, burnable, owner] =
        await Promise.all([
          client.readContract({ address, abi: manualTokenAbi, functionName: "name" }),
          client.readContract({ address, abi: manualTokenAbi, functionName: "symbol" }),
          client.readContract({ address, abi: manualTokenAbi, functionName: "decimals" }),
          client.readContract({ address, abi: manualTokenAbi, functionName: "totalSupply" }),
          client.readContract({ address, abi: manualTokenAbi, functionName: "maxSupply" }),
          client.readContract({ address, abi: manualTokenAbi, functionName: "mintable" }),
          client.readContract({ address, abi: manualTokenAbi, functionName: "burnable" }),
          client.readContract({ address, abi: manualTokenAbi, functionName: "owner" }),
        ]);
      const dec = Number(decimals);
      let balance: string | undefined;
      if (isValidEvmAddress(holder)) {
        const raw = await client.readContract({
          address,
          abi: manualTokenAbi,
          functionName: "balanceOf",
          args: [holder.trim() as `0x${string}`],
        });
        balance = formatUnits(raw as bigint, dec);
      }
      setData({
        name: String(name),
        symbol: String(symbol),
        decimals: dec,
        totalSupply: formatUnits(totalSupply as bigint, dec),
        maxSupply: (maxSupply as bigint) === BigInt(0) ? "tanpa batas" : formatUnits(maxSupply as bigint, dec),
        mintable: mintable ? "ya" : "tidak",
        burnable: burnable ? "ya" : "tidak",
        owner: String(owner),
        balance,
        token: address,
        chainId,
      });
    } catch {
      setData(null);
      setError("Gagal membaca kontrak. Pastikan chain dan alamat benar.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-black/30 p-4 sm:p-5">
      <h2 className="font-heading text-base font-semibold">Inspect kontrak</h2>
      <p className="mt-1 mb-4 text-sm text-muted-foreground">
        Baca name, supply, owner, dan saldo langsung dari RPC publik — tanpa API key.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field className="sm:col-span-2">
          <FieldLabel>Alamat token</FieldLabel>
          <Input
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="font-mono"
            placeholder="0x…"
          />
        </Field>
        <Field>
          <FieldLabel>Chain</FieldLabel>
          <select
            className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm"
            value={chainId}
            onChange={(e) => setChainId(Number(e.target.value))}
          >
            {CHAIN_OPTIONS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </Field>
        <Field>
          <FieldLabel>Cek saldo wallet (opsional)</FieldLabel>
          <Input
            value={holder}
            onChange={(e) => setHolder(e.target.value)}
            className="font-mono"
            placeholder="0x…"
          />
        </Field>
      </div>
      <Button type="button" className="mt-4" disabled={busy} onClick={() => void load()}>
        {busy ? "Membaca…" : "Baca on-chain"}
      </Button>
      {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
      {data ? (
        <dl className="mt-5 grid gap-2 text-sm sm:grid-cols-2">
          <Item label="Nama" value={data.name} />
          <Item label="Simbol" value={data.symbol} />
          <Item label="Total supply" value={data.totalSupply} />
          <Item label="Max supply" value={data.maxSupply} />
          <Item label="Mintable" value={data.mintable} />
          <Item label="Burnable" value={data.burnable} />
          <Item label="Owner" value={shortenAddress(data.owner, 6)} />
          {data.balance !== undefined ? (
            <Item label="Saldo wallet" value={data.balance} />
          ) : null}
          <a
            className="sm:col-span-2 text-xs text-lime-300 hover:underline"
            href={explorerToken(data.chainId, data.token)}
            target="_blank"
            rel="noreferrer"
          >
            Buka explorer
          </a>
        </dl>
      ) : null}
    </section>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 px-3 py-2">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-mono text-sm break-all">{value}</dd>
    </div>
  );
}
