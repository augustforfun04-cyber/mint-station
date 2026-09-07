import { mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const solc = require("solc");
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = await import("node:fs/promises").then((fs) =>
  fs.readFile(join(root, "contracts/ManualToken.sol"), "utf8"),
);

const input = {
  language: "Solidity",
  sources: {
    "ManualToken.sol": { content: source },
  },
  settings: {
    optimizer: { enabled: true, runs: 200 },
    evmVersion: "cancun",
    outputSelection: {
      "*": {
        "*": ["abi", "evm.bytecode.object"],
      },
    },
  },
};

const output = JSON.parse(solc.compile(JSON.stringify(input)));
if (output.errors?.length) {
  const fatal = output.errors.filter((e) => e.severity === "error");
  for (const err of output.errors) {
    console[err.severity === "error" ? "error" : "warn"](err.formattedMessage);
  }
  if (fatal.length) process.exit(1);
}

const artifact = output.contracts["ManualToken.sol"].ManualToken;
const payload = {
  contractName: "ManualToken",
  abi: artifact.abi,
  bytecode: `0x${artifact.evm.bytecode.object}`,
};

const destDir = join(root, "src/lib/generated");
mkdirSync(destDir, { recursive: true });
writeFileSync(join(destDir, "manual-token.json"), JSON.stringify(payload, null, 2));
console.log("wrote src/lib/generated/manual-token.json", payload.bytecode.length, "chars");
