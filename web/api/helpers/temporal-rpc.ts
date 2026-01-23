import "server-only";

/**
 * Temporal JSON-RPC client for submitting ERC-4337 UserOperations.
 */

import { logger } from "@/lib/logger";
import { UserOperation, userOpToRpcFormat } from "./user-operation";

/**
 * JSON-RPC response structure.
 */
interface JsonRpcResponse<T> {
  jsonrpc: string;
  id: number;
  result?: T;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

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
 * Reads from TEMPORAL_RPC_URL environment variable.
 *
 * @returns The full RPC URL including network path
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
  const requestId = Math.floor(Math.random() * 10000);

  const requestBody = {
    jsonrpc: "2.0",
    id: requestId,
    method: "eth_sendUserOperation",
    params: [userOpToRpcFormat(userOp), entryPoint],
  };

  logger.info("Sending UserOperation to temporal", {
    rpcUrl,
    sender: userOp.sender,
    nonce: userOp.nonce,
  });

  const response = await fetch(rpcUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "devportal",
    },
    body: JSON.stringify(requestBody),
    signal: AbortSignal.timeout(5000), // 5 second timeout
  });

  if (!response.ok) {
    const errorText = await response.text();
    logger.error("Temporal RPC HTTP error", {
      status: response.status,
      statusText: response.statusText,
      body: errorText,
    });
    throw new Error(
      `Temporal RPC request failed: ${response.status} ${response.statusText}`,
    );
  }

  const jsonResponse = (await response.json()) as JsonRpcResponse<string>;

  if (jsonResponse.error) {
    logger.error("Temporal RPC error response", {
      code: jsonResponse.error.code,
      message: jsonResponse.error.message,
      data: jsonResponse.error.data,
    });
    throw new Error(
      `Temporal RPC error: ${jsonResponse.error.message} (code: ${jsonResponse.error.code})`,
    );
  }

  if (!jsonResponse.result) {
    logger.error("Temporal RPC missing result", { response: jsonResponse });
    throw new Error("Temporal RPC response missing result");
  }

  logger.info("UserOperation submitted successfully", {
    operationHash: jsonResponse.result,
    sender: userOp.sender,
  });

  return {
    operationHash: jsonResponse.result,
  };
}
