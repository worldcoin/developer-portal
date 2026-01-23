import "server-only";

/**
 * ERC-4337 UserOperation building utilities for RP Registry operations.
 *
 * Safe 4337 signing requires:
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

// ============================================================================
// Constants
// ============================================================================

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

/**
 * Placeholder signature used during UserOp construction.
 * Will be replaced with actual signature before submission.
 */
const PLACEHOLDER_SIGNATURE =
  "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";

/**
 * Time constants
 */
const MINUTE_MS = 60 * 1000;
const DEFAULT_VALID_AFTER_OFFSET_MINUTES = 10; // Account for clock skew
const DEFAULT_VALID_UNTIL_OFFSET_MINUTES = 30; // Transaction expiry

// ============================================================================
// Types
// ============================================================================

/**
 * ERC-4337 UserOperation structure (EntryPoint v0.7 format).
 */
export interface UserOperation {
  sender: string;
  nonce: string;
  initCode: string;
  callData: string;
  callGasLimit: string;
  verificationGasLimit: string;
  preVerificationGas: string;
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
  paymasterAndData: string;
  signature: string;
}

/**
 * DevPortal action types for nonce generation.
 */
export enum DevPortalAction {
  RegisterRp = 0,
  UpdateRp = 1,
}

// ============================================================================
// Gas Configuration
// ============================================================================

/**
 * Hardcoded gas limits for DevPortal UserOps.
 * These are sponsored transactions with zero fees.
 */
const GAS_LIMITS = {
  callGasLimit: "0xF4240", // 1,000,000
  verificationGasLimit: "0x186A0", // 100,000
  preVerificationGas: "0x0",
  maxFeePerGas: "0x0",
  maxPriorityFeePerGas: "0x0",
};

// ============================================================================
// Validity Timestamps
// ============================================================================

/**
 * Returns the default validity time range for a 4337 transaction.
 *
 * - `validAfter`: Set to 10 minutes ago to account for clock skew
 * - `validUntil`: Set to 30 minutes from now (transaction expiry)
 */
export function getTxExpiration(): { validAfter: Date; validUntil: Date } {
  const now = Date.now();
  return {
    validAfter: new Date(now - DEFAULT_VALID_AFTER_OFFSET_MINUTES * MINUTE_MS),
    validUntil: new Date(now + DEFAULT_VALID_UNTIL_OFFSET_MINUTES * MINUTE_MS),
  };
}

/**
 * Converts a Date to a 6-byte hex representation (unix timestamp).
 */
function dateTo6BytesHex(date: Date): string {
  const timestamp = Math.floor(date.getTime() / 1000);
  return zeroPadValue("0x" + timestamp.toString(16), 6);
}

/**
 * Creates a signature with validity timestamps prepended.
 * Safe 4337 signatures require: validAfter (6 bytes) || validUntil (6 bytes) || signature
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
  // Keep the timestamp prefix, replace the signature part
  return params.placeholderSig.slice(0, TIMESTAMP_PREFIX_LENGTH) +
    params.signature.slice(2);
}

// ============================================================================
// Safe Calldata Encoding
// ============================================================================

/**
 * Encodes calldata for a Safe executeUserOp call.
 *
 * @param to - Target contract address
 * @param value - ETH value to send (usually 0)
 * @param data - The inner calldata to execute
 * @returns The encoded Safe executeUserOp calldata
 */
export function encodeSafeUserOpCalldata(
  to: string,
  value: bigint,
  data: string,
): string {
  const iface = new Interface(SAFE_4337_ABI);
  return iface.encodeFunctionData("executeUserOp", [
    to,
    value,
    data,
    0, // operation: 0 = CALL
  ]);
}

/**
 * Builds the calldata for RpRegistry.register().
 *
 * @param rpId - The RP identifier (uint64)
 * @param manager - The manager address (controls on-chain updates)
 * @param signer - The signer address (signs proof requests)
 * @param domain - The well-known domain for the RP
 * @returns The encoded calldata
 */
export function buildRegisterRpCalldata(
  rpId: bigint,
  manager: string,
  signer: string,
  domain: string,
): string {
  const iface = new Interface(RP_REGISTRY_ABI);
  return iface.encodeFunctionData("register", [rpId, manager, signer, domain]);
}

/**
 * Constructs a 32-byte nonce for DevPortal operations.
 *
 * Layout (32 bytes total = 24-byte nonceKey + 8-byte sequence):
 *  - [0..5]   (6 bytes)  : magic: "dvprtl"
 *  - [6]      (1 byte)   : action
 *  - [7..16]  (10 bytes) : metadata (type-specific)
 *  - [17..23] (7 bytes)  : random tail (ensures unique nonce per attempt)
 *  - [24..31] (8 bytes)  : sequence (zeroed; typically 0 for Bedrock txs)
 *
 * @param action - DevPortalAction numeric enum (fits in 1 byte)
 * @param metadata - exactly 10 bytes of metadata
 * @returns Uint8Array of length 32
 */
function devPortalNonce(
  action: DevPortalAction,
  metadata: Uint8Array,
): Uint8Array {
  if (metadata.byteLength !== 10) {
    throw new Error("metadata must be 10 bytes");
  }
  if (!Number.isInteger(action) || action < 0 || action > 255) {
    throw new Error("action must fit in 1 byte");
  }

  const MAGIC_BYTES = new Uint8Array([100, 118, 112, 114, 116, 108]); // 'dvprtl'
  const CONCURRENCY_BYTES = 7;
  const concurrencyBuffer = crypto.getRandomValues(
    new Uint8Array(CONCURRENCY_BYTES),
  );
  const VALUE_BYTES = 8;
  const nonceValue = new Uint8Array(VALUE_BYTES);

  const result = new Uint8Array(32);
  let offset = 0;

  result.set(MAGIC_BYTES, offset);
  offset += MAGIC_BYTES.length;

  result[offset] = action;
  offset += 1;

  result.set(metadata, offset);
  offset += metadata.length;

  result.set(concurrencyBuffer, offset);
  offset += concurrencyBuffer.length;

  result.set(nonceValue, offset);

  return result;
}

/**
 * Generates the nonce for a RegisterRp operation.
 *
 * The rpId (uint64) is serialized as 8 bytes big-endian and placed
 * in the metadata with 2 trailing zero bytes.
 *
 * @param rpId - The RP identifier (uint64)
 * @returns 32-byte nonce as Uint8Array
 */
export function getRegisterRpNonce(rpId: bigint): Uint8Array {
  // Convert uint64 to 8 bytes big-endian
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(rpId);

  // Create 10-byte metadata: 8 bytes rpId + 2 zero bytes
  const metadata = new Uint8Array(10);
  metadata.set(buf, 0); // rpId first, right-pad with 2 zero bytes

  return devPortalNonce(DevPortalAction.RegisterRp, metadata);
}

/**
 * Builds a UserOperation for the Safe wallet with placeholder signature.
 *
 * The placeholder signature includes validity timestamps and will be
 * replaced with the actual signature after signing.
 *
 * @param sender - The Safe wallet address
 * @param callData - The encoded call to execute
 * @param nonce - The 32-byte nonce
 * @param validAfter - Start of validity window
 * @param validUntil - End of validity window
 * @returns The UserOperation with placeholder signature
 */
export function buildUserOperation(
  sender: string,
  callData: string,
  nonce: Uint8Array,
  validAfter: Date,
  validUntil: Date,
): UserOperation {
  return {
    sender,
    nonce: hexlify(nonce),
    initCode: "0x",
    callData,
    callGasLimit: GAS_LIMITS.callGasLimit,
    verificationGasLimit: GAS_LIMITS.verificationGasLimit,
    preVerificationGas: GAS_LIMITS.preVerificationGas,
    maxFeePerGas: GAS_LIMITS.maxFeePerGas,
    maxPriorityFeePerGas: GAS_LIMITS.maxPriorityFeePerGas,
    paymasterAndData: "0x",
    signature: signatureWithValidityTimestamps({
      validAfter,
      validUntil,
      signature: PLACEHOLDER_SIGNATURE,
    }),
  };
}

// ============================================================================
// EIP-712 Domain Separator
// ============================================================================

/**
 * Computes the EIP-712 domain separator for the Safe 4337 module.
 *
 * @param chainId - The chain ID
 * @param safe4337ModuleAddress - The Safe 4337 module contract address
 * @returns The domain separator hash
 */
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

// ============================================================================
// Hash Functions
// ============================================================================

/**
 * Computes the Safe Operation hash (EIP-712 typed data).
 * This is what the Safe owner signs.
 *
 * @param userOp - The UserOperation (must have signature with validity timestamps)
 * @param chainId - The chain ID
 * @param safe4337ModuleAddress - The Safe 4337 module contract address
 * @param entryPointAddress - The EntryPoint contract address
 * @returns The hash to sign
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

  // Encode the Safe Operation struct
  const encodedSafeOp = abiCoder.encode(
    [
      "bytes32", // typeHash
      "address", // safe
      "uint256", // nonce
      "bytes32", // initCodeHash
      "bytes32", // callDataHash
      "uint128", // verificationGasLimit
      "uint128", // callGasLimit
      "uint256", // preVerificationGas
      "uint128", // maxPriorityFeePerGas
      "uint128", // maxFeePerGas
      "bytes32", // paymasterAndDataHash
      "uint48", // validAfter
      "uint48", // validUntil
      "address", // entryPoint
    ],
    [
      SAFE_OP_TYPEHASH,
      userOp.sender,
      userOp.nonce,
      keccak256(userOp.initCode),
      keccak256(userOp.callData),
      BigInt(userOp.verificationGasLimit),
      BigInt(userOp.callGasLimit),
      BigInt(userOp.preVerificationGas),
      BigInt(userOp.maxPriorityFeePerGas),
      BigInt(userOp.maxFeePerGas),
      keccak256(userOp.paymasterAndData),
      validAfter,
      validUntil,
      entryPointAddress,
    ],
  );

  // Compute the EIP-712 message: 0x19 || 0x01 || domainSeparator || structHash
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

/**
 * Computes the EntryPoint UserOperation hash.
 * This is used by the bundler to identify the UserOp (not for signing with Safe).
 *
 * @param userOp - The UserOperation
 * @param entryPointAddress - The EntryPoint contract address
 * @param chainId - The chain ID
 * @returns The EntryPoint hash
 */
export function getUserOpHash(
  userOp: UserOperation,
  entryPointAddress: string,
  chainId: number,
): string {
  const abiCoder = AbiCoder.defaultAbiCoder();

  // Pack gas limits: verificationGasLimit (16 bytes) || callGasLimit (16 bytes)
  const accountGasLimits = concat([
    zeroPadValue(userOp.verificationGasLimit, 16),
    zeroPadValue(userOp.callGasLimit, 16),
  ]);

  // Pack gas fees: maxPriorityFeePerGas (16 bytes) || maxFeePerGas (16 bytes)
  const gasFees = concat([
    zeroPadValue(userOp.maxPriorityFeePerGas, 16),
    zeroPadValue(userOp.maxFeePerGas, 16),
  ]);

  const encoded = abiCoder.encode(
    [
      "address",
      "uint256",
      "bytes32",
      "bytes32",
      "bytes32",
      "uint256",
      "bytes32",
      "bytes32",
    ],
    [
      userOp.sender,
      userOp.nonce,
      keccak256(userOp.initCode),
      keccak256(userOp.callData),
      accountGasLimits,
      userOp.preVerificationGas,
      gasFees,
      keccak256(userOp.paymasterAndData),
    ],
  );

  const enc = abiCoder.encode(
    ["bytes32", "address", "uint256"],
    [keccak256(encoded), entryPointAddress, chainId],
  );

  return keccak256(enc);
}

// ============================================================================
// RPC Format
// ============================================================================

/**
 * Converts a UserOperation to the format expected by eth_sendUserOperation.
 */
export function userOpToRpcFormat(
  userOp: UserOperation,
): Record<string, string> {
  return {
    sender: userOp.sender,
    nonce: userOp.nonce,
    initCode: userOp.initCode,
    callData: userOp.callData,
    callGasLimit: userOp.callGasLimit,
    verificationGasLimit: userOp.verificationGasLimit,
    preVerificationGas: userOp.preVerificationGas,
    maxFeePerGas: userOp.maxFeePerGas,
    maxPriorityFeePerGas: userOp.maxPriorityFeePerGas,
    paymasterAndData: userOp.paymasterAndData,
    signature: userOp.signature,
  };
}
