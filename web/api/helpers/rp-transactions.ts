import "server-only";

/**
 * Shared transaction submission helpers for RP registration and signer rotation.
 * Used by register-rp, rotate-signer-key, and rp-retry endpoints.
 */

import { signEthDigestWithKms } from "@/api/helpers/kms-eth";
import {
  RpRegistryConfig,
  WLD_TOKEN_ADDRESS,
  WORLD_CHAIN_ID,
} from "@/api/helpers/rp-utils";
import {
  getERC20Allowance,
  getRpNonceFromContract,
  getUserOperationReceipt,
  sendUserOperation,
  UserOperationReceipt,
} from "@/api/helpers/temporal-rpc";
import {
  ADDRESS_ZERO,
  buildErc20ApproveCalldata,
  buildRegisterRpCalldata,
  buildToggleRpActiveCalldata,
  buildUpdateRpManagerCalldata,
  buildUpdateRpSignerCalldata,
  buildUserOperation,
  encodeSafeUserOpCalldata,
  getApproveWldNonce,
  getRegisterRpNonce,
  getTxExpiration,
  getUpdateRpNonce,
  hashSafeUserOp,
  hashUpdateRpTypedData,
  replacePlaceholderWithSignature,
  RP_NO_UPDATE_DOMAIN,
} from "@/api/helpers/user-operation";
import { logger } from "@/lib/logger";
import { KMSClient } from "@aws-sdk/client-kms";
import { getBytes, MaxUint256 } from "ethers";

/**
 * Builds, signs, and submits an ERC-20 approve(MaxUint256) UserOp so the
 * Safe wallet grants the CredentialSchemaIssuerRegistry unlimited WLD spend.
 */
async function submitWldApprovalTransaction(
  config: RpRegistryConfig,
  kmsClient: KMSClient,
): Promise<string> {
  const approveCalldata = buildErc20ApproveCalldata(
    config.credentialSchemaIssuerRegistryAddress,
    MaxUint256,
  );

  const safeCalldata = encodeSafeUserOpCalldata(
    WLD_TOKEN_ADDRESS,
    0n,
    approveCalldata,
  );

  const nonce = getApproveWldNonce();
  const { validAfter, validUntil } = getTxExpiration();

  const userOp = buildUserOperation(
    config.safeAddress,
    safeCalldata,
    nonce,
    validAfter,
    validUntil,
  );

  const safeOpHash = hashSafeUserOp(
    userOp,
    WORLD_CHAIN_ID,
    config.safe4337ModuleAddress,
    config.entryPointAddress,
  );

  const signature = await signEthDigestWithKms(
    kmsClient,
    config.safeOwnerKmsKeyId,
    getBytes(safeOpHash),
  );

  if (!signature) {
    throw new Error("Failed to sign WLD approval transaction");
  }

  userOp.signature = replacePlaceholderWithSignature({
    placeholderSig: userOp.signature,
    signature: signature.serialized,
  });

  const result = await sendUserOperation(userOp, config.entryPointAddress);
  return result.operationHash;
}

// 15s nominal wait fits the register_rp Hasura action budget (60s explicit
// timeout) even when the production staging duplicate runs a second wait.
// The deadline bounds sleeps and poll starts; a poll already in flight may
// overshoot by up to the RPC timeout.
const APPROVAL_MINE_TIMEOUT_MS = 15_000;
const APPROVAL_POLL_INITIAL_DELAY_MS = 1_000;
const APPROVAL_POLL_MAX_DELAY_MS = 5_000;

/**
 * Waits for the WLD approval UserOperation to mine by polling for its
 * receipt. Transient RPC failures are tolerated until the deadline — the
 * approval is already in flight, so aborting on a poll error would fail a
 * registration that is about to become valid. If the receipt never surfaces
 * (dropped/replaced op, receipt API lag), falls back to reading the
 * allowance directly: the allowance, not the specific operation, is the
 * precondition the registration is simulated against. Single-caller poll
 * against the internal bundler RPC, so capped exponential backoff without
 * jitter is sufficient.
 */
async function waitForWldApprovalMined(
  config: RpRegistryConfig,
  approvalHash: string,
  timeoutMs: number,
): Promise<void> {
  const startedAt = Date.now();
  const deadline = startedAt + timeoutMs;
  let delayMs = APPROVAL_POLL_INITIAL_DELAY_MS;
  let failedPolls = 0;

  for (;;) {
    let receipt: UserOperationReceipt | null = null;
    try {
      receipt = await getUserOperationReceipt(approvalHash);
    } catch (error) {
      failedPolls += 1;
      logger.warn("WLD approval receipt poll failed", {
        approvalHash,
        failedPolls,
        error,
      });
    }

    if (receipt) {
      if (!receipt.success) {
        throw new Error(
          `WLD approval UserOperation reverted on-chain (operationHash: ${approvalHash})`,
        );
      }
      logger.info("WLD approval mined", {
        approvalHash,
        transactionHash: receipt.receipt.transactionHash,
        waitMs: Date.now() - startedAt,
        failedPolls,
      });
      return;
    }

    const remainingMs = deadline - Date.now();
    if (remainingMs <= 0) break;
    await new Promise((res) => setTimeout(res, Math.min(delayMs, remainingMs)));
    delayMs = Math.min(delayMs * 2, APPROVAL_POLL_MAX_DELAY_MS);
  }

  const allowance = await getERC20Allowance(
    config.safeAddress,
    config.credentialSchemaIssuerRegistryAddress,
    WLD_TOKEN_ADDRESS,
  );
  if (allowance >= MaxUint256) {
    logger.info("WLD approval receipt not found but allowance is granted", {
      approvalHash,
      waitMs: Date.now() - startedAt,
      failedPolls,
    });
    return;
  }

  throw new Error(
    `WLD approval receipt not found and allowance not granted after ${timeoutMs}ms (operationHash: ${approvalHash}, failedPolls: ${failedPolls})`,
  );
}

/**
 * Builds, signs, and submits a registerRp transaction for a given config.
 * Returns the operation hash on success.
 */
export async function submitRegisterRpTransaction(
  config: RpRegistryConfig,
  params: {
    rpId: bigint;
    managerAddress: string;
    signerAddress: string;
    appName: string;
    kmsClient: KMSClient;
  },
): Promise<string> {
  // Ensure the Safe has granted MaxUint256 WLD allowance to the
  // CredentialSchemaIssuerRegistry before attempting registration.
  const currentAllowance = await getERC20Allowance(
    config.safeAddress,
    config.credentialSchemaIssuerRegistryAddress,
    WLD_TOKEN_ADDRESS,
  );

  if (currentAllowance < MaxUint256) {
    const approvalHash = await submitWldApprovalTransaction(
      config,
      params.kmsClient,
    );
    logger.info("WLD approval UserOp submitted", {
      approvalHash,
      safeAddress: config.safeAddress,
      spender: config.credentialSchemaIssuerRegistryAddress,
    });

    // The registration UserOp is simulated against current chain state, where
    // the registry pulls the WLD fee via transferFrom — so the approval must
    // be mined before registration is submitted, not merely accepted.
    await waitForWldApprovalMined(
      config,
      approvalHash,
      APPROVAL_MINE_TIMEOUT_MS,
    );
  }

  const innerCalldata = buildRegisterRpCalldata(
    params.rpId,
    params.managerAddress,
    params.signerAddress,
    params.appName,
  );

  const safeCalldata = encodeSafeUserOpCalldata(
    config.contractAddress,
    0n,
    innerCalldata,
  );

  const nonce = getRegisterRpNonce(params.rpId);
  const { validAfter, validUntil } = getTxExpiration();

  const userOp = buildUserOperation(
    config.safeAddress,
    safeCalldata,
    nonce,
    validAfter,
    validUntil,
  );

  const safeOpHash = hashSafeUserOp(
    userOp,
    WORLD_CHAIN_ID,
    config.safe4337ModuleAddress,
    config.entryPointAddress,
  );

  const signature = await signEthDigestWithKms(
    params.kmsClient,
    config.safeOwnerKmsKeyId,
    getBytes(safeOpHash),
  );

  if (!signature) {
    throw new Error("Failed to sign transaction");
  }

  userOp.signature = replacePlaceholderWithSignature({
    placeholderSig: userOp.signature,
    signature: signature.serialized,
  });

  const result = await sendUserOperation(userOp, config.entryPointAddress);
  return result.operationHash;
}

/**
 * Builds, signs, and submits a signer rotation transaction for a given config.
 * Returns the operation hash on success.
 */
export async function submitRotateSignerTransaction(
  config: RpRegistryConfig,
  params: {
    rpId: bigint;
    newSignerAddress: string;
    managerKmsKeyId: string;
    kmsClient: KMSClient;
  },
): Promise<string> {
  // Fetch contract nonce (different per contract)
  const contractNonce = await getRpNonceFromContract(
    params.rpId,
    config.contractAddress,
  );

  // Build EIP-712 typed data hash for manager signature
  const updateRpHash = hashUpdateRpTypedData(
    {
      rpId: params.rpId,
      manager: ADDRESS_ZERO, // No change
      signer: params.newSignerAddress,
      toggleActive: false, // No change
      unverifiedWellKnownDomain: RP_NO_UPDATE_DOMAIN,
      nonce: contractNonce,
    },
    config.domainSeparator,
    config.updateRpTypehash,
  );

  // Sign with manager KMS key
  const managerSignature = await signEthDigestWithKms(
    params.kmsClient,
    params.managerKmsKeyId,
    getBytes(updateRpHash),
  );

  if (!managerSignature) {
    throw new Error("Failed to sign with manager key");
  }

  // Build updateRp calldata
  const innerCalldata = buildUpdateRpSignerCalldata(
    params.rpId,
    params.newSignerAddress,
    contractNonce,
    managerSignature.serialized,
  );

  // Wrap in Safe's executeUserOp
  const safeCalldata = encodeSafeUserOpCalldata(
    config.contractAddress,
    0n,
    innerCalldata,
  );

  const nonce = getUpdateRpNonce(params.rpId);
  const { validAfter, validUntil } = getTxExpiration();

  const userOp = buildUserOperation(
    config.safeAddress,
    safeCalldata,
    nonce,
    validAfter,
    validUntil,
  );

  // Sign UserOp with Safe owner KMS key
  const safeOpHash = hashSafeUserOp(
    userOp,
    WORLD_CHAIN_ID,
    config.safe4337ModuleAddress,
    config.entryPointAddress,
  );

  const safeOwnerSignature = await signEthDigestWithKms(
    params.kmsClient,
    config.safeOwnerKmsKeyId,
    getBytes(safeOpHash),
  );

  if (!safeOwnerSignature) {
    throw new Error("Failed to sign transaction");
  }

  // Replace placeholder signature with actual signature
  userOp.signature = replacePlaceholderWithSignature({
    placeholderSig: userOp.signature,
    signature: safeOwnerSignature.serialized,
  });

  // Submit to temporal bundler
  const result = await sendUserOperation(userOp, config.entryPointAddress);
  return result.operationHash;
}

/**
 * Builds, signs, and submits a manager transfer transaction for a given config.
 * Used when switching from managed to self-managed mode.
 * Returns the operation hash on success.
 */
export async function submitTransferManagerTransaction(
  config: RpRegistryConfig,
  params: {
    rpId: bigint;
    newManagerAddress: string;
    managerKmsKeyId: string;
    kmsClient: KMSClient;
  },
): Promise<string> {
  const contractNonce = await getRpNonceFromContract(
    params.rpId,
    config.contractAddress,
  );

  const updateRpHash = hashUpdateRpTypedData(
    {
      rpId: params.rpId,
      manager: params.newManagerAddress,
      signer: ADDRESS_ZERO,
      toggleActive: false,
      unverifiedWellKnownDomain: RP_NO_UPDATE_DOMAIN,
      nonce: contractNonce,
    },
    config.domainSeparator,
    config.updateRpTypehash,
  );

  const managerSignature = await signEthDigestWithKms(
    params.kmsClient,
    params.managerKmsKeyId,
    getBytes(updateRpHash),
  );

  if (!managerSignature) {
    throw new Error("Failed to sign with manager key");
  }

  const innerCalldata = buildUpdateRpManagerCalldata(
    params.rpId,
    params.newManagerAddress,
    contractNonce,
    managerSignature.serialized,
  );

  const safeCalldata = encodeSafeUserOpCalldata(
    config.contractAddress,
    0n,
    innerCalldata,
  );

  const nonce = getUpdateRpNonce(params.rpId);
  const { validAfter, validUntil } = getTxExpiration();

  const userOp = buildUserOperation(
    config.safeAddress,
    safeCalldata,
    nonce,
    validAfter,
    validUntil,
  );

  const safeOpHash = hashSafeUserOp(
    userOp,
    WORLD_CHAIN_ID,
    config.safe4337ModuleAddress,
    config.entryPointAddress,
  );

  const safeOwnerSignature = await signEthDigestWithKms(
    params.kmsClient,
    config.safeOwnerKmsKeyId,
    getBytes(safeOpHash),
  );

  if (!safeOwnerSignature) {
    throw new Error("Failed to sign transaction");
  }

  userOp.signature = replacePlaceholderWithSignature({
    placeholderSig: userOp.signature,
    signature: safeOwnerSignature.serialized,
  });

  const result = await sendUserOperation(userOp, config.entryPointAddress);
  return result.operationHash;
}

/**
 * Builds, signs, and submits a toggleActive transaction for a given config.
 * Used to activate or deactivate a managed RP on-chain.
 * Returns the operation hash on success.
 */
export async function submitToggleRpActiveTransaction(
  config: RpRegistryConfig,
  params: {
    rpId: bigint;
    managerKmsKeyId: string;
    kmsClient: KMSClient;
  },
): Promise<string> {
  const contractNonce = await getRpNonceFromContract(
    params.rpId,
    config.contractAddress,
  );

  const updateRpHash = hashUpdateRpTypedData(
    {
      rpId: params.rpId,
      manager: ADDRESS_ZERO,
      signer: ADDRESS_ZERO,
      toggleActive: true,
      unverifiedWellKnownDomain: RP_NO_UPDATE_DOMAIN,
      nonce: contractNonce,
    },
    config.domainSeparator,
    config.updateRpTypehash,
  );

  const managerSignature = await signEthDigestWithKms(
    params.kmsClient,
    params.managerKmsKeyId,
    getBytes(updateRpHash),
  );

  if (!managerSignature) {
    throw new Error("Failed to sign with manager key");
  }

  const innerCalldata = buildToggleRpActiveCalldata(
    params.rpId,
    contractNonce,
    managerSignature.serialized,
  );

  const safeCalldata = encodeSafeUserOpCalldata(
    config.contractAddress,
    0n,
    innerCalldata,
  );

  const nonce = getUpdateRpNonce(params.rpId);
  const { validAfter, validUntil } = getTxExpiration();

  const userOp = buildUserOperation(
    config.safeAddress,
    safeCalldata,
    nonce,
    validAfter,
    validUntil,
  );

  const safeOpHash = hashSafeUserOp(
    userOp,
    WORLD_CHAIN_ID,
    config.safe4337ModuleAddress,
    config.entryPointAddress,
  );

  const safeOwnerSignature = await signEthDigestWithKms(
    params.kmsClient,
    config.safeOwnerKmsKeyId,
    getBytes(safeOpHash),
  );

  if (!safeOwnerSignature) {
    throw new Error("Failed to sign transaction");
  }

  userOp.signature = replacePlaceholderWithSignature({
    placeholderSig: userOp.signature,
    signature: safeOwnerSignature.serialized,
  });

  const result = await sendUserOperation(userOp, config.entryPointAddress);
  return result.operationHash;
}
