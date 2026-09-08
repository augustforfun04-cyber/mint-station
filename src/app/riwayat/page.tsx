import { HistoryList } from "@/components/history-list";
import { BankrLaunchList } from "@/components/bankr-launch-list";

export default function RiwayatPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">History</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Launch dari wallet di browser ini, plus deploy Bankr yang sudah pair saham.
        </p>
      </div>
      <section className="space-y-3">
        <h2 className="text-sm font-medium text-zinc-400">Wallet ini</h2>
        <HistoryList />
      </section>
      <section className="space-y-3">
        <h2 className="text-sm font-medium text-zinc-400">Bankr · pair saham live</h2>
        <BankrLaunchList />
      </section>
    </div>
  );
}
