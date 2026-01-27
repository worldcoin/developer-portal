import "server-only";

/**
 * Utilities for RP (Relying Party) operations.
 */

import { keccak256, toUtf8Bytes } from "ethers";

export type RpRegistrationStatus =
  | "pending"
  | "registered"
  | "failed"
  | "deactivated";

/**
 * RP ID is derived as uint64(keccak256(app_id)).
 */
export function generateRpId(appId: string): bigint {
  const hash = keccak256(toUtf8Bytes(appId));
  const uint64Hex = hash.slice(2, 18);
  return BigInt("0x" + uint64Hex);
}

/**
 * Returns rp_id string (rp_ + 16 hex chars) for database storage.
 */
export function generateRpIdString(appId: string): string {
  const rpId = generateRpId(appId);
  return "rp_" + rpId.toString(16).padStart(16, "0");
}

export function isValidRpId(rpId: string): boolean {
  return typeof rpId === "string" && rpId.startsWith("rp_");
}

/**
 * Converts rp_id string back to numeric rpId for contract calls.
 */
export function parseRpId(rpIdString: string): bigint {
  const hexPart = rpIdString.slice(3);
  return BigInt("0x" + hexPart);
}

/**
 * Maps on-chain RP state to DB status.
 */
export function mapOnChainToDbStatus(
  initialized: boolean,
  active: boolean,
): RpRegistrationStatus {
  if (!initialized) {
    return "pending";
  }
  return active ? "registered" : "deactivated";
}
