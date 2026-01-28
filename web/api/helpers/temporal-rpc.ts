import "server-only";

/**
 * Temporal JSON-RPC client for ERC-4337 UserOperations and contract view calls.
 */

import { logger } from "@/lib/logger";
import { Contract, FetchRequest, JsonRpcProvider, Network } from "ethers";
import RP_REGISTRY_ABI from "./abi/rp-registry.json";
import VERIFIER_ABI from "./abi/verifier.json";
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

export interface VerifyProofParams {
  nullifier: bigint;
  action: bigint;
  rpId: bigint;
  sessionId: bigint;
  nonce: bigint;
  signalHash: bigint;
  authenticatorRoot: bigint;
  proofTimestamp: bigint;
  credentialIssuerId: bigint;
  credentialGenesisIssuedAtMin: bigint;
  compressedProof: [bigint, bigint, bigint, bigint];
}

export interface VerifyProofResult {
  success: boolean;
  error?: {
    code: string;
    detail: string;
  };
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

interface EthersCallException {
  code: string;
  revert?: {
    name: string;
    signature?: string;
    args?: unknown[];
  };
  shortMessage?: string;
  message?: string;
}

const VERIFIER_ERROR_MAP: Record<string, { code: string; detail: string }> = {
  OutdatedNullifier: {
    code: "outdated_nullifier",
    detail: "The proof has expired. Please generate a new proof.",
  },
  NullifierFromFuture: {
    code: "nullifier_from_future",
    detail: "The proof timestamp is in the future.",
  },
  InvalidMerkleRoot: {
    code: "invalid_root",
    detail: "The authenticator root is not valid.",
  },
  UnregisteredIssuerSchemaId: {
    code: "invalid_credential_issuer",
    detail: "The credential issuer is not registered.",
  },
  ProofInvalid: {
    code: "invalid_proof",
    detail: "The proof is invalid.",
  },
  PublicInputNotInField: {
    code: "invalid_public_input",
    detail: "A public input value is out of range.",
  },
};

function parseVerifierRevertReason(error: unknown): {
  code: string;
  detail: string;
} {
  const ethersError = error as EthersCallException;

  // Check for structured revert from ethers.js
  if (ethersError?.revert?.name) {
    const mapped = VERIFIER_ERROR_MAP[ethersError.revert.name];
    if (mapped) {
      return mapped;
    }
    return {
      code: "verification_failed",
      detail: `Contract reverted: ${ethersError.revert.name}`,
    };
  }

  // Fallback to shortMessage or message string matching
  const message =
    ethersError?.shortMessage ||
    ethersError?.message ||
    (error instanceof Error ? error.message : String(error));

  for (const [errorName, mapped] of Object.entries(VERIFIER_ERROR_MAP)) {
    if (message.includes(errorName)) {
      return mapped;
    }
  }

  return {
    code: "verification_failed",
    detail: message,
  };
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
    initialized: result.initialized,
    active: result.active,
    manager: result.manager,
    signer: result.signer,
    oprfKeyId: BigInt(result.oprfKeyId),
    unverifiedWellKnownDomain: result.unverifiedWellKnownDomain,
  };
}

/**
 * Verifies a World ID v4 proof by calling the on-chain Verifier contract.
 * The contract reverts if the proof is invalid (no return value on success).
 */
export async function verifyProofOnChain(
  params: VerifyProofParams,
  contractAddress: string,
): Promise<VerifyProofResult> {
  const serializableParams = Object.fromEntries(
    Object.entries(params).map(([k, v]) => [
      k,
      Array.isArray(v) ? v.map(String) : String(v),
    ]),
  );
  logger.info("Verifying proof via on-chain Verifier", {
    contractAddress,
    params: serializableParams,
  });

  try {
    const provider = createProvider();
    const contract = new Contract(contractAddress, VERIFIER_ABI, provider);

    await contract.verify(
      params.nullifier,
      params.action,
      params.rpId,
      params.sessionId,
      params.nonce,
      params.signalHash,
      params.authenticatorRoot,
      params.proofTimestamp,
      params.credentialIssuerId,
      params.credentialGenesisIssuedAtMin,
      params.compressedProof,
    );

    logger.info("Proof verified successfully", {
      rpId: params.rpId.toString(),
    });
    return { success: true };
  } catch (error) {
    logger.error("Proof verification failed", {
      error: error instanceof Error ? error.message : String(error),
      rpId: params.rpId.toString(),
    });

    return {
      success: false,
      error: parseVerifierRevertReason(error),
    };
  }
}
