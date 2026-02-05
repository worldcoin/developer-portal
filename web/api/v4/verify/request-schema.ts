import { VerificationLevel } from "@worldcoin/idkit-core";
import * as yup from "yup";

const VerificationLevelWithFace = {
  ...VerificationLevel,
  Face: "face" as const,
};

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
    .oneOf(Object.values(VerificationLevelWithFace))
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
});

/**
 * Detect whether responses contain session proofs (have session_id field).
 * A request must be all uniqueness proofs OR all session proofs.
 */
export function isSessionProofRequest(responses: unknown[]): boolean {
  if (!responses || responses.length === 0) return false;
  const firstResponse = responses[0] as Record<string, unknown>;
  return (
    "session_id" in firstResponse &&
    typeof firstResponse.session_id === "string"
  );
}

// Base schema - responses validated in custom test based on protocol version
export const schema = yup
  .object({
    // Protocol version at root level
    protocol_version: yup
      .string()
      .oneOf(["3.0", "4.0"])
      .required("protocol_version is required"),

    // Nonce used in the RP signature
    nonce: yup.string().strict().required("nonce is required"),

    // Action identifier required for uniqueness proofs
    action: yup.string().strict().optional(),
    // Parameters for action creation (used if action_v4 doesn't exist)
    action_description: yup.string().optional().default(""),

    // Session id, only present in session proofs
    // We use this field to detect session proofs in custom validation
    session_id: yup.string().strict().optional(),

    // Responses array - validated based on version and type of proof
    responses: yup
      .array()
      .min(1, "At least one response item is required")
      .required("responses array is required"),
  })
  .test("request-validation", "Request validation failed", function (value) {
    const { action, session_id } = value;

    if (session_id) {
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
          itemSchema.validateSync(responses[i], { abortEarly: false });
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
  nonce: string;
  action: string;
  action_description?: string;
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
}

export interface UniquenessProofRequestV4 {
  protocol_version: "4.0";
  nonce: string;
  action: string;
  action_description?: string;
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
}

export interface SessionProofRequest {
  session_id: string;
  nonce: string;
  protocol_version: "4.0";
  responses: SessionResponseItem[];
}
