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

/**
 * Every rp_id this deployment could have handed out for `appId`, in the order a
 * caller should probe the chain: **salted first, always.**
 *
 * The self-managed flow derives the id twice across a gap it does not control:
 * the instructions screen shows the developer a number, the developer submits
 * `register(uint64 rpId, ...)` from their own wallet, and `register_rp` derives
 * it again to insert the row. If the flag flips between those two reads — a
 * rolling deploy serves them from tasks with different env, or the feature is
 * rolled back — the second derivation returns a different id, and the Portal
 * would store a row for an id nobody registered while the developer's actual
 * on-chain registration is orphaned. Self-managed rows never time out, so that
 * app is stuck until someone cleans it up by hand.
 *
 * Which ids are eligible is the security-critical part. "Initialized on-chain" is
 * not evidence that the *developer* registered it: the legacy id is guessable by
 * anyone, so a squatter's registration looks identical to the real thing.
 *
 * So while the feature is ON, the legacy id is not a candidate at all. Merely
 * ordering it last was not enough — a developer who clicks Continue before their
 * salted `register()` is visible on-chain (mined late, or a lagging RPC read)
 * leaves the salted candidate looking uninitialized, and a squatted legacy id
 * would then be the first initialized one found and get stored as this app's
 * rp_id. Under the new scheme an initialized legacy id is by definition not
 * something we handed out, so there is nothing there to adopt.
 *
 * The cost is the roll-forward window: instructions screen served with the flag
 * off, developer registers the legacy id, completion lands on a task with the flag
 * on. No candidate matches, and the row is created under the salted id — a wedged
 * registration needing manual cleanup. That is recoverable; binding an app to an
 * attacker's rp_id is not, and the window is one deploy transition.
 *
 * All values are derived here from the app_id, so nothing caller-supplied widens
 * what can be claimed. The caller keeps whatever the current scheme yields when no
 * candidate is on-chain.
 *
 * A PREVIOUS salt is deliberately NOT a candidate. Probing one would rescue an
 * in-flight self-managed setup across a rotation, but the reason to rotate is a
 * leaked salt — and an attacker who learned it can pre-register the old-salt id and
 * have it adopted any time the developer's current-salt transaction is not visible
 * yet. That is the same squat this change closes, reopened by the mitigation for
 * it.
 *
 * The cost of leaving it out: rotating while a developer sits between the
 * instructions screen and completion orphans that registration, and the row needs
 * manual cleanup. Rotate during a quiet window. Recoverable beats adoptable — the
 * same trade already made for the legacy id above.
 */
export function candidateRpIdsForApp(appId: string): `rp_${string}`[] {
  const salt = process.env.RP_ID_SALT;
  const salted =
    salt && salt.length >= MIN_SALT_LENGTH
      ? deriveSaltedRpIdString(appId, salt)
      : null;

  // Flag on: the salted id only — an initialized legacy id is not ours to adopt.
  // Flag off: legacy IS the current scheme, so adopting it is correct by
  // definition. The salted id stays reachable, and first, for the rollback window
  // where the screen may have shown it; an attacker cannot have planted that one.
  const ordered = isUnpredictableRpIdEnabled()
    ? [salted]
    : [salted, generateRpIdString(appId)];

  return Array.from(
    new Set(ordered.filter((id): id is `rp_${string}` => Boolean(id))),
  );
}
