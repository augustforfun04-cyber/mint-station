"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { ApiKeyPanel } from "@/components/api-key-panel";
import { useBankrSession } from "@/components/bankr-session";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type FeesResponse = {
  error?: string;
  message?: string;
  [key: string]: unknown;
};

export function FeesPanel() {
  const params = useSearchParams();
  const { apiKey, authHeaders } = useBankrSession();
  const [token, setToken] = useState(params.get("token") ?? "");
  const [fees, setFees] = useState<FeesResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"read" | "claim" | null>(null);

  async function loadFees() {
    setError(null);
    if (!token.trim()) {
      setError("Masukkan alamat token.");
      return;
    }
    setBusy("read");
    try {
      const res = await fetch(
        `/api/bankr/fees?token=${encodeURIComponent(token.trim())}&days=30`,
      );
      const data = (await res.json()) as FeesResponse;
      if (!res.ok) {
        const msg = data.error || data.message || "Gagal membaca fee.";
        setError(msg);
        setFees(null);
        return;
      }
      setFees(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membaca fee.");
    } finally {
      setBusy(null);
    }
  }

  async function claim() {
    if (!apiKey) {
      toast.error("Claim butuh User API Key.");
      return;
    }
    setBusy("claim");
    try {
      const res = await fetch("/api/bankr/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ token: token.trim() }),
      });
      const data = (await res.json()) as { error?: string; message?: string; transactionHash?: string };
      if (!res.ok) {
        toast.error(data.error || data.message || "Claim gagal.");
        return;
      }
      toast.success(
        data.transactionHash
          ? `Claim terkirim: ${data.transactionHash.slice(0, 10)}…`
          : "Claim terkirim.",
      );
      await loadFees();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Claim gagal.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-5">
      <ApiKeyPanel />
      <section className="rounded-2xl border border-white/10 bg-black/30 p-4 sm:p-5">
        <h2 className="font-heading text-base font-semibold">Cek & claim fee</h2>
        <p className="mt-1 mb-4 text-sm text-muted-foreground">
          Pembacaan fee tidak butuh kunci. Claim memakai wallet pemilik User
          API Key dan gas-nya disponsori Bankr.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Field className="flex-1">
            <FieldLabel>Alamat token</FieldLabel>
            <Input
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="0x…"
              className="font-mono"
            />
          </Field>
          <div className="flex items-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={busy !== null}
              onClick={() => void loadFees()}
            >
              {busy === "read" ? <Loader2 className="animate-spin" /> : null}
              Baca fee
            </Button>
            <Button
              type="button"
              disabled={busy !== null || !token.trim()}
              onClick={() => void claim()}
            >
              {busy === "claim" ? <Loader2 className="animate-spin" /> : null}
              Claim
            </Button>
          </div>
        </div>
        {error ? (
          <Alert variant="destructive" className="mt-4">
            <AlertTitle>Tidak bisa memuat fee</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        {fees ? (
          <pre className="mt-4 max-h-[420px] overflow-auto rounded-xl bg-black/50 p-3 font-mono text-xs text-lime-100/90">
            {JSON.stringify(fees, null, 2)}
          </pre>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            Belum ada data. Tempel alamat kontrak lalu baca fee.
          </p>
        )}
      </section>
    </div>
  );
}
