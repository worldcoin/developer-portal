import { errorRequiredAttribute, errorResponse } from "@/api/helpers/errors";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import {
  hashActionToUint256,
  parseRpId,
  resolveRpRegistration,
  RpRegistrationStatus,
} from "@/api/helpers/rp-utils";
import { verifyProofOnChain } from "@/api/helpers/temporal-rpc";
import { validateRequestSchema } from "@/api/helpers/validate-request-schema";
import { nullifierHashToBigIntStr, verifyProof } from "@/api/helpers/verify";
import { generateExternalNullifier } from "@/lib/hashing";
import { logger } from "@/lib/logger";
import { captureEvent } from "@/services/posthogClient";
import { AppErrorCodes, VerificationLevel } from "@worldcoin/idkit-core";
import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";
import { getSdk as getCheckNullifierV4Sdk } from "./graphql/check-nullifier-v4.generated";
import { getSdk as getCreateActionV4Sdk } from "./graphql/create-action-v4.generated";
import { getSdk as getFetchActionV4Sdk } from "./graphql/fetch-action-v4.generated";
import { getSdk as getInsertNullifierV4Sdk } from "./graphql/insert-nullifier-v4.generated";

const VerificationLevelWithFace = {
  ...VerificationLevel,
  Face: "face" as const,
};

/**
 * Schema for v4 verify request - supports both v3 (cloud) and v4 (on-chain) proofs.
 *
 * The version field at root level determines which proof format is expected.
 * V3 proofs include: merkle_root, nullifier_hash, proof, verification_level
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
  nullifier_hash: yup
    .string()
    .strict()
    .matches(
      /^(0x)?[\da-fA-F]+$/,
      "Invalid nullifier_hash. Must be a hex string with optional 0x prefix.",
    )
    .required("nullifier_hash is required for v3"),
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

// V4 response item schema
const v4ResponseItemSchema = yup.object({
  identifier: yup.string().required("identifier is required"),
  // V4 default signal_hash is zero (unlike v3 which uses keccak256 of empty string)
  signal_hash: yup
    .string()
    .matches(/^0x[\dabcdef]+$/, "Invalid signal_hash.")
    .default("0x0"),
  issuer_schema_id: yup
    .string()
    .required("issuer_schema_id is required for v4"),
  nullifier: yup.string().required("nullifier is required for v4"),
  nonce: yup.string().required("nonce is required for v4"),
  merkle_root: yup.string().required("merkle_root is required for v4"),
  proof_timestamp: yup.string().required("proof_timestamp is required for v4"),
  credential_genesis_issued_at_min: yup.string().optional(),
  compressed_proof: yup
    .array()
    .of(yup.string().required())
    .length(4)
    .required("compressed_proof is required for v4"),
});

// Base schema - responses validated in custom test based on protocol version
const schema = yup
  .object({
    // Protocol version at root level
    protocol_version: yup
      .string()
      .oneOf(["v3", "v4"])
      .required("protocol_version is required"),
    // Action identifier (required)
    action: yup.string().strict().required("action is required"),
    // Parameters for action creation (used if action_v4 doesn't exist)
    action_description: yup.string().optional().default(""),
    // Responses array - validated based on version
    responses: yup
      .array()
      .min(1, "At least one response item is required")
      .required("responses array is required"),
  })
  .test(
    "responses-schema",
    "Invalid response items for protocol version",
    function (value) {
      const { protocol_version, responses } = value;
      if (!responses || responses.length === 0) return true;

      const itemSchema =
        protocol_version === "v3" ? v3ResponseItemSchema : v4ResponseItemSchema;

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

// Type for verification result per response item
interface VerificationResult {
  identifier: string;
  success: boolean;
  nullifier?: string;
  code?: string;
  detail?: string;
}

// Type for parsed v3 response item
interface V3ResponseItem {
  // Identifier uses VerificationLevel values (legacy term for credential type)
  identifier: string;
  signal_hash: string;
  merkle_root: string;
  nullifier_hash: string;
  proof: string;
  max_age?: number;
}

// Type for parsed v4 response item
interface V4ResponseItem {
  identifier: string;
  signal_hash: string;
  issuer_schema_id: string;
  nullifier: string;
  nonce: string;
  merkle_root: string;
  proof_timestamp: string;
  credential_genesis_issued_at_min?: string;
  compressed_proof: string[];
}

/**
 * POST /api/v4/verify/:id
 *
 * Verifies World ID 4.0 proofs. Supports both app_id and rp_id as the route parameter.
 * Only works for migrated apps (those with rp_registration).
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { app_id: string } },
) {
  const routeId = params.app_id;

  if (!routeId) {
    return errorRequiredAttribute("app_id", req);
  }

  const rawBody = await req.text();

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch (error) {
    logger.warn("Invalid JSON in request body", {
      error,
      routeId,
      body: rawBody,
    });

    return errorResponse({
      statusCode: 400,
      code: "invalid_request",
      detail: "Invalid JSON in request body",
      attribute: null,
      req,
      app_id: routeId,
    });
  }

  const { isValid, parsedParams, handleError } = await validateRequestSchema({
    schema,
    value: body,
  });

  if (!isValid) {
    return handleError(req);
  }

  const client = await getAPIServiceGraphqlClient();

  // Resolve app_id/rp_id to rp_registration
  const resolveResult = await resolveRpRegistration(client, routeId);

  if (!resolveResult.success) {
    if (resolveResult.error === "invalid_format") {
      return errorResponse({
        statusCode: 400,
        code: "invalid_request",
        detail:
          "Invalid ID format. Expected app_id (app_xxx) or rp_id (rp_xxx).",
        attribute: "app_id",
        req,
        app_id: routeId,
      });
    }
    // error === "not_found"
    return errorResponse({
      statusCode: 400,
      code: "app_not_migrated",
      detail:
        "This app has not been migrated to World ID 4.0. Please use the v2 verify endpoint.",
      attribute: null,
      req,
      app_id: routeId,
    });
  }

  const rpRegistration = resolveResult.registration;

  // Check if RP registration is active
  if (rpRegistration.status !== RpRegistrationStatus.Registered) {
    return errorResponse({
      statusCode: 400,
      code: "rp_not_active",
      detail: "RP registration is not active.",
      attribute: null,
      req,
      app_id: routeId,
    });
  }

  // Validate app status
  const app = rpRegistration.app;
  if (app.status !== "active" || app.is_archived || app.deleted_at) {
    return errorResponse({
      statusCode: 404,
      code: "not_found",
      detail: "App not found. App may be no longer active.",
      attribute: null,
      req,
      app_id: routeId,
    });
  }

  const rpId = rpRegistration.rp_id;
  const appId = rpRegistration.app_id;

  // Version is at root level
  const proofVersion = parsedParams.protocol_version as "v3" | "v4";

  // Check if action already exists to determine environment for verification
  const existingActionResult = await getFetchActionV4Sdk(client).FetchActionV4({
    rp_id: rpId,
    action: parsedParams.action,
  });
  const existingActionV4 = existingActionResult.action_v4[0] ?? null;

  // Determine verification environment from existing action (default to production for new actions)
  const verificationEnvironment = existingActionV4?.environment ?? "production";

  // Verify all proofs in parallel
  const verificationResults: VerificationResult[] = [];

  if (proofVersion === "v3") {
    // World ID 3.0 proofs - verify via sequencer in parallel
    const externalNullifier = generateExternalNullifier(
      appId,
      parsedParams.action,
    ).digest;

    const v3Responses = parsedParams.responses as V3ResponseItem[];

    const v3Results = await Promise.all(
      v3Responses.map(async (item): Promise<VerificationResult> => {
        try {
          const { error, success } = await verifyProof(
            {
              signal_hash: item.signal_hash,
              proof: item.proof,
              merkle_root: item.merkle_root,
              nullifier_hash: item.nullifier_hash,
              external_nullifier: externalNullifier,
            },
            {
              // Use action's environment for staging determination
              is_staging: verificationEnvironment === "staging",
              // identifier uses VerificationLevel values (legacy term for credential type)
              verification_level: item.identifier as VerificationLevel | "face",
              max_age: item.max_age,
            },
          );

          if (error || !success) {
            return {
              identifier: item.identifier,
              success: false,
              code: error?.code || AppErrorCodes.GenericError,
              detail:
                error?.message || "There was an error verifying this proof.",
            };
          }

          // Use nullifier_hash_int for storage (consistent with v2 endpoint)
          const nullifier = nullifierHashToBigIntStr(item.nullifier_hash);
          return {
            identifier: item.identifier,
            success: true,
            nullifier,
          };
        } catch (e: unknown) {
          const errorMessage = e instanceof Error ? e.message : String(e);
          logger.error("Error verifying v3 proof", {
            error: errorMessage,
            rpId,
            identifier: item.identifier,
          });
          return {
            identifier: item.identifier,
            success: false,
            code: "verification_error",
            detail: errorMessage,
          };
        }
      }),
    );

    verificationResults.push(...v3Results);
  } else {
    // World ID 4.0 proofs - verify via on-chain Verifier in parallel
    const numericRpId = parseRpId(rpId);

    // Select verifier contract address based on environment
    const verifierAddress =
      verificationEnvironment === "staging"
        ? process.env.VERIFIER_CONTRACT_ADDRESS_STAGING
        : process.env.VERIFIER_CONTRACT_ADDRESS;

    if (!verifierAddress) {
      return errorResponse({
        statusCode: 500,
        code: "configuration_error",
        detail: `Verifier contract address not configured for ${verificationEnvironment} environment.`,
        attribute: null,
        req,
        app_id: routeId,
      });
    }

    const v4Responses = parsedParams.responses as V4ResponseItem[];

    const v4Results = await Promise.all(
      v4Responses.map(async (item): Promise<VerificationResult> => {
        try {
          const verifyResult = await verifyProofOnChain(
            {
              nullifier: BigInt(item.nullifier),
              action: hashActionToUint256(parsedParams.action),
              rpId: numericRpId,
              sessionId: 0n, // Not used in current implementation
              nonce: BigInt(item.nonce),
              signalHash: BigInt(item.signal_hash),
              authenticatorRoot: BigInt(item.merkle_root),
              proofTimestamp: BigInt(item.proof_timestamp),
              credentialIssuerId: BigInt(item.issuer_schema_id),
              credentialGenesisIssuedAtMin: BigInt(
                item.credential_genesis_issued_at_min || "0",
              ),
              compressedProof: item.compressed_proof.map((p) => BigInt(p)) as [
                bigint,
                bigint,
                bigint,
                bigint,
              ],
            },
            verifierAddress,
          );

          if (!verifyResult.success) {
            return {
              identifier: item.identifier,
              success: false,
              code: verifyResult.error?.code || AppErrorCodes.GenericError,
              detail:
                verifyResult.error?.detail ||
                "There was an error verifying this proof.",
            };
          }

          return {
            identifier: item.identifier,
            success: true,
            nullifier: item.nullifier,
          };
        } catch (e: unknown) {
          const errorMessage = e instanceof Error ? e.message : String(e);
          logger.error("Error verifying v4 proof", {
            error: errorMessage,
            rpId,
            identifier: item.identifier,
          });
          return {
            identifier: item.identifier,
            success: false,
            code: "verification_error",
            detail: errorMessage,
          };
        }
      }),
    );

    verificationResults.push(...v4Results);
  }

  // Find first successful result
  const firstSuccess = verificationResults.find((r) => r.success);
  const anySuccess = Boolean(firstSuccess);

  // If no successful verifications, return 400 with all results
  if (!anySuccess) {
    await captureEvent({
      event: "action_verify_v4_failed",
      distinctId: rpId,
      properties: {
        rp_id: rpId,
        app_id: appId,
        proof_type: proofVersion,
        results: verificationResults,
      },
    });

    logger.warn("All proof verifications failed", {
      req,
      rp_id: rpId,
      app_id: appId,
      results: verificationResults,
    });

    return NextResponse.json(
      {
        success: false,
        code: "all_verifications_failed",
        detail: "All proof verifications failed.",
        results: verificationResults,
      },
      { status: 400 },
    );
  }

  // Use nullifier from first successful verification (firstSuccess is guaranteed to exist here)
  const nullifierForStorage = firstSuccess!.nullifier!;

  // At least one proof is valid - now handle action creation and nullifier

  // Use existing action or create new one (always production for new actions)
  let actionV4 = existingActionV4;

  // If action doesn't exist, create it (always as production)
  if (!actionV4) {
    const createResult = await getCreateActionV4Sdk(client).CreateActionV4({
      rp_id: rpId,
      action: parsedParams.action,
      description: parsedParams.action_description || "",
      environment: "production",
    });

    actionV4 = createResult.insert_action_v4_one!;

    if (!actionV4) {
      return errorResponse({
        statusCode: 500,
        code: "internal_error",
        detail: "Failed to create action.",
        attribute: null,
        req,
        app_id: routeId,
      });
    }

    logger.info("Created new action_v4", {
      actionId: actionV4.id,
      rpId,
      action: parsedParams.action,
    });
  }

  // Check if nullifier already exists
  const checkNullifierResult = await getCheckNullifierV4Sdk(
    client,
  ).CheckNullifierV4({
    nullifier: nullifierForStorage,
  });

  const existingNullifier = checkNullifierResult.nullifier_v4[0];

  if (existingNullifier) {
    // Nullifier exists - check if we can skip (staging) or error (production)
    if (actionV4.environment === "staging") {
      // Skip saving - allow reuse in staging
      logger.info("Nullifier already exists, skipping save (staging)", {
        nullifier: nullifierForStorage,
        rpId,
        action: parsedParams.action,
        proof_type: proofVersion,
      });

      await captureEvent({
        event: "action_verify_v4_success",
        distinctId: rpId,
        properties: {
          rp_id: rpId,
          app_id: appId,
          action: parsedParams.action,
          environment: "staging",
          nullifier_reused: true,
          proof_type: proofVersion,
        },
      });

      return NextResponse.json(
        {
          success: true,
          action: actionV4.action,
          nullifier_hash: nullifierForStorage,
          uses: 1,
          created_at: existingNullifier.created_at,
          environment: actionV4.environment,
          proof_type: proofVersion,
          results: verificationResults,
          message: "Proof verified successfully (staging nullifier reuse)",
        },
        { status: 200 },
      );
    } else {
      // Production - error on duplicate nullifier
      return errorResponse({
        statusCode: 400,
        code: "max_verifications_reached",
        detail: "This person has already verified for this action.",
        attribute: null,
        req,
        app_id: routeId,
      });
    }
  }

  // Save the new nullifier
  try {
    const insertResult = await getInsertNullifierV4Sdk(
      client,
    ).InsertNullifierV4({
      action_v4_id: actionV4.id,
      nullifier: nullifierForStorage,
    });

    if (!insertResult.insert_nullifier_v4_one) {
      return errorResponse({
        statusCode: 500,
        code: "internal_error",
        detail: "Failed to save nullifier.",
        attribute: null,
        req,
        app_id: routeId,
      });
    }

    await captureEvent({
      event: "action_verify_v4_success",
      distinctId: rpId,
      properties: {
        rp_id: rpId,
        app_id: appId,
        action: parsedParams.action,
        environment: actionV4.environment,
        nullifier_reused: false,
        proof_type: proofVersion,
      },
    });

    return NextResponse.json(
      {
        success: true,
        action: actionV4.action,
        nullifier_hash: nullifierForStorage,
        uses: 1,
        created_at: insertResult.insert_nullifier_v4_one.created_at,
        environment: actionV4.environment,
        proof_type: proofVersion,
        results: verificationResults,
        message: "Proof verified successfully",
      },
      { status: 200 },
    );
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : String(e);

    // Check if it's a unique constraint violation (race condition)
    if (errorMessage.includes("unique") || errorMessage.includes("duplicate")) {
      if (actionV4.environment === "staging") {
        // Staging - allow the race condition, just return success
        return NextResponse.json(
          {
            success: true,
            action: actionV4.action,
            nullifier_hash: nullifierForStorage,
            uses: 1,
            environment: actionV4.environment,
            proof_type: proofVersion,
            results: verificationResults,
            message: "Proof verified successfully (staging nullifier reuse)",
          },
          { status: 200 },
        );
      } else {
        return errorResponse({
          statusCode: 400,
          code: "max_verifications_reached",
          detail: "This person has already verified for this action.",
          attribute: null,
          req,
          app_id: routeId,
        });
      }
    }

    logger.error("Error inserting nullifier", { error: errorMessage, rpId });

    return errorResponse({
      statusCode: 500,
      code: "internal_error",
      detail: "Failed to save nullifier.",
      attribute: null,
      req,
      app_id: routeId,
    });
  }
}
