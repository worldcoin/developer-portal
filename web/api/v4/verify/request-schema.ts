import { LegacyVerificationLevel } from "@/lib/idkit";
import * as yup from "yup";

/**
 * Schema for v4 verify request - supports both v3 (cloud) and v4 (on-chain) proofs.
 *
 * The version field at root level determines which proof format is expected.
 * V3 proofs include: merkle_root, nullifier, proof, verification_level
 * V4 proofs include: identifier, issuer_schema_id, compressed_proof, nullifier, etc.
 */

// V3 response item schema
const v3ResponseItemSchema = yup.object({
  // Identifier uses VerificationLevel values (legacy term for credential type: "orb", "device", "face")
  identifier: yup
    .string()
    .oneOf(Object.values(LegacyVerificationLevel))
    .required("identifier is required"),
  signal_hash: yup
    .string()
    .matches(/^0x[\dabcdef]+$/, "Invalid signal_hash.")
    .default(
      "0x00c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a4",
    ),
  merkle_root: yup.string().strict().required("merkle_root is required for v3"),
  nullifier: yup
    .string()
    .strict()
    .matches(
      /^(0x)?[\da-fA-F]+$/,
      "Invalid nullifier. Must be a hex string with optional 0x prefix.",
    )
    .required("nullifier is required for v3"),
  proof: yup.string().strict().required("proof is required for v3"),
  max_age: yup
    .number()
    .integer()
    .min(3600, "Maximum root age cannot be less than 3600 seconds (1 hour).")
    .max(
      604800,
      "Maximum root age cannot be more than 604800 seconds (7 days).",
    )
    .strict()
    .optional(),
});

// V4 uniqueness proof response item schema
const v4ResponseItemSchema = yup.object({
  identifier: yup.string().required("identifier is required"),
  // V4 default signal_hash is zero (unlike v3 which uses keccak256 of empty string)
  signal_hash: yup
    .string()
    .matches(/^0x[\dabcdef]+$/, "Invalid signal_hash.")
    .default("0x0"),
  issuer_schema_id: yup
    .number()
    .integer()
    .required("issuer_schema_id is required for v4"),
  nullifier: yup
    .string()
    .strict()
    .matches(
      /^(0x)?[\da-fA-F]+$/,
      "Invalid nullifier. Must be a hex string with optional 0x prefix.",
    )
    .required("nullifier is required for v4 uniqueness proofs"),
  expires_at_min: yup
    .number()
    .integer()
    .required("expires_at_min is required for v4"),
  credential_genesis_issued_at_min: yup.number().integer().optional(),
  proof: yup
    .array()
    .of(yup.string().required())
    .length(5, "proof must have exactly 5 elements")
    .required("proof is required for v4"),
  // Self Check 4.0 discloses its z-score as a protocol field element. IDKit
  // decodes that value before sending it to this endpoint.
  sybil_score: yup
    .number()
    .strict()
    .integer()
    .min(0)
    .max(Number.MAX_SAFE_INTEGER)
    .optional(),
});

// Session proof response item schema
const sessionResponseItemSchema = yup.object({
  identifier: yup.string().required("identifier is required"),
  signal_hash: yup
    .string()
    .matches(/^0x[\dabcdef]+$/, "Invalid signal_hash.")
    .default("0x0"),
  issuer_schema_id: yup
    .number()
    .integer()
    .required("issuer_schema_id is required for v4"),
  session_nullifier: yup
    .array()
    .of(yup.string().required())
    .length(
      2,
      "session_nullifier must have exactly 2 elements [nullifier, action]",
    )
    .required("session_nullifier is required for session proofs"),
  expires_at_min: yup
    .number()
    .integer()
    .required("expires_at_min is required for v4"),
  credential_genesis_issued_at_min: yup.number().integer().optional(),
  proof: yup
    .array()
    .of(yup.string().required())
    .length(5, "proof must have exactly 5 elements")
    .required("proof is required for v4"),
  // See the v4 uniqueness response schema above.
  sybil_score: yup
    .number()
    .strict()
    .integer()
    .min(0)
    .max(Number.MAX_SAFE_INTEGER)
    .optional(),
});

export type IntegrityBundleSignatureFormat =
  | "apple_app_attest"
  | "android_keystore";

export interface IntegrityBundle {
  version: number;
  signature_format: IntegrityBundleSignatureFormat;
  timestamp: number;
  signature: string;
  jwt: string;
}

const integrityBundleSchema = yup
  .object({
    version: yup
      .number()
      .strict()
      .oneOf([1, 2])
      .required("integrity_bundle.version is required"),
    signature_format: yup
      .string()
      .strict()
      .oneOf(["apple_app_attest", "android_keystore"])
      .required("integrity_bundle.signature_format is required"),
    timestamp: yup
      .number()
      .strict()
      .integer()
      .min(0)
      .max(Number.MAX_SAFE_INTEGER)
      .required("integrity_bundle.timestamp is required"),
    signature: yup
      .string()
      .strict()
      .max(8192)
      .matches(/^[0-9a-fA-F]+$/, "Invalid integrity_bundle.signature.")
      .test(
        "even-hex",
        "Invalid integrity_bundle.signature.",
        (value) => !value || value.length % 2 === 0,
      )
      .required("integrity_bundle.signature is required"),
    jwt: yup
      .string()
      .strict()
      .max(8192)
      .required("integrity_bundle.jwt is required"),
  })
  .strict()
  .noUnknown(true, "Unknown integrity_bundle field.")
  .test(
    "integrity-bundle-size",
    "integrity_bundle is too large.",
    (value) =>
      !value || Buffer.byteLength(JSON.stringify(value), "utf8") <= 8192,
  );

/** Supported protocol versions, listed oldest first. */
export const SUPPORTED_PROTOCOL_VERSIONS = ["3.0", "4.0"] as const;

export type ProtocolVersion = (typeof SUPPORTED_PROTOCOL_VERSIONS)[number];

/**
 * Whether `version` is older than the `minimum` a relying party will accept.
 * Ordering comes from SUPPORTED_PROTOCOL_VERSIONS rather than from a string
 * comparison, so adding a version only means appending to that list.
 */
export function isProtocolVersionBelowMinimum(
  version: string,
  minimum: string,
): boolean {
  return (
    SUPPORTED_PROTOCOL_VERSIONS.indexOf(version as ProtocolVersion) <
    SUPPORTED_PROTOCOL_VERSIONS.indexOf(minimum as ProtocolVersion)
  );
}

// Base schema - responses validated in custom test based on protocol version
export const schema = yup
  .object({
    // Protocol version at root level. This describes the proof the caller
    // supplied, so it is attacker-influenced whenever a relying party forwards
    // an IDKit result verbatim. Use `min_protocol_version` to constrain it.
    protocol_version: yup
      .string()
      .oneOf([...SUPPORTED_PROTOCOL_VERSIONS])
      .required("protocol_version is required"),

    // Lowest protocol version this relying party accepts. The RP sets it from
    // its own configuration rather than from the IDKit result, so it stays
    // trustworthy even when `protocol_version` does not. Absent means every
    // supported version is accepted.
    min_protocol_version: yup
      .string()
      .oneOf([...SUPPORTED_PROTOCOL_VERSIONS])
      .optional(),

    // Nonce used in the RP signature. Only the 4.0 circuit takes it as a public
    // input; 3.0 (Semaphore) proofs commit to `signal_hash` instead and are
    // therefore never bound to this value.
    nonce: yup.string().strict().required("nonce is required"),

    // Action identifier required for uniqueness proofs
    action: yup.string().strict().optional(),
    // Parameters for action creation (used if action_v4 doesn't exist)
    action_description: yup.string().optional().default(""),

    // Session id, only present in session proofs
    // We use this field to detect session proofs in custom validation
    session_id: yup.string().strict().optional(),

    // Sandbox is accepted as a distinct request environment and is
    // normalized to staging only where verifier/storage environment is needed.
    environment: yup
      .string()
      .oneOf(["production", "staging", "sandbox"])
      .optional(),

    // Optional World App integrity attestation bundle. When present, it is
    // verified before proof verification.
    integrity_bundle: integrityBundleSchema.optional(),

    // Responses array - validated based on version and type of proof
    responses: yup
      .array()
      .min(1, "At least one response item is required")
      .required("responses array is required"),
  })
  .test("request-validation", "Request validation failed", function (value) {
    const { action, session_id, protocol_version } = value;

    if (session_id) {
      // Session proofs are a 4.0-only construct: the session nullifier and the
      // session id are public inputs of the 4.0 circuit and have no 3.0
      // equivalent.
      if (protocol_version && protocol_version !== "4.0") {
        return this.createError({
          path: "protocol_version",
          message: "session proofs require protocol_version 4.0",
        });
      }

      // Session proofs must NOT have action field
      if (action) {
        return this.createError({
          path: "action",
          message: "action field must not be present for session proofs",
        });
      }
    } else if (!action) {
      // Uniqueness proofs require action field
      return this.createError({
        path: "action",
        message: "action is required for uniqueness proofs",
      });
    }

    return true;
  })
  .test(
    "responses-schema",
    "Invalid response items for protocol version",
    function (value) {
      const { protocol_version, session_id, responses } = value;
      if (!responses || responses.length === 0) return true;

      // Determine which schema to use
      let itemSchema;
      if (session_id && protocol_version === "4.0") {
        itemSchema = sessionResponseItemSchema;
      } else if (protocol_version === "4.0") {
        itemSchema = v4ResponseItemSchema;
      } else if (protocol_version === "3.0") {
        itemSchema = v3ResponseItemSchema;
      } else {
        return this.createError({
          path: "protocol_version",
          message: "Unknown protocol_version",
        });
      }

      for (let i = 0; i < responses.length; i++) {
        try {
          // Persist per-item defaults/transforms (e.g. signal_hash default)
          // back into the parsed request body.
          responses[i] = itemSchema.validateSync(responses[i], {
            abortEarly: false,
            stripUnknown: true,
          });
        } catch (err) {
          if (err instanceof yup.ValidationError) {
            return this.createError({
              path: `responses[${i}]`,
              message: err.errors.join(", "),
            });
          }
          throw err;
        }
      }
      return true;
    },
  )
  .test(
    "selfie-check-claims",
    "Invalid Self Check 4.0 response",
    function (value) {
      if (value?.protocol_version !== "4.0" || !value.responses) {
        return true;
      }

      for (let i = 0; i < value.responses.length; i++) {
        const response = value.responses[i] as {
          issuer_schema_id?: unknown;
          sybil_score?: unknown;
        };
        const isSelfieCheck = response.issuer_schema_id === 11;
        const hasSybilScore = response.sybil_score !== undefined;

        if (isSelfieCheck && !hasSybilScore) {
          return this.createError({
            path: `responses[${i}].sybil_score`,
            message: "sybil_score is required for Self Check 4.0 responses",
          });
        }

        if (!isSelfieCheck && hasSybilScore) {
          return this.createError({
            path: `responses[${i}].sybil_score`,
            message:
              "sybil_score is only supported for Self Check 4.0 responses",
          });
        }
      }

      return true;
    },
  );

export interface UniquenessProofResponseV3 {
  // Identifier uses VerificationLevel values (legacy term for credential type)
  identifier: string;
  signal_hash: string;
  merkle_root: string;
  nullifier: string;
  proof: string;
  max_age?: number;
}

export interface UniquenessProofRequestV3 {
  protocol_version: "3.0";
  min_protocol_version?: "3.0" | "4.0";
  nonce: string;
  action: string;
  action_description?: string;
  environment?: "production" | "staging" | "sandbox";
  integrity_bundle?: IntegrityBundle;
  responses: UniquenessProofResponseV3[];
}

export interface UniquenessProofResponseV4 {
  identifier: string;
  signal_hash: string;
  issuer_schema_id: string;
  nullifier: string;
  expires_at_min: string;
  credential_genesis_issued_at_min?: string;
  proof: [string, string, string, string, string];
  /** Self Check 4.0 z-score, decoded from its signed field-element claim. */
  sybil_score?: number;
}

export interface UniquenessProofRequestV4 {
  protocol_version: "4.0";
  min_protocol_version?: "3.0" | "4.0";
  nonce: string;
  action: string;
  action_description?: string;
  environment?: "production" | "staging" | "sandbox";
  integrity_bundle?: IntegrityBundle;
  responses: UniquenessProofResponseV4[];
}

export interface SessionResponseItem {
  identifier: string;
  signal_hash: string;
  issuer_schema_id: string;
  session_nullifier: [string, string]; // [nullifier, action]
  expires_at_min: string;
  credential_genesis_issued_at_min?: string;
  proof: [string, string, string, string, string];
  /** Self Check 4.0 z-score, decoded from its signed field-element claim. */
  sybil_score?: number;
}

export interface SessionProofRequest {
  session_id: string;
  nonce: string;
  protocol_version: "4.0";
  min_protocol_version?: "3.0" | "4.0";
  environment?: "production" | "staging" | "sandbox";
  integrity_bundle?: IntegrityBundle;
  responses: SessionResponseItem[];
}
