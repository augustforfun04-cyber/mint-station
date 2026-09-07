import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_FORM,
  buildDeployPayload,
  validateDeployForm,
  type DeployFormState,
} from "./bankr";

function form(patch: Partial<DeployFormState> = {}): DeployFormState {
  return {
    ...DEFAULT_FORM,
    tokenName: "My Agent",
    tokenSymbol: "AGENT",
    destinationValue: "0x87be4dA49869fD055d5a60cAc2a6Dc61fdd3052D",
    ...patch,
  };
}

test("mint ke wallet tujuan mengirim feeRecipient dan vesting hidup", () => {
  const payload = buildDeployPayload(form(), {
    simulateOnly: true,
    authKind: "user",
  });
  assert.equal(payload.disableVesting, false);
  assert.deepEqual(payload.feeRecipient, {
    type: "wallet",
    value: "0x87be4dA49869fD055d5a60cAc2a6Dc61fdd3052D",
  });
  assert.equal(payload.simulateOnly, true);
  assert.equal(payload.chain, "base");
});

test("tanpa mint, 100% supply ke pool", () => {
  const payload = buildDeployPayload(form({ mintToDestination: false }), {
    simulateOnly: false,
    authKind: "user",
  });
  assert.equal(payload.disableVesting, true);
  assert.deepEqual(payload.feeRecipient, {
    type: "wallet",
    value: "0x87be4dA49869fD055d5a60cAc2a6Dc61fdd3052D",
  });
});

test("handle X dibersihkan dari @", () => {
  const payload = buildDeployPayload(
    form({ destinationType: "x", destinationValue: "@partner" }),
    { simulateOnly: false, authKind: "user" },
  );
  assert.equal(payload.feeRecipient?.value, "partner");
});

test("partner tidak boleh mint atau degen di luar Base", () => {
  const mintError = validateDeployForm(form(), "partner");
  assert.match(mintError ?? "", /Partner Key tidak memint/);
  const chainError = validateDeployForm(
    form({ mintToDestination: false, chain: "robinhood" }),
    "partner",
  );
  assert.match(chainError ?? "", /Base/);
});

test("quote token Base ikut ke payload", () => {
  const payload = buildDeployPayload(form({ quoteToken: "bnkr" }), {
    simulateOnly: false,
    authKind: "user",
  });
  assert.equal(
    payload.pairedTokenAddress,
    "0x22af33fe49fd1fa80c7149773dde5890d3c76f3b",
  );
});
