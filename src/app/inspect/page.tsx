import { InspectForm } from "@/components/inspect-form";

export default async function InspectPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Inspect token</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Baca metadata dan saldo langsung dari rantai yang kamu pilih.
        </p>
      </div>
      <InspectForm initialToken={params.token ?? ""} />
    </div>
  );
}
