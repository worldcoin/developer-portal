import "server-only";
import { signEthDigestWithKms } from "@/api/helpers/kms-eth";
import { estimateUserOperationGas } from "@/api/helpers/temporal-rpc";
import { WORLD_CHAIN_ID, type RpRegistryConfig } from "@/api/helpers/rp-utils";
import {
  buildUserOperation,
  encodeSafeUserOpCalldata,
  getRegisterRpNonce,
  getTxExpiration,
  hashSafeUserOp,
  replacePlaceholderWithSignature,
  type UserOperation,
} from "@/api/helpers/user-operation";
import { RP_BACKFILL_PLACEHOLDER_SIGNER } from "@/lib/rp-id-backfill";
import type { KMSClient } from "@aws-sdk/client-kms";
import { getBytes, Interface, toBeHex } from "ethers";
import { UserOperation as EntryPointUserOperation } from "ox/erc4337";
import RP_REGISTRY_ABI from "./abi/rp-registry.json";

export type PreparedRpBatch = { requestId: string; userOp: UserOperation };

export function buildRegisterManyCalldata(
  rpIds: bigint[],
  manager: string,
): string {
  if (
    !rpIds.length ||
    new Set(rpIds).size !== rpIds.length ||
    rpIds.some((id) => id <= 0n)
  ) {
    throw new Error("Batch requires distinct nonzero RP IDs");
  }
  return new Interface(RP_REGISTRY_ABI).encodeFunctionData("registerMany", [
    rpIds,
    rpIds.map(() => manager),
    rpIds.map(() => RP_BACKFILL_PLACEHOLDER_SIGNER),
    rpIds.map(() => ""),
  ]);
}

/** EntryPoint v0.7 receipt hash, distinct from the Safe EIP-712 signing digest. */
export function hashEntryPointUserOperation(
  userOp: UserOperation,
  entryPoint: string,
): string {
  return EntryPointUserOperation.hash(
    EntryPointUserOperation.fromRpc(
      userOp as EntryPointUserOperation.Rpc<"0.7">,
    ),
    {
      chainId: WORLD_CHAIN_ID,
      entryPointAddress: entryPoint as `0x${string}`,
      entryPointVersion: "0.7",
    },
  );
}

export async function prepareRpBatch(
  config: RpRegistryConfig,
  rpIds: bigint[],
  manager: string,
  kmsClient: KMSClient,
): Promise<PreparedRpBatch> {
  const calldata = encodeSafeUserOpCalldata(
    config.contractAddress,
    0n,
    buildRegisterManyCalldata(rpIds, manager),
  );
  const { validAfter, validUntil } = getTxExpiration();
  const userOp = buildUserOperation(
    config.safeAddress,
    calldata,
    getRegisterRpNonce(rpIds[0]),
    validAfter,
    validUntil,
  );
  // Let the bundler estimate the batch, rather than capping it at the single-RP default.
  const estimate = await estimateUserOperationGas(
    {
      ...userOp,
      callGasLimit: "0x0",
      verificationGasLimit: "0x0",
      preVerificationGas: "0x0",
    },
    config.entryPointAddress,
  );
  for (const key of [
    "callGasLimit",
    "verificationGasLimit",
    "preVerificationGas",
  ] as const) {
    const gas = BigInt(estimate[key]);
    if (gas < 0n || (key !== "preVerificationGas" && gas === 0n))
      throw new Error("Invalid batch gas estimate");
    userOp[key] = toBeHex((gas * 120n + 99n) / 100n);
  }
  const safeHash = hashSafeUserOp(
    userOp,
    WORLD_CHAIN_ID,
    config.safe4337ModuleAddress,
    config.entryPointAddress,
  );
  const signature = await signEthDigestWithKms(
    kmsClient,
    config.safeOwnerKmsKeyId,
    getBytes(safeHash),
    config.kmsRegion,
  );
  if (!signature) throw new Error("Failed to sign backfill batch");
  userOp.signature = replacePlaceholderWithSignature({
    placeholderSig: userOp.signature,
    signature: signature.serialized,
  });
  return {
    userOp,
    requestId: hashEntryPointUserOperation(userOp, config.entryPointAddress),
  };
}
