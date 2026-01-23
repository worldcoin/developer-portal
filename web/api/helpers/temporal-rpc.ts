import "server-only";

/**
 * Temporal JSON-RPC client for submitting ERC-4337 UserOperations.
 */

import { logger } from "@/lib/logger";
import { JsonRpcProvider } from "ethers";
import { UserOperation, userOpToRpcFormat } from "./user-operation";

/**
 * Result of sending a UserOperation.
 */
export interface SendUserOperationResult {
  /** The operation hash returned by the bundler */
  operationHash: string;
}

/**
 * World Chain network identifier.
 */
const WORLD_CHAIN_NETWORK = "worldchain";

/**
 * Gets the JSON-RPC URL for the temporal service.
 */
function getRpcUrl(): string {
  const baseUrl = process.env.TEMPORAL_RPC_URL;
  if (!baseUrl) {
    throw new Error("TEMPORAL_RPC_URL environment variable is not set");
  }
  return `${baseUrl}/v2/rpc/${WORLD_CHAIN_NETWORK}`;
}

/**
 * Sends a UserOperation to the temporal bundler service.
 *
 * @param userOp - The signed UserOperation to submit
 * @param entryPoint - The EntryPoint contract address
 * @returns The operation hash if successful
 * @throws Error if the RPC call fails
 */
export async function sendUserOperation(
  userOp: UserOperation,
  entryPoint: string,
): Promise<SendUserOperationResult> {
  const rpcUrl = getRpcUrl();

  logger.info("Sending UserOperation to temporal", {
    rpcUrl,
    sender: userOp.sender,
    nonce: userOp.nonce,
  });

  const provider = new JsonRpcProvider(rpcUrl);

  const operationHash = await provider.send("eth_sendUserOperation", [
    userOpToRpcFormat(userOp),
    entryPoint,
  ]);

  logger.info("UserOperation submitted successfully", {
    operationHash,
    sender: userOp.sender,
  });

  return { operationHash };
}
