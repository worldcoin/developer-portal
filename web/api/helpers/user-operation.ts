import "server-only";

/**
 * ERC-4337 UserOperation building utilities for RP Registry operations.
 */

import { AbiCoder, hexlify, Interface, keccak256 } from "ethers";

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

/**
 * RpRegistry contract ABI.
 */
export const RP_REGISTRY_ABI = [
  // Write functions
  "function register(uint64 rpId, address manager, address signer, string calldata unverifiedWellKnownDomain)",
  "function updateManager(uint64 rpId, address newManager)",
  "function updateSigner(uint64 rpId, address newSigner)",
  "function updateDomain(uint64 rpId, string calldata newDomain)",

  // View functions
  "function getRp(uint64 rpId) view returns (address manager, address signer, string domain)",
  "function getManager(uint64 rpId) view returns (address)",
  "function getSigner(uint64 rpId) view returns (address)",
  "function getDomain(uint64 rpId) view returns (string)",
  "function isRegistered(uint64 rpId) view returns (bool)",

  // Events
  "event RpRegistered(uint64 indexed rpId, address indexed manager, address indexed signer, string domain)",
  "event ManagerUpdated(uint64 indexed rpId, address indexed oldManager, address indexed newManager)",
  "event SignerUpdated(uint64 indexed rpId, address indexed oldSigner, address indexed newSigner)",
  "event DomainUpdated(uint64 indexed rpId, string oldDomain, string newDomain)",
];

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
 *  - [17..23] (7 bytes)  : random tail / concurrency key (zeroed by default)
 *  - [24..31] (8 bytes)  : sequence (left zeroed; typically 0 for Bedrock txs)
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
  const concurrencyBuffer = new Uint8Array(CONCURRENCY_BYTES);
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
 * in the metadata with 2 leading zero bytes.
 *
 * @param rpId - The RP identifier (uint64)
 * @returns 32-byte nonce as Uint8Array
 */
export function getRegisterRpNonce(rpId: bigint): Uint8Array {
  // Convert uint64 to 8 bytes big-endian
const buf = Buffer.alloc(8);
buf.writeBigUInt64BE(value);

  // Create 10-byte metadata: 2 zero bytes + 8 bytes rpId
  const metadata = new Uint8Array(10);
  metadata.set(rpIdBytes, 2); // left-pad with 2 zero bytes

  return devPortalNonce(DevPortalAction.RegisterRp, metadata);
}

/**
 * Builds a UserOperation for the Safe wallet.
 *
 * @param sender - The Safe wallet address
 * @param callData - The encoded call to execute
 * @param nonce - The 32-byte nonce
 * @returns The unsigned UserOperation
 */
export function buildUserOperation(
  sender: string,
  callData: string,
  nonce: Uint8Array,
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
    signature: "0x",
  };
}

/**
 * Packs accountGasLimits from verification and call gas limits.
 * Format: verificationGasLimit (16 bytes) || callGasLimit (16 bytes)
 */
function packAccountGasLimits(
  verificationGasLimit: string,
  callGasLimit: string,
): string {
  const verification = BigInt(verificationGasLimit);
  const call = BigInt(callGasLimit);
  const packed = (verification << 128n) | call;
  return "0x" + packed.toString(16).padStart(64, "0");
}

/**
 * Packs gasFees from maxPriorityFeePerGas and maxFeePerGas.
 * Format: maxPriorityFeePerGas (16 bytes) || maxFeePerGas (16 bytes)
 */
function packGasFees(
  maxPriorityFeePerGas: string,
  maxFeePerGas: string,
): string {
  const priority = BigInt(maxPriorityFeePerGas);
  const max = BigInt(maxFeePerGas);
  const packed = (priority << 128n) | max;
  return "0x" + packed.toString(16).padStart(64, "0");
}

/**
 * Computes the hash of a UserOperation for signing.
 *
 * This follows the ERC-4337 v0.7 hashing scheme:
 * 1. Pack the UserOp fields
 * 2. Hash the packed data
 * 3. Combine with entryPoint and chainId
 *
 * @param userOp - The UserOperation to hash
 * @param entryPoint - The EntryPoint contract address
 * @param chainId - The chain ID
 * @returns The hash to sign
 */
export function hashUserOperation(
  userOp: UserOperation,
  entryPoint: string,
  chainId: bigint,
): string {
  const abiCoder = AbiCoder.defaultAbiCoder();

  // Pack gas limits and fees
  const accountGasLimits = packAccountGasLimits(
    userOp.verificationGasLimit,
    userOp.callGasLimit,
  );
  const gasFees = packGasFees(userOp.maxPriorityFeePerGas, userOp.maxFeePerGas);

  // Hash initCode and callData
  const initCodeHash = keccak256(userOp.initCode);
  const callDataHash = keccak256(userOp.callData);
  const paymasterAndDataHash = keccak256(userOp.paymasterAndData);

  // Encode the packed UserOp
  const packedUserOpHash = keccak256(
    abiCoder.encode(
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
        initCodeHash,
        callDataHash,
        accountGasLimits,
        userOp.preVerificationGas,
        gasFees,
        paymasterAndDataHash,
      ],
    ),
  );

  // Final hash includes entryPoint and chainId
  return keccak256(
    abiCoder.encode(
      ["bytes32", "address", "uint256"],
      [packedUserOpHash, entryPoint, chainId],
    ),
  );
}

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
