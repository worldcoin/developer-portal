import type { RpContext } from "@worldcoin/idkit";
import { hashSignal } from "@worldcoin/idkit/hashing";
import { keccak256, toUtf8Bytes } from "ethers";

const RP_CONTEXT_TTL_SECONDS = 300;
const MOCK_RP_SIGNATURE = `0x${"00".repeat(64)}1b` as const;

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

function createNonce(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  // hashSignal is hashToFieldElement under the hood; we reuse it to hash the nonce.
  return hashSignal(bytes);
}

/**
 * Builds a mock (unsigned) RpContext for legacy IDKit flows that don't have a
 * real signed context, e.g. the World ID account migration and kiosk previews.
 */
export function buildMockRpContext(appId: `app_${string}`): RpContext {
  const now = Math.floor(Date.now() / 1000);

  return {
    rp_id: generateRpIdString(appId),
    nonce: createNonce(),
    created_at: now,
    expires_at: now + RP_CONTEXT_TTL_SECONDS,
    signature: MOCK_RP_SIGNATURE,
  };
}
