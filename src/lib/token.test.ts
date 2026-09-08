import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_FORM,
  computeAllocation,
  constructorArgs,
  validateDeployForm,
  withKeepPercent,
} from "./token";

const TEN18 = BigInt(10) ** BigInt(18);

test("mint persen custom ke wallet tujuan", () => {
  const form = {
    ...DEFAULT_FORM,
    tokenName: "Agent",
    tokenSymbol: "AGT",
    totalSupply: "100000000000",
    mintPercent: 15,
    destination: "0x87be4dA49869fD055d5a60cAc2a6Dc61fdd3052D",
  };
  const alloc = computeAllocation(form);
  assert.equal(alloc.total, BigInt(100_000_000_000) * TEN18);
  assert.equal(alloc.toDestination, BigInt(15_000_000_000) * TEN18);
  assert.equal(alloc.toRemainder, BigInt(85_000_000_000) * TEN18);
});

test("mint jumlah exact, bukan persen tetap", () => {
  const form = {
    ...DEFAULT_FORM,
    tokenName: "Moon",
    tokenSymbol: "MOON",
    totalSupply: "1000",
    mintMode: "amount" as const,
    mintAmount: "250.5",
    destination: "0x87be4dA49869fD055d5a60cAc2a6Dc61fdd3052D",
  };
  const alloc = computeAllocation(form);
  assert.equal(alloc.toDestination, BigInt(2505) * BigInt(10) ** BigInt(17));
  assert.equal(alloc.toRemainder, BigInt(7495) * BigInt(10) ** BigInt(17));
});

test("validasi wallet tujuan jika ada mint", () => {
  const form = {
    ...DEFAULT_FORM,
    tokenName: "X",
    tokenSymbol: "X",
    mintPercent: 50,
    destination: "bukan-alamat",
  };
  assert.match(validateDeployForm(form) ?? "", /tidak valid/i);
});

test("website opsional, URL invalid ditolak", () => {
  const base = {
    ...DEFAULT_FORM,
    tokenName: "Agent",
    tokenSymbol: "AGT",
    destination: "0x87be4dA49869fD055d5a60cAc2a6Dc61fdd3052D",
  };
  assert.equal(validateDeployForm(base), null);
  assert.equal(validateDeployForm({ ...base, website: "example.com" }), null);
  assert.match(
    validateDeployForm({ ...base, website: "javascript:alert(1)" }) ?? "",
    /website/i,
  );
});

test("you keep 50 sisakan 50 ke pair wallet", () => {
  const dest = "0x87be4dA49869fD055d5a60cAc2a6Dc61fdd3052D";
  const form = withKeepPercent(
    {
      ...DEFAULT_FORM,
      tokenName: "Keep",
      tokenSymbol: "KEEP",
      destination: dest,
    },
    50,
  );
  const alloc = computeAllocation(form);
  assert.equal(form.keepPercent, 50);
  assert.equal(form.mintPercent, 50);
  assert.equal(alloc.toDestination, BigInt(500_000_000) * TEN18);
  assert.equal(alloc.toRemainder, BigInt(500_000_000) * TEN18);
  assert.equal(validateDeployForm(form), null);
});

test("constructor args mengikuti mint custom", () => {
  const dest = "0x87be4dA49869fD055d5a60cAc2a6Dc61fdd3052D";
  const form = {
    ...DEFAULT_FORM,
    tokenName: "Custom",
    tokenSymbol: "CST",
    mintMode: "amount" as const,
    mintAmount: "10",
    totalSupply: "100",
    destination: dest,
    remainderTarget: "dead" as const,
  };
  const args = constructorArgs(form);
  assert.equal(args[5], dest);
  assert.equal(args[6], BigInt(10) * TEN18);
  assert.equal(args[3], BigInt(100) * TEN18);
});
