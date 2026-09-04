import { logger } from "@/lib/logger";

/**
 * World ID 4.0 credentials carry an `issuer_schema_id`, which the
 * CredentialSchemaIssuerRegistry assigns to an (issuer, schema) pair. Registering
 * a schema is permissionless, so the on-chain Verifier only proves that *some*
 * registered issuer signed the credential — not that it is an issuer this API
 * vouches for. Without a server-side check, anyone can register their own schema,
 * self-issue credentials and have this endpoint report them as verified.
 *
 * The recognized set below is the list of Tools for Humanity issuer schemas World
 * App presents to relying parties today:
 *   1    — Proof of Personhood (Orb)
 *   11   — Self Check 4.0
 *   128  — legacy Proof of Personhood schema, still held by clients that have not
 *          completed the migration to schema 1
 *   9303 — NFC document (passport) uniqueness
 *   9310 — mobile network credential uniqueness
 */
export const DEFAULT_RECOGNIZED_ISSUER_SCHEMA_IDS: readonly number[] = [
  1, 11, 128, 9303, 9310,
];

export const UNRECOGNIZED_ISSUER_ERROR_CODE = "unrecognized_credential_issuer";

/**
 * Deployment override for the recognized set, as a comma-separated list of
 * integers (e.g. an environment whose registry assigns different ids). Ignored
 * when empty or unparseable so a malformed value cannot silently widen the
 * allowlist.
 */
function readConfiguredIds(): number[] | null {
  const raw = process.env.V4_VERIFY_ALLOWED_ISSUER_SCHEMA_IDS;
  if (!raw) return null;

  const parsed = raw
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => Number(entry))
    .filter((value) => Number.isSafeInteger(value) && value >= 0);

  if (parsed.length === 0) {
    logger.warn(
      "V4_VERIFY_ALLOWED_ISSUER_SCHEMA_IDS is set but holds no valid ids; using the built-in recognized set",
    );

    return null;
  }

  return parsed;
}

export function getRecognizedIssuerSchemaIds(): readonly number[] {
  return readConfiguredIds() ?? DEFAULT_RECOGNIZED_ISSUER_SCHEMA_IDS;
}

/**
 * Kill switch. Enforcement is on by default; setting
 * `V4_VERIFY_ISSUER_ALLOWLIST_ENFORCED=false` falls back to log-only mode
 * without a code rollback, in case a legitimate issuer schema turns out to be
 * missing from the recognized set.
 */
export function isIssuerAllowlistEnforced(): boolean {
  return process.env.V4_VERIFY_ISSUER_ALLOWLIST_ENFORCED !== "false";
}

export interface UnrecognizedIssuer {
  index: number;
  issuerSchemaId: number;
}

/**
 * Returns the response items whose `issuer_schema_id` is outside the recognized
 * set. Values that are not safe integers are always unrecognized.
 */
export function findUnrecognizedIssuers(
  responses: ReadonlyArray<{ issuer_schema_id?: unknown }>,
): UnrecognizedIssuer[] {
  const recognized = getRecognizedIssuerSchemaIds();
  const unrecognized: UnrecognizedIssuer[] = [];

  responses.forEach((response, index) => {
    const issuerSchemaId = Number(response?.issuer_schema_id);

    if (
      !Number.isSafeInteger(issuerSchemaId) ||
      !recognized.includes(issuerSchemaId)
    ) {
      unrecognized.push({ index, issuerSchemaId });
    }
  });

  return unrecognized;
}
