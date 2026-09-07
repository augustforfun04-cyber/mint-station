import { MintForm } from "@/components/mint-form";

export default async function MintPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Mint ke wallet tujuan</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Isi alamat token mintable, wallet tujuan, dan jumlah. Tidak ada kuota
          atau API key — hanya owner on-chain yang bisa mint.
        </p>
      </div>
      <MintForm initialToken={params.token ?? ""} />
    </div>
  );
}
