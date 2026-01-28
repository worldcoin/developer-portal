import "server-only";

/**
 * ERC-4337 UserOperation building utilities for RP Registry operations.
 *
 * Safe 4337 signing flow:
 * 1. Build the UserOperation with a placeholder signature (includes validity timestamps)
 * 2. Compute the Safe Operation hash (EIP-712 typed data)
 * 3. Sign the Safe Operation hash with the Safe owner's key
 * 4. Replace the placeholder signature with the actual signature
 */

import {
  AbiCoder,
  concat,
  hexlify,
  Interface,
  keccak256,
  solidityPacked,
  zeroPadValue,
} from "ethers";

import RP_REGISTRY_ABI from "./abi/rp-registry.json";
import SAFE_4337_ABI from "./abi/safe-4337.json";

// =============================================================================
// Types & Interfaces
// =============================================================================

/** ERC-4337 UserOperation structure (EntryPoint v0.7 format). */
export interface UserOperation {
  sender: string;
  nonce: string;
  factory?: string;
  factoryData?: string;
  callData: string;
  callGasLimit: string;
  verificationGasLimit: string;
  preVerificationGas: string;
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
  paymaster?: string;
  paymasterVerificationGasLimit: string;
  paymasterPostOpGasLimit: string;
  paymasterData?: string;
  signature: string;
}

/** Gas limits configuration for UserOps. */
export interface GasLimits {
  callGasLimit: string;
  verificationGasLimit: string;
  preVerificationGas: string;
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
}

/** Parameters for building the UpdateRp EIP-712 typed data hash. */
export interface UpdateRpTypedDataParams {
  rpId: bigint;
  oprfKeyId: bigint;
  manager: string;
  signer: string;
  toggleActive: boolean;
  unverifiedWellKnownDomain: string;
  nonce: bigint;
}

/** DevPortal action types for nonce generation. */
export enum DevPortalAction {
  RegisterRp = 0,
  UpdateRp = 1,
}

// =============================================================================
// Constants
// =============================================================================

/** Zero address constant. */
const ADDRESS_ZERO = "0x0000000000000000000000000000000000000000";

/** Placeholder signature used during UserOp construction. */
const PLACEHOLDER_SIGNATURE =
  "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";

/**
 * Safe 4337 module type hash for EIP-712 signing.
 * @see https://github.com/safe-global/safe-modules/blob/cf8b5d3ce45b7556bec009ebf79352694dbb8672/modules/4337/contracts/Safe4337Module.sol#L53
 */
const SAFE_OP_TYPEHASH =
  "0xc03dfc11d8b10bf9cf703d558958c8c42777f785d998c62060d85a4f0ef6ea7f";

/**
 * EIP-712 domain separator type hash.
 * @see https://github.com/safe-global/safe-modules/blob/cf8b5d3ce45b7556bec009ebf79352694dbb8672/modules/4337/contracts/Safe4337Module.sol#L31
 */
const DOMAIN_SEPARATOR_TYPEHASH =
  "0x47e79534a245952e8b16893a336b85a3d9ea9fa8c573f3d803afb92a79469218";

// Time constants
const MINUTE_MS = 60 * 1000;
const DEFAULT_VALID_AFTER_OFFSET_MINUTES = 10;
const DEFAULT_VALID_UNTIL_OFFSET_MINUTES = 30;

// Nonce layout constants
const NONCE_MAGIC_BYTES = new Uint8Array([100, 118, 112, 114, 116, 108]); // 'dvprtl'
const NONCE_CONCURRENCY_BYTES = 7;
const NONCE_VALUE_BYTES = 8;

/** Sentinel value used to skip domain update in updateRp. */
export const RP_NO_UPDATE_DOMAIN = "__NO_UPDATE__";

/** Default gas limits for DevPortal UserOps (sponsored transactions). */
export const DEFAULT_GAS_LIMITS: GasLimits = {
  callGasLimit: "0xF4240", // 1,000,000
  verificationGasLimit: "0x186A0", // 100,000
  preVerificationGas: "0x0",
  maxFeePerGas: "0x0",
  maxPriorityFeePerGas: "0x0",
};

// =============================================================================
// Internal Helpers
// =============================================================================

/** Converts a Date to a 6-byte hex representation (unix timestamp). */
function dateTo6BytesHex(date: Date): string {
  const timestamp = Math.floor(date.getTime() / 1000);
  return zeroPadValue("0x" + timestamp.toString(16), 6);
}

/** Packs factory and factoryData into initCode (v0.6 format). */
function packInitCode(userOp: UserOperation): string {
  if (!userOp.factory || userOp.factory === ADDRESS_ZERO) {
    return "0x";
  }
  return concat([userOp.factory, userOp.factoryData || "0x"]);
}

/** Packs paymaster fields into paymasterAndData (v0.6 format). */
function packPaymasterAndData(userOp: UserOperation): string {
  if (!userOp.paymaster || userOp.paymaster === ADDRESS_ZERO) {
    return "0x";
  }
  return concat([
    userOp.paymaster,
    zeroPadValue(userOp.paymasterVerificationGasLimit || "0x0", 16),
    zeroPadValue(userOp.paymasterPostOpGasLimit || "0x0", 16),
    userOp.paymasterData || "0x",
  ]);
}

/** Converts rpId to 10-byte metadata for nonce generation. */
function rpIdToNonceMetadata(rpId: bigint): Uint8Array {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(rpId);
  const metadata = new Uint8Array(10);
  metadata.set(buf, 0);
  return metadata;
}

/**
 * Constructs a 32-byte nonce for DevPortal operations.
 *
 * Layout (32 bytes = 24-byte nonceKey + 8-byte sequence):
 *  - [0..5]   (6 bytes)  : magic "dvprtl"
 *  - [6]      (1 byte)   : action type
 *  - [7..16]  (10 bytes) : metadata (type-specific)
 *  - [17..23] (7 bytes)  : random (ensures unique nonce per attempt)
 *  - [24..31] (8 bytes)  : sequence (zeroed)
 */
function buildDevPortalNonce(
  action: DevPortalAction,
  metadata: Uint8Array,
): Uint8Array {
  if (metadata.byteLength !== 10) {
    throw new Error("metadata must be 10 bytes");
  }
  if (!Number.isInteger(action) || action < 0 || action > 255) {
    throw new Error("action must fit in 1 byte");
  }

  const result = new Uint8Array(32);
  let offset = 0;

  result.set(NONCE_MAGIC_BYTES, offset);
  offset += NONCE_MAGIC_BYTES.length;

  result[offset] = action;
  offset += 1;

  result.set(metadata, offset);
  offset += metadata.length;

  const randomBytes = crypto.getRandomValues(
    new Uint8Array(NONCE_CONCURRENCY_BYTES),
  );
  result.set(randomBytes, offset);
  offset += NONCE_CONCURRENCY_BYTES;

  result.set(new Uint8Array(NONCE_VALUE_BYTES), offset);

  return result;
}

// =============================================================================
// Validity & Signature Helpers
// =============================================================================

/**
 * Returns the default validity time range for a 4337 transaction.
 * - `validAfter`: 10 minutes ago (account for clock skew)
 * - `validUntil`: 30 minutes from now (transaction expiry)
 */
export function getTxExpiration(): { validAfter: Date; validUntil: Date } {
  const now = Date.now();
  return {
    validAfter: new Date(now - DEFAULT_VALID_AFTER_OFFSET_MINUTES * MINUTE_MS),
    validUntil: new Date(now + DEFAULT_VALID_UNTIL_OFFSET_MINUTES * MINUTE_MS),
  };
}

/**
 * Creates a signature with validity timestamps prepended.
 * Safe 4337 format: validAfter (6 bytes) || validUntil (6 bytes) || signature
 */
export function signatureWithValidityTimestamps(params: {
  validAfter: Date;
  validUntil: Date;
  signature: string;
}): string {
  return concat([
    dateTo6BytesHex(params.validAfter),
    dateTo6BytesHex(params.validUntil),
    params.signature,
  ]);
}

/**
 * Replaces the placeholder signature with the actual signature.
 * Preserves the validity timestamp prefix (first 12 bytes).
 */
export function replacePlaceholderWithSignature(params: {
  placeholderSig: string;
  signature: string;
}): string {
  const TIMESTAMP_PREFIX_LENGTH = 26; // "0x" + 24 hex chars (12 bytes)
  if (params.placeholderSig.length < TIMESTAMP_PREFIX_LENGTH) {
    throw new Error("Invalid placeholder signature");
  }
  return (
    params.placeholderSig.slice(0, TIMESTAMP_PREFIX_LENGTH) +
    params.signature.slice(2)
  );
}

// =============================================================================
// UserOperation Building
// =============================================================================

/**
 * Builds a UserOperation for the Safe wallet with placeholder signature.
 * The placeholder includes validity timestamps and will be replaced after signing.
 */
export function buildUserOperation(
  sender: string,
  callData: string,
  nonce: Uint8Array,
  validAfter: Date,
  validUntil: Date,
  gasLimits: GasLimits = DEFAULT_GAS_LIMITS,
): UserOperation {
  return {
    sender,
    nonce: hexlify(nonce),
    callData,
    callGasLimit: gasLimits.callGasLimit,
    verificationGasLimit: gasLimits.verificationGasLimit,
    preVerificationGas: gasLimits.preVerificationGas,
    maxFeePerGas: gasLimits.maxFeePerGas,
    maxPriorityFeePerGas: gasLimits.maxPriorityFeePerGas,
    paymasterVerificationGasLimit: "0x0",
    paymasterPostOpGasLimit: "0x0",
    signature: signatureWithValidityTimestamps({
      validAfter,
      validUntil,
      signature: PLACEHOLDER_SIGNATURE,
    }),
  };
}

// =============================================================================
// Safe 4337 Helpers
// =============================================================================

/** Encodes calldata for a Safe executeUserOp call. */
export function encodeSafeUserOpCalldata(
  to: string,
  value: bigint,
  data: string,
): string {
  const iface = new Interface(SAFE_4337_ABI);
  return iface.encodeFunctionData("executeUserOp", [to, value, data, 0]);
}

/** Computes the EIP-712 domain separator for the Safe 4337 module. */
export function domainSeparator(
  chainId: number,
  safe4337ModuleAddress: string,
): string {
  const abiCoder = AbiCoder.defaultAbiCoder();
  return keccak256(
    abiCoder.encode(
      ["bytes32", "uint256", "address"],
      [DOMAIN_SEPARATOR_TYPEHASH, chainId, safe4337ModuleAddress],
    ),
  );
}

/**
 * Computes the Safe Operation hash (EIP-712 typed data).
 * This is what the Safe owner signs.
 */
export function hashSafeUserOp(
  userOp: UserOperation,
  chainId: number,
  safe4337ModuleAddress: string,
  entryPointAddress: string,
): string {
  const abiCoder = AbiCoder.defaultAbiCoder();

  // Extract validity timestamps from signature (first 12 bytes after 0x)
  const validAfter = BigInt("0x" + userOp.signature.slice(2, 14));
  const validUntil = BigInt("0x" + userOp.signature.slice(14, 26));

  // Pack v0.7 fields to v0.6 format for hashing
  const initCode = packInitCode(userOp);
  const paymasterAndData = packPaymasterAndData(userOp);

  const encodedSafeOp = abiCoder.encode(
    [
      "bytes32",
      "address",
      "uint256",
      "bytes32",
      "bytes32",
      "uint128",
      "uint128",
      "uint256",
      "uint128",
      "uint128",
      "bytes32",
      "uint48",
      "uint48",
      "address",
    ],
    [
      SAFE_OP_TYPEHASH,
      userOp.sender,
      userOp.nonce,
      keccak256(initCode),
      keccak256(userOp.callData),
      BigInt(userOp.verificationGasLimit),
      BigInt(userOp.callGasLimit),
      BigInt(userOp.preVerificationGas),
      BigInt(userOp.maxPriorityFeePerGas),
      BigInt(userOp.maxFeePerGas),
      keccak256(paymasterAndData),
      validAfter,
      validUntil,
      entryPointAddress,
    ],
  );

  const message = solidityPacked(
    ["bytes1", "bytes1", "bytes32", "bytes32"],
    [
      "0x19",
      "0x01",
      domainSeparator(chainId, safe4337ModuleAddress),
      keccak256(encodedSafeOp),
    ],
  );

  return keccak256(message);
}

// =============================================================================
// RP Registry - Register
// =============================================================================

/** Builds the calldata for RpRegistry.register(). */
export function buildRegisterRpCalldata(
  rpId: bigint,
  manager: string,
  signer: string,
  domain: string,
): string {
  const iface = new Interface(RP_REGISTRY_ABI);
  return iface.encodeFunctionData("register", [rpId, manager, signer, domain]);
}

/** Generates the 32-byte nonce for a RegisterRp operation. */
export function getRegisterRpNonce(rpId: bigint): Uint8Array {
  return buildDevPortalNonce(
    DevPortalAction.RegisterRp,
    rpIdToNonceMetadata(rpId),
  );
}

// =============================================================================
// RP Registry - Update
// =============================================================================

/**
 * Computes the EIP-712 typed data hash for updateRp.
 * This is what the manager signs to authorize the update.
 */
export function hashUpdateRpTypedData(
  params: UpdateRpTypedDataParams,
  contractDomainSeparator: string,
  updateRpTypehash: string,
): string {
  const abiCoder = AbiCoder.defaultAbiCoder();

  const structHash = keccak256(
    abiCoder.encode(
      [
        "bytes32",
        "uint64",
        "uint160",
        "address",
        "address",
        "bool",
        "bytes32",
        "uint256",
      ],
      [
        updateRpTypehash,
        params.rpId,
        params.oprfKeyId,
        params.manager,
        params.signer,
        params.toggleActive,
        keccak256(new TextEncoder().encode(params.unverifiedWellKnownDomain)),
        params.nonce,
      ],
    ),
  );

  const message = solidityPacked(
    ["bytes1", "bytes1", "bytes32", "bytes32"],
    ["0x19", "0x01", contractDomainSeparator, structHash],
  );

  return keccak256(message);
}

/**
 * Builds the calldata for RpRegistry.updateRp() to update only the signer.
 * Uses zero/sentinel values for fields that should not be updated.
 */
export function buildUpdateRpSignerCalldata(
  rpId: bigint,
  newSigner: string,
  contractNonce: bigint,
  managerSignature: string,
): string {
  const iface = new Interface(RP_REGISTRY_ABI);
  return iface.encodeFunctionData("updateRp", [
    rpId,
    0, // oprfKeyId: no change
    ADDRESS_ZERO, // manager: no change
    newSigner,
    false, // toggleActive: no change
    RP_NO_UPDATE_DOMAIN,
    contractNonce,
    managerSignature,
  ]);
}

/** Generates the 32-byte nonce for an UpdateRp operation. */
export function getUpdateRpNonce(rpId: bigint): Uint8Array {
  return buildDevPortalNonce(
    DevPortalAction.UpdateRp,
    rpIdToNonceMetadata(rpId),
  );
}
