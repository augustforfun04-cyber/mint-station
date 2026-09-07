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
        <h1 className="text-3xl font-semibold tracking-tight">Mint</h1>
      </div>
      <MintForm initialToken={params.token ?? ""} />
    </div>
  );
}
