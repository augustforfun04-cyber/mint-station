import { ClaimPanel } from "@/components/claim-panel";

export default function ClaimPage() {
  return (
    <div className="space-y-5 pb-10">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Claim</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Reserved is permissionless. Rehype + LP fees after swaps.
        </p>
      </div>
      <ClaimPanel />
    </div>
  );
}
