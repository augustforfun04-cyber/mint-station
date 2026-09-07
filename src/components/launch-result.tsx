"use client";

import { CheckCircle2, Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  bankrTokenUrl,
  chainMeta,
  shortenAddress,
  type DeployResult,
} from "@/lib/bankr";

export function LaunchResult({ result }: { result: DeployResult | null }) {
  if (!result) {
    return (
      <div className="rounded-2xl border border-dashed border-white/15 bg-black/20 p-4 text-sm text-muted-foreground">
        Hasil simulasi atau deploy akan muncul di sini: alamat token, pool
        Uniswap V4, dan tx hash.
      </div>
    );
  }

  const chain = chainMeta(result.chain || "base");
  const token = result.tokenAddress;
  const tx = result.txHash;

  async function copy(label: string, value?: string) {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    toast.success(`${label} disalin.`);
  }

  return (
    <div className="rounded-2xl border border-lime-400/30 bg-lime-400/5 p-4">
      <div className="flex items-center gap-2 text-lime-200">
        <CheckCircle2 className="size-4" />
        <p className="text-sm font-semibold">
          {result.simulated ? "Simulasi OK" : "Deploy berhasil"}
        </p>
      </div>
      <dl className="mt-3 space-y-2 text-sm">
        <Row
          label="Token"
          value={shortenAddress(token, 6)}
          onCopy={() => void copy("Alamat token", token)}
          href={token ? chain.explorerToken(token) : undefined}
        />
        <Row
          label="Pool"
          value={shortenAddress(result.poolId, 6)}
          onCopy={() => void copy("Pool ID", result.poolId)}
        />
        {tx ? (
          <Row
            label="Tx"
            value={shortenAddress(tx, 6)}
            onCopy={() => void copy("Tx hash", tx)}
            href={chain.explorerTx(tx)}
          />
        ) : (
          <div className="text-xs text-muted-foreground">
            Simulasi tidak menyiarkan transaksi.
          </div>
        )}
      </dl>
      {token ? (
        <a
          href={bankrTokenUrl(result.chain || "base", token)}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex items-center gap-1 text-xs text-lime-300 hover:underline"
        >
          Buka di bankr.bot <ExternalLink className="size-3" />
        </a>
      ) : null}
      {result.feeDistribution ? (
        <div className="mt-3 border-t border-white/10 pt-3">
          <p className="text-xs text-muted-foreground">Fee distribution (bps)</p>
          <ul className="mt-1 space-y-1 text-xs">
            {Object.entries(result.feeDistribution).map(([role, info]) => (
              <li key={role} className="flex justify-between gap-2 font-mono">
                <span className="capitalize">{role}</span>
                <span>
                  {info?.bps ?? "—"} · {shortenAddress(info?.address, 3)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function Row({
  label,
  value,
  onCopy,
  href,
}: {
  label: string;
  value: string;
  onCopy: () => void;
  href?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="flex items-center gap-1 font-mono">
        {href ? (
          <a href={href} target="_blank" rel="noreferrer" className="hover:underline">
            {value}
          </a>
        ) : (
          value
        )}
        <Button type="button" size="icon-xs" variant="ghost" onClick={onCopy}>
          <Copy />
        </Button>
      </span>
    </div>
  );
}
