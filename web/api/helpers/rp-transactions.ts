import "server-only";

/**
 * Shared transaction submission helpers for RP registration and signer rotation.
 * Used by register-rp, rotate-signer-key, and rp-retry endpoints.
 */

import { signEthDigestWithKms } from "@/api/helpers/kms-eth";
import { RpRegistryConfig, WORLD_CHAIN_ID } from "@/api/helpers/rp-utils";
import {
  getRpNonceFromContract,
  sendUserOperation,
} from "@/api/helpers/temporal-rpc";
import {
  ADDRESS_ZERO,
  buildRegisterRpCalldata,
  buildToggleRpActiveCalldata,
  buildUpdateRpSignerCalldata,
  buildUserOperation,
  encodeSafeUserOpCalldata,
  getRegisterRpNonce,
  getTxExpiration,
  getUpdateRpNonce,
  hashSafeUserOp,
  hashUpdateRpTypedData,
  replacePlaceholderWithSignature,
  RP_NO_UPDATE_DOMAIN,
} from "@/api/helpers/user-operation";
import { KMSClient } from "@aws-sdk/client-kms";
import { getBytes } from "ethers";

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
      oprfKeyId: 0n, // No change
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
      oprfKeyId: 0n,
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
