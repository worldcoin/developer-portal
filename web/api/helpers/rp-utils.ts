import "server-only";

/**
 * Utilities for RP (Relying Party) operations.
 */

import { keccak256, toUtf8Bytes } from "ethers";

/**
 * Generates an RP ID from an app ID.
 *
 * The RP ID is derived as uint64(keccak256(app_id)), represented as a
 * bigint. This provides a deterministic mapping from app IDs to on-chain
 * RP identifiers.
 *
 * @param appId - The application identifier (e.g., "app_abc123")
 * @returns The RP ID as a bigint (uint64)
 */
export function generateRpId(appId: string): bigint {
  const hash = keccak256(toUtf8Bytes(appId));
  // Take the first 8 bytes (16 hex chars after 0x) and convert to uint64
  const uint64Hex = hash.slice(2, 18); // Skip "0x", take 16 chars
  return BigInt("0x" + uint64Hex);
}

/**
 * Generates an RP ID and returns it as a hex string for database storage.
 *
 * @param appId - The application identifier (e.g., "app_abc123")
 * @returns The RP ID as a hex string prefixed with "rp_" (e.g., "rp_8f4a2b3c4d5e6f70")
 */
export function generateRpIdString(appId: string): string {
  const rpId = generateRpId(appId);
  // Convert to hex string, pad to 16 chars (8 bytes), prefix with "rp_"
  return "rp_" + rpId.toString(16).padStart(16, "0");
}
