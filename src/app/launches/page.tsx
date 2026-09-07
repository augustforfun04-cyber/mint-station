import { RecentLaunches } from "@/components/recent-launches";

export default function LaunchesPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Launch terbaru</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          50 token terakhir dari{" "}
          <code className="font-mono">GET /token-launches</code> — data publik
          yang sama dengan bankr.bot/launches.
        </p>
      </div>
      <RecentLaunches limit={50} />
    </div>
  );
}
