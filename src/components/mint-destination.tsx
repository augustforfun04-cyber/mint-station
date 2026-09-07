"use client";

import { Wallet } from "lucide-react";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  CREATOR_SHARE,
  CREATOR_TOKENS,
  LP_SHARE,
  LP_TOKENS,
  TOTAL_SUPPLY,
  formatTokenAmount,
  type DeployFormState,
  type RecipientType,
} from "@/lib/bankr";

const RECIPIENT_TYPES: { id: RecipientType; label: string; placeholder: string }[] =
  [
    { id: "wallet", label: "Alamat EVM", placeholder: "0xabc…def" },
    { id: "ens", label: "ENS", placeholder: "nama.eth" },
    { id: "x", label: "X / Twitter", placeholder: "@handle" },
    { id: "farcaster", label: "Farcaster", placeholder: "username" },
  ];

export function MintDestination({
  form,
  onChange,
  partnerMode,
}: {
  form: DeployFormState;
  onChange: (patch: Partial<DeployFormState>) => void;
  partnerMode: boolean;
}) {
  const mintOn = form.mintToDestination && !partnerMode;

  return (
    <section className="rounded-2xl border border-lime-400/40 bg-lime-400/5 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-lime-400 text-black">
            <Wallet className="size-4" />
          </span>
          <div>
            <h3 className="font-heading text-base font-semibold">
              Mint supply ke wallet tujuan
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Bankr tidak bisa mint ulang setelah deploy. Satu-satunya mint
              adalah alokasi creator <strong>15%</strong> ({formatTokenAmount(CREATOR_TOKENS)}{" "}
              dari {formatTokenAmount(TOTAL_SUPPLY)}) yang dipremint ke wallet
              yang kamu tuju, lalu vesting 1 tahun dengan cliff 30 hari.
            </p>
          </div>
        </div>
        <Switch
          checked={mintOn}
          disabled={partnerMode}
          onCheckedChange={(checked) =>
            onChange({ mintToDestination: checked })
          }
          aria-label="Mint 15 persen ke wallet tujuan"
        />
      </div>

      {partnerMode ? (
        <Alert className="mt-4">
          <AlertTitle>Partner Key tidak memint alokasi</AlertTitle>
          <AlertDescription>
            Deploy org menjual 100% supply ke pool. Isi wallet di bawah sebagai
            penerima fee creator, bukan penerima mint.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="mt-4 grid gap-3 sm:grid-cols-[160px_1fr]">
        <Field>
          <FieldLabel>Tipe tujuan</FieldLabel>
          <Select
            value={form.destinationType}
            onValueChange={(value) =>
              onChange({ destinationType: value as RecipientType })
            }
          >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
            <SelectContent>
              {RECIPIENT_TYPES.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel>
            {partnerMode ? "Penerima fee" : "Wallet yang dituju"}
          </FieldLabel>
          <Input
            value={form.destinationValue}
            onChange={(e) => onChange({ destinationValue: e.target.value })}
            placeholder={
              RECIPIENT_TYPES.find((t) => t.id === form.destinationType)
                ?.placeholder
            }
            className="font-mono"
          />
          <FieldDescription>
            {mintOn
              ? "Alamat ini menerima 15 miliar token (vesting) dan fee creator 0.665% volume."
              : "Opsional untuk User Key. Wajib untuk Partner Key."}
          </FieldDescription>
        </Field>
      </div>

      <div className="mt-5 space-y-2">
        <div className="flex h-3 overflow-hidden rounded-full bg-black/40">
          <div
            className="bg-lime-400"
            style={{ width: mintOn ? `${LP_SHARE * 100}%` : "100%" }}
          />
          {mintOn ? (
            <div className="bg-emerald-700" style={{ width: `${CREATOR_SHARE * 100}%` }} />
          ) : null}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
          <span>
            <span className="mr-1 inline-block size-2 rounded-full bg-lime-400" />
            Pool Uniswap V4 · {mintOn ? "85%" : "100%"} ·{" "}
            {formatTokenAmount(mintOn ? LP_TOKENS : TOTAL_SUPPLY)} token
          </span>
          {mintOn ? (
            <span>
              <span className="mr-1 inline-block size-2 rounded-full bg-emerald-600" />
              Mint ke wallet tujuan · 15% · {formatTokenAmount(CREATOR_TOKENS)} token
            </span>
          ) : (
            <span className="text-muted-foreground">
              Vesting dimatikan — tidak ada premint.
            </span>
          )}
        </div>
        {mintOn ? (
          <p className="text-[11px] text-muted-foreground">
            Lima menit pertama, tiap wallet (termasuk tujuan) dibatasi 2% supply
            kecuali launch partner. Cliff 30 hari: belum ada yang unlock, lalu
            vesting linear sampai tahun ke-1.
          </p>
        ) : null}
      </div>
    </section>
  );
}
