import { keccak256, toUtf8Bytes } from "ethers";

/**
 * RP ID is derived as uint64(keccak256(app_id)).
 */
export function generateRpId(appId: string): bigint {
  const hash = keccak256(toUtf8Bytes(appId));
  const uint64Hex = hash.slice(2, 18);
  return BigInt("0x" + uint64Hex);
}

/**
 * Returns rp_id string (rp_ + 16 hex chars) for storage and transport.
 */
export function generateRpIdString(appId: string): `rp_${string}` {
  const rpId = generateRpId(appId);
  return `rp_${rpId.toString(16).padStart(16, "0")}` as `rp_${string}`;
}
