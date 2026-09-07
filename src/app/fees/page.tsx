import { Suspense } from "react";
import { FeesPanel } from "@/components/fees-panel";

export default function FeesPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Fee & claim</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Creator menerima 0.665% volume (95% dari swap fee 0.7%). Claim
          sekali klik lewat{" "}
          <code className="font-mono">
            POST /token-launches/:token/fees/claim
          </code>
          .
        </p>
      </div>
      <Suspense
        fallback={
          <div className="h-48 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
        }
      >
        <FeesPanel />
      </Suspense>
    </div>
  );
}
