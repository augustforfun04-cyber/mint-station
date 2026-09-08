import assert from "node:assert/strict";
import test from "node:test";
import {
  catalogWithLive,
  defaultPairId,
  featuredPairIds,
  pairById,
  pairsForChain,
  PAIR_OPTIONS,
} from "./pairs";
import { uniqueStockPairs, uniqueQuotePairs, stockPairedLaunches } from "./bankr";

test("Base featured pairs include Bankr B20 NVDA and TSLA", () => {
  const ids = featuredPairIds(8453);
  assert.ok(ids.includes("base:NVDA"));
  assert.ok(ids.includes("base:TSLA"));
  assert.equal(pairById("base:NVDA").venue, "b20");
  assert.ok(pairById("base:NVDA").address?.startsWith("0xb200"));
});

test("Robinhood featured pairs include live Bankr stocks", () => {
  const ids = featuredPairIds(4663);
  assert.ok(ids.includes("robinhood:NVDA"));
  assert.ok(ids.includes("robinhood:TSLA"));
  assert.equal(pairById("robinhood:GME").address, "0x1b0e319c6a659f002271b69db8a7df2f911c153e");
});

test("switching chain only lists that chain's pairs", () => {
  const basePairs = pairsForChain(8453);
  const rhPairs = pairsForChain(4663);
  assert.ok(basePairs.every((p) => p.chainIds.includes(8453)));
  assert.ok(rhPairs.every((p) => p.chainIds.includes(4663)));
  assert.ok(basePairs.some((p) => p.id === "base:NVDA"));
  assert.ok(!basePairs.some((p) => p.id === "robinhood:NVDA"));
  assert.equal(defaultPairId(8453), "weth");
});

test("catalogWithLive does not mutate static options and marks live stocks", () => {
  const before = PAIR_OPTIONS.find((p) => p.id === "robinhood:NVDA");
  assert.equal(before?.live, undefined);
  const catalog = catalogWithLive([
    {
      chain: "robinhood",
      symbol: "NVDA",
      address: "0xd0601ce157db5bdc3162bbac2a2c8af5320d9eec",
      kind: "stock",
    },
    {
      chain: "robinhood",
      symbol: "XYZ",
      address: "0x1111111111111111111111111111111111111111",
      kind: "stock",
    },
  ]);
  assert.equal(PAIR_OPTIONS.find((p) => p.id === "robinhood:NVDA")?.live, undefined);
  assert.equal(catalog.find((p) => p.id === "robinhood:NVDA")?.live, true);
  assert.ok(catalog.some((p) => p.id === "robinhood:XYZ"));
});

test("uniqueStockPairs and quotes from Bankr launches", () => {
  const launches = [
    {
      status: "deployed",
      tokenName: "Quantum Rabbit",
      tokenSymbol: "QRABBIT",
      chain: "robinhood",
      tokenAddress: "0x12c89cb78b290cd5e0a020e40703e6570936aba3",
      txHash: "0x1",
      timestamp: 1,
      pairedStock: { address: "0xd0601ce157db5bdc3162bbac2a2c8af5320d9eec", symbol: "NVDA" },
    },
    {
      status: "deployed",
      tokenName: "FIRST",
      tokenSymbol: "FIRST",
      chain: "base",
      tokenAddress: "0x2",
      txHash: "0x2",
      timestamp: 2,
      pairedToken: { address: "0xf3081494b87e8d5fb7960f066e931d1d0e6e3d67", symbol: "TAO" },
    },
  ];
  assert.equal(stockPairedLaunches(launches).length, 1);
  assert.deepEqual(uniqueStockPairs(launches).map((p) => p.symbol), ["NVDA"]);
  assert.deepEqual(uniqueQuotePairs(launches).map((p) => p.symbol), ["TAO"]);
});
