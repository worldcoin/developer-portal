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

export const ISSUER_ALLOWLIST_MISCONFIGURED_ERROR_CODE =
  "issuer_allowlist_misconfigured";

/**
 * The staging Verifier is backed by a different registry contract than the
 * production one, so the same numeric id can name a different (issuer, schema)
 * pair in each. Overrides are therefore scoped per verifier environment.
 */
export type VerifierEnvironment = "production" | "staging";

function overrideVariableName(environment: VerifierEnvironment) {
  return environment === "staging"
    ? "V4_VERIFY_ALLOWED_ISSUER_SCHEMA_IDS_STAGING"
    : "V4_VERIFY_ALLOWED_ISSUER_SCHEMA_IDS";
}

/**
 * Resolution of the recognized set for one verifier environment.
 *
 * `misconfigured` is deliberately distinct from "not configured": an operator
 * who sets the override is stating a policy, and the two ways that policy can
 * fail are not symmetric. Applying a malformed list partially would silently
 * *narrow* the set and reject legitimate credentials; falling back to the
 * built-in set would silently *broaden* it, re-authorizing an issuer the
 * override was written to exclude. Neither is safe to guess at, so a malformed
 * override resolves to `misconfigured` and the caller fails closed.
 */
export type IssuerAllowlistResolution =
  | { status: "ok"; ids: readonly number[] }
  | { status: "misconfigured"; variable: string; reason: string };

/**
 * Deployment override for the recognized set, as a comma-separated list of
 * integers. Absent (unset, empty, or whitespace) means "no override"; anything
 * else must parse completely.
 */
export function resolveRecognizedIssuerSchemaIds(
  environment: VerifierEnvironment,
): IssuerAllowlistResolution {
  const variable = overrideVariableName(environment);
  const raw = process.env[variable]?.trim();

  if (!raw) {
    return { status: "ok", ids: DEFAULT_RECOGNIZED_ISSUER_SCHEMA_IDS };
  }

  const entries = raw
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

  if (entries.length === 0) {
    return {
      status: "misconfigured",
      variable,
      reason: "the override is set but holds no issuer schema ids",
    };
  }

  const ids: number[] = [];

  for (const entry of entries) {
    const value = Number(entry);

    if (!Number.isSafeInteger(value) || value < 0) {
      return {
        status: "misconfigured",
        variable,
        reason: `the override holds an invalid issuer schema id: ${JSON.stringify(entry)}`,
      };
    }

    ids.push(value);
  }

  return { status: "ok", ids };
}

/**
 * Kill switch. Enforcement is on by default; setting
 * `V4_VERIFY_ISSUER_ALLOWLIST_ENFORCED=false` falls back to log-only mode
 * without a code rollback, in case a legitimate issuer schema turns out to be
 * missing from the recognized set. It also covers a malformed override, so a
 * configuration typo has a documented escape hatch that is not "trust every
 * registered issuer".
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
  recognized: readonly number[],
): UnrecognizedIssuer[] {
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
