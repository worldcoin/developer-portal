import "server-only";

/**
 * Temporal JSON-RPC client for ERC-4337 UserOperations and contract view calls.
 */

import { logger } from "@/lib/logger";
import { Contract, FetchRequest, JsonRpcProvider, Network } from "ethers";
import RP_REGISTRY_ABI from "./abi/rp-registry.json";
import { UserOperation } from "./user-operation";

const RPC_TIMEOUT_MS = 10_000;
const RPC_MAX_RETRIES = 2;
const WORLD_CHAIN_ID = 480;
const WORLD_CHAIN_NETWORK = "worldchain";

export interface SendUserOperationResult {
  operationHash: string;
}

export interface OnChainRelyingParty {
  initialized: boolean;
  active: boolean;
  manager: string;
  signer: string;
  oprfKeyId: bigint;
  unverifiedWellKnownDomain: string;
}

function createProvider(): JsonRpcProvider {
  const baseUrl = process.env.TEMPORAL_RPC_URL;
  if (!baseUrl) {
    throw new Error("TEMPORAL_RPC_URL environment variable is not set");
  }

  const rpcUrl = `${baseUrl}/v2/rpc/${WORLD_CHAIN_NETWORK}`;
  const fetchRequest = new FetchRequest(rpcUrl);
  fetchRequest.timeout = RPC_TIMEOUT_MS;
  fetchRequest.retryFunc = (_req, _resp, attempt) => {
    return Promise.resolve(attempt < RPC_MAX_RETRIES);
  };

  return new JsonRpcProvider(fetchRequest, Network.from(WORLD_CHAIN_ID), {
    batchMaxCount: 1,
    staticNetwork: true,
  });
}

/**
 * Submits an ERC-4337 UserOperation via the temporal bundler.
 * Returns the operation hash for tracking the transaction status.
 */
export async function sendUserOperation(
  userOp: UserOperation,
  entryPoint: string,
): Promise<SendUserOperationResult> {
  logger.info("Sending UserOperation to temporal", {
    sender: userOp.sender,
    nonce: userOp.nonce,
  });

  const provider = createProvider();
  const operationHash = await provider.send("eth_sendUserOperation", [
    userOp,
    entryPoint,
  ]);

  logger.info("UserOperation submitted successfully", {
    operationHash,
    sender: userOp.sender,
  });

  return { operationHash };
}

/**
 * Fetches RP data from RpRegistry. Uses getRpUnchecked to return data
 * even for inactive RPs (getRp would revert for inactive ones).
 */
export async function getRpFromContract(
  rpId: bigint,
  contractAddress: string,
): Promise<OnChainRelyingParty> {
  const provider = createProvider();
  const contract = new Contract(contractAddress, RP_REGISTRY_ABI, provider);

  const result = await contract.getRpUnchecked(rpId);

  return {
    initialized: result[0],
    active: result[1],
    manager: result[2],
    signer: result[3],
    oprfKeyId: BigInt(result[4]),
    unverifiedWellKnownDomain: result[5],
  };
}
