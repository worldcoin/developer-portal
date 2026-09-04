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
 * Deployment override for the recognized set, as a comma-separated list of
 * integers. A malformed list is rejected whole rather than partially applied:
 * dropping the bad entry would silently narrow the allowlist and reject
 * legitimate credentials.
 */
function readConfiguredIds(environment: VerifierEnvironment): number[] | null {
  const variableName = overrideVariableName(environment);
  const raw = process.env[variableName];
  if (!raw) return null;

  const entries = raw
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

  if (entries.length === 0) {
    logger.warn(
      `${variableName} is set but holds no ids; using the built-in recognized set`,
    );

    return null;
  }

  const parsed: number[] = [];

  for (const entry of entries) {
    const value = Number(entry);

    if (!Number.isSafeInteger(value) || value < 0) {
      logger.warn(
        `${variableName} holds an invalid id; using the built-in recognized set`,
        { entry },
      );

      return null;
    }

    parsed.push(value);
  }

  return parsed;
}

export function getRecognizedIssuerSchemaIds(
  environment: VerifierEnvironment,
): readonly number[] {
  return readConfiguredIds(environment) ?? DEFAULT_RECOGNIZED_ISSUER_SCHEMA_IDS;
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
  environment: VerifierEnvironment,
): UnrecognizedIssuer[] {
  const recognized = getRecognizedIssuerSchemaIds(environment);
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
