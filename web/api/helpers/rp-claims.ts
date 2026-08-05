import "server-only";

/**
 * Tracking for defensive rp_id claims that have been submitted but not settled.
 *
 * `submitRegisterRpTransaction` returns once the UserOp is submitted, not once it
 * is mined, so for a window afterwards an on-chain read still shows the rp_id as
 * free. Two things must not act on that stale reading:
 *
 *  - `_pre-register-rp-ids` re-running would submit a second `register()`. The
 *    UserOp nonce carries per-attempt randomness, so both can be accepted and one
 *    later reverts, burning gas.
 *  - `submitManagedRpRegistration` would submit a competing `register()`. If the
 *    pre-claim wins on-chain with the shared manager while the row records a
 *    dedicated one, every later status check and retry reads the shared claim as
 *    foreign and that registration never reconciles.
 *
 * Both live here so the key format and TTL cannot drift between the writer and
 * the reader — the failure mode would be a marker nobody sees.
 */

import { USER_OP_MAX_VALIDITY_MS } from "@/api/helpers/user-operation";

/**
 * Covers the UserOp validity window plus the same margin the status endpoint uses
 * before calling an unsettled op dead. After it, the on-chain read is
 * authoritative again.
 */
const CLAIM_IN_FLIGHT_TTL_SECONDS = Math.ceil(
  (USER_OP_MAX_VALIDITY_MS + 5 * 60 * 1000) / 1000,
);

export type ClaimRegistry = "production" | "staging";

const claimKey = (registry: ClaimRegistry, rpIdString: string) =>
  `rp_claim_in_flight:${registry}:${rpIdString}`;

/**
 * Reserves an rp_id for a claim about to be submitted. False means a claim is
 * already settling and this one should be skipped.
 *
 * Fails OPEN when Redis is unavailable or errors. The claim tool is
 * operator-driven and dry-runs by default, and registration must not depend on a
 * cache being up; the on-chain read still catches anything that has mined.
 */
export async function reserveClaim(
  registry: ClaimRegistry,
  rpIdString: string,
): Promise<boolean> {
  const redis = global.RedisClient;
  if (!redis) {
    return true;
  }
  try {
    const reserved = await redis.set(
      claimKey(registry, rpIdString),
      "1",
      "EX",
      CLAIM_IN_FLIGHT_TTL_SECONDS,
      "NX",
    );
    return reserved === "OK";
  } catch {
    return true;
  }
}

/**
 * Drops a reservation whose submission never happened, so a retry is not blocked
 * for the whole TTL waiting on an operation that does not exist.
 */
export async function releaseClaim(
  registry: ClaimRegistry,
  rpIdString: string,
): Promise<void> {
  const redis = global.RedisClient;
  if (!redis) {
    return;
  }
  try {
    await redis.del(claimKey(registry, rpIdString));
  } catch {
    // Best-effort: the TTL clears it either way.
  }
}

/**
 * Whether a claim for this rp_id was submitted recently and may still land.
 *
 * Fails CLOSED — reports "not in flight" — when Redis is unavailable, matching
 * `reserveClaim`'s fail-open: neither the claim tool nor registration may be
 * blocked by a cache outage.
 */
export async function isClaimInFlight(
  registry: ClaimRegistry,
  rpIdString: string,
): Promise<boolean> {
  const redis = global.RedisClient;
  if (!redis) {
    return false;
  }
  try {
    return (await redis.exists(claimKey(registry, rpIdString))) === 1;
  } catch {
    return false;
  }
}
