import "server-only";

import { createHmac } from "crypto";
import { generateRpIdString } from "@/lib/rp";

/**
 * An rp_id must stay `rp_` + exactly 16 lowercase hex chars: `parseRpId` reads
 * it back as the uint64 the registry indexes RPs by, `isValidRpId` enforces the
 * shape on every inbound route, and the admin screens match it with a literal
 * /^rp_[0-9a-f]{16}$/ regex. Both derivations below must produce that shape.
 */
const RP_ID_HEX_CHARS = 16;

/**
 * A short salt would let an attacker who can guess it reconstruct the whole
 * namespace, which is the property we are buying here. 32 chars is the floor
 * for the generated-secret sizes we use elsewhere; the deployed value is a
 * 32-byte random string.
 */
const MIN_SALT_LENGTH = 32;

/**
 * The legacy scheme is `uint64(keccak256(app_id))` — a pure function of a
 * *public* app_id. Since on-chain `register()` is permissionless, zero-fee and
 * first-come, anyone can harvest app_ids from `/api/v2/public/apps`, compute
 * the rp_id of every app that has not migrated yet, and claim it (H1 #3910854).
 *
 * The salted scheme keys the same derivation with a server-side secret, so the
 * rp_id of an unregistered app is not computable by anyone who does not hold
 * the salt. Nothing else about the id changes: it stays a deterministic pure
 * function of the app_id *given the salt*, which is what lets the three call
 * sites that derive it independently — the managed pipeline, the self-managed
 * Hasura action, and the self-managed instructions screen the developer copies
 * the number from — keep agreeing without a reservation protocol.
 *
 * HMAC rather than keccak256(salt || app_id): a prefix-keyed hash of a
 * variable-length message is the textbook length-extension foot-gun, and HMAC
 * is the primitive that already exists for "keyed digest of a message".
 */
function deriveSaltedRpIdString(appId: string, salt: string): `rp_${string}` {
  const digest = createHmac("sha256", salt).update(appId).digest("hex");
  return `rp_${digest.slice(0, RP_ID_HEX_CHARS)}` as `rp_${string}`;
}

/**
 * True once unpredictable rp_ids are turned on for this environment. Off means
 * new registrations keep deriving the legacy public value, so this can be
 * rolled out (and rolled back) without touching already-registered rows.
 */
export function isUnpredictableRpIdEnabled(): boolean {
  return process.env.ENABLE_UNPREDICTABLE_RP_ID === "true";
}

/**
 * The rp_id to use for an app that is registering now.
 *
 * Existing rows are never re-derived — `rp_id` is the primary key of
 * `rp_registration` and is immutable after insert (it is not in the table's
 * Hasura update permissions), and `action_v4` rows hang off it. Every
 * authoritative consumer already reads the stored value, so flipping the flag
 * only affects registrations created after the flip. Apps registered under
 * either scheme keep working.
 *
 * Throws when the feature is enabled but the salt is unusable. Falling back to
 * the legacy derivation would hand out exactly the guessable ids the flag
 * exists to stop, and would do it silently — a failed registration the
 * developer can retry is the safe direction.
 */
export function resolveRpIdForNewRegistration(appId: string): `rp_${string}` {
  if (!isUnpredictableRpIdEnabled()) {
    return generateRpIdString(appId);
  }

  const salt = process.env.RP_ID_SALT;

  if (!salt || salt.length < MIN_SALT_LENGTH) {
    throw new Error(
      "ENABLE_UNPREDICTABLE_RP_ID is set but RP_ID_SALT is missing or shorter " +
        `than ${MIN_SALT_LENGTH} characters; refusing to fall back to the ` +
        "guessable keccak256(app_id) derivation.",
    );
  }

  return deriveSaltedRpIdString(appId, salt);
}
