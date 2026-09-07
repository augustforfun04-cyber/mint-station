import type { Abi } from "viem";
import artifact from "@/lib/generated/manual-token.json";

export const manualTokenAbi = artifact.abi as Abi;
export const manualTokenBytecode = artifact.bytecode as `0x${string}`;
