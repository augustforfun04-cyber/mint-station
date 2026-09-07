import { DeployForm } from "@/components/deploy-form";
import { RecentLaunches } from "@/components/recent-launches";

export default function HomePage() {
  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <p className="text-xs font-medium tracking-[0.2em] text-lime-300 uppercase">
          Bankr · Doppler · Uniswap V4
        </p>
        <h1 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">
          Deploy token agent, mint 15% supply ke wallet yang kamu tuju.
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
          Launchpad ini memanggil{" "}
          <code className="font-mono text-lime-200">POST /token-launches/deploy</code>.
          85% masuk pool agar langsung bisa diperdagangkan. 15% dipremint ke
          wallet tujuan (vesting 1 tahun, cliff 30 hari) — satu-satunya cara
          mint ke alamat lain, karena supply tidak bisa ditambah setelah
          kontrak hidup.
        </p>
      </section>
      <DeployForm />
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Launch Bankr terbaru</h2>
        <RecentLaunches limit={6} />
      </section>
    </div>
  );
}
