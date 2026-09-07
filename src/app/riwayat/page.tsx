import { HistoryList } from "@/components/history-list";

export default function HistoryPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Riwayat deploy</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Disimpan di browser ini setelah transaksi sukses.
        </p>
      </div>
      <HistoryList />
    </div>
  );
}
