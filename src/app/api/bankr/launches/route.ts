import {
  fetchBankrLaunches,
  quotePairedLaunches,
  stockPairedLaunches,
  uniqueQuotePairs,
  uniqueStockPairs,
} from "@/lib/bankr";

export async function GET() {
  try {
    const launches = await fetchBankrLaunches();
    const stocks = stockPairedLaunches(launches);
    return Response.json({
      launches: stocks,
      quotes: quotePairedLaunches(launches),
      pairs: uniqueStockPairs(launches),
      quotePairs: uniqueQuotePairs(launches),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Bankr error.";
    return Response.json(
      { error: message, launches: [], quotes: [], pairs: [], quotePairs: [] },
      { status: 502 },
    );
  }
}
