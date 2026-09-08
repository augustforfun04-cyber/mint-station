import { HistoryList } from "@/components/history-list";

export default function HistoryPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">History</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Launches from this wallet, in this browser.
        </p>
      </div>
      <HistoryList />
    </div>
  );
}
