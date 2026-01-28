import { errorRequiredAttribute, errorResponse } from "@/api/helpers/errors";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import {
  hashActionToUint256,
  isValidRpId,
  parseRpId,
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
import { getSdk as getFetchRpRegistrationSdk } from "./graphql/fetch-rp-registration.generated";
import { getSdk as getInsertNullifierV4Sdk } from "./graphql/insert-nullifier-v4.generated";

const VerificationLevelWithFace = {
  ...VerificationLevel,
  Face: "face" as const,
};

/**
 * Schema for v4 verify request - supports both v3 (cloud) and v4 (on-chain) proofs.
 *
 * V3 proofs include: merkle_root, nullifier_hash, proof, verification_level
 * V4 proofs include: responses array with identifier, issuer_schema_id, proof, nullifier
 */
const schema = yup
  .object({
    // Action identifier (required for both)
    action: yup.string().strict().required("action is required"),
    // Signal hash (optional, defaults to hash of empty string)
    signal_hash: yup
      .string()
      .matches(/^0x[\dabcdef]+$/, "Invalid signal_hash.")
      .default(
        "0x00c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a4",
      ),
    // Parameters for action creation (used if action_v4 doesn't exist)
    action_description: yup.string().optional().default(""),
    environment: yup
      .string()
      .oneOf(["staging", "production"])
      .default("production"),

    // V4 proof fields (responses array)
    responses: yup
      .array()
      .of(
        yup.object({
          identifier: yup.string().required("identifier is required"),
          issuer_schema_id: yup
            .string()
            .required("issuer_schema_id is required"),
          nullifier: yup.string(),
          session_id: yup.string(),
          nonce: yup.string(),
          authenticator_root: yup.string(),
          proof_timestamp: yup.string(),
          credential_genesis_issued_at_min: yup.string(),
          compressed_proof: yup.array().of(yup.string()).length(4).optional(),
          error: yup.string(),
        }),
      )
      .optional(),

    // V3 proof fields (cloud/sequencer)
    merkle_root: yup.string().strict().optional(),
    nullifier_hash: yup
      .string()
      .strict()
      .matches(
        /^(0x)?[\da-fA-F]+$/,
        "Invalid nullifier_hash. Must be a hex string with optional 0x prefix.",
      )
      .optional(),
    proof: yup.string().strict().optional(),
    verification_level: yup
      .string()
      .oneOf(Object.values(VerificationLevelWithFace))
      .optional(),
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
  })
  .test(
    "proof-type-exclusivity",
    "Cannot mix v3 and v4 proof formats. Provide either 'responses' array (v4) or 'merkle_root', 'nullifier_hash', 'proof', and 'verification_level' (v3), not both.",
    (value) => {
      const hasV4 = Boolean(value.responses && value.responses.length > 0);
      const hasV3 = Boolean(
        value.merkle_root ||
          value.nullifier_hash ||
          value.proof ||
          value.verification_level,
      );
      return !(hasV4 && hasV3);
    },
  )
  .test(
    "proof-type-required",
    "Invalid proof format. Provide either 'responses' array (v4) or all of 'merkle_root', 'nullifier_hash', 'proof', and 'verification_level' (v3).",
    (value) => {
      const hasV4 = Boolean(value.responses && value.responses.length > 0);
      const isV3Complete = Boolean(
        value.merkle_root &&
          value.nullifier_hash &&
          value.proof &&
          value.verification_level,
      );
      return hasV4 || isV3Complete;
    },
  );

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
  let rpRegistration: {
    rp_id: string;
    app_id: string;
    status: string;
    app: {
      id: string;
      is_staging: boolean;
      status: string;
      is_archived: boolean;
      deleted_at?: string | null;
      app_mode: string | null;
    };
  } | null = null;

  if (isValidRpId(routeId)) {
    const response = await getFetchRpRegistrationSdk(
      client,
    ).FetchRpRegistrationByRpId({
      rp_id: routeId,
    });
    const reg = response.rp_registration[0];
    if (reg) {
      const appWithMetadata = reg.app as typeof reg.app & {
        app_metadata?: Array<{ app_mode: string }>;
      };
      rpRegistration = {
        rp_id: reg.rp_id,
        app_id: reg.app_id,
        status: reg.status as string,
        app: {
          ...reg.app,
          app_mode: appWithMetadata.app_metadata?.[0]?.app_mode ?? null,
        },
      };
    }
  } else if (routeId.startsWith("app_")) {
    const response = await getFetchRpRegistrationSdk(
      client,
    ).FetchRpRegistration({
      app_id: routeId,
    });
    const reg = response.rp_registration[0];
    if (reg) {
      const appWithMetadata = reg.app as typeof reg.app & {
        app_metadata?: Array<{ app_mode: string }>;
      };
      rpRegistration = {
        rp_id: reg.rp_id,
        app_id: reg.app_id,
        status: reg.status as string,
        app: {
          ...reg.app,
          app_mode: appWithMetadata.app_metadata?.[0]?.app_mode ?? null,
        },
      };
    }
  } else {
    return errorResponse({
      statusCode: 400,
      code: "invalid_request",
      detail: "Invalid ID format. Expected app_id (app_xxx) or rp_id (rp_xxx).",
      attribute: "app_id",
      req,
      app_id: routeId,
    });
  }

  // Check if the app is migrated (has rp_registration)
  if (!rpRegistration) {
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

  // Check if RP registration is active
  if (rpRegistration.status !== "registered") {
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
  const isStaging = app.is_staging;

  // Determine proof type (validated by schema)
  const isV4Proof = Boolean(
    parsedParams.responses && parsedParams.responses.length > 0,
  );
  const isV3Proof = !isV4Proof;
  // Environment is per-action (not per-app). Developers can create staging
  // actions for testing (allows nullifier reuse) or production actions
  // (enforces uniqueness). Restrictions: staging requires v4 proofs and
  // is not available for mini-apps.
  const requestedEnvironment = parsedParams.environment as
    | "staging"
    | "production";

  // Staging actions only allowed for v4 proofs
  if (requestedEnvironment === "staging" && isV3Proof) {
    return errorResponse({
      statusCode: 400,
      code: "staging_requires_v4",
      detail: "Staging actions can only be created with World ID 4.0 proofs.",
      attribute: "environment",
      req,
      app_id: routeId,
    });
  }

  // Staging actions only allowed for external apps (not mini-apps)
  if (requestedEnvironment === "staging" && app.app_mode === "mini-app") {
    return errorResponse({
      statusCode: 400,
      code: "staging_not_allowed_for_mini_apps",
      detail:
        "Staging actions are not allowed for mini apps. Only external apps can use staging environment.",
      attribute: "environment",
      req,
      app_id: routeId,
    });
  }

  let nullifierForStorage: string;
  let proofType: "v3" | "v4";
  let prefetchedActionV4:
    | Awaited<
        ReturnType<ReturnType<typeof getFetchActionV4Sdk>["FetchActionV4"]>
      >["action_v4"][0]
    | null = null;

  if (isV3Proof) {
    // World ID 3.0 proof - verify via sequencer
    proofType = "v3";

    const externalNullifier = generateExternalNullifier(
      appId,
      parsedParams.action,
    ).digest;

    try {
      const { error, success } = await verifyProof(
        {
          signal_hash: parsedParams.signal_hash,
          proof: parsedParams.proof!,
          merkle_root: parsedParams.merkle_root!,
          nullifier_hash: parsedParams.nullifier_hash!,
          external_nullifier: externalNullifier,
        },
        {
          is_staging: isStaging,
          verification_level: parsedParams.verification_level as
            | VerificationLevel
            | "face",
          max_age: parsedParams.max_age,
        },
      );

      if (error || !success) {
        await captureEvent({
          event: "action_verify_v4_failed",
          distinctId: rpId,
          properties: {
            rp_id: rpId,
            app_id: appId,
            environment: parsedParams.environment,
            proof_type: "v3",
            error: error,
          },
        });

        return errorResponse({
          statusCode: error?.statusCode || 400,
          code: error?.code || AppErrorCodes.GenericError,
          detail: error?.message || "There was an error verifying this proof.",
          attribute: error?.attribute || null,
          req,
          app_id: routeId,
        });
      }
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      logger.error("Error verifying v3 proof", { error: errorMessage, rpId });

      return errorResponse({
        statusCode: 400,
        code: "verification_error",
        detail: errorMessage,
        attribute: null,
        req,
        app_id: routeId,
      });
    }

    // Use nullifier_hash_int for storage (consistent with v2 endpoint)
    nullifierForStorage = nullifierHashToBigIntStr(
      parsedParams.nullifier_hash!,
    );
  } else {
    // World ID 4.0 proof - verify via on-chain Verifier
    proofType = "v4";

    // Find a valid response item with all required v4 fields
    const validResponse = parsedParams.responses!.find(
      (r) =>
        r.compressed_proof &&
        r.compressed_proof.length === 4 &&
        r.nullifier &&
        r.session_id &&
        r.nonce &&
        r.authenticator_root &&
        r.proof_timestamp &&
        !r.error,
    );

    if (!validResponse) {
      return errorResponse({
        statusCode: 400,
        code: "no_valid_proof",
        detail:
          "No valid proof found in the responses. Required fields: compressed_proof, nullifier, session_id, nonce, authenticator_root, proof_timestamp.",
        attribute: "responses",
        req,
        app_id: routeId,
      });
    }

    // Extract the numeric rp_id for the on-chain call
    const numericRpId = parseRpId(rpId);

    // Check if action already exists to determine environment for verification
    const existingActionResult = await getFetchActionV4Sdk(
      client,
    ).FetchActionV4({
      rp_id: rpId,
      action: parsedParams.action,
    });
    prefetchedActionV4 = existingActionResult.action_v4[0] ?? null;

    // Determine environment: use existing action's env or requested env
    const verificationEnvironment =
      prefetchedActionV4?.environment ?? parsedParams.environment;

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

    try {
      const verifyResult = await verifyProofOnChain(
        {
          nullifier: BigInt(validResponse.nullifier!),
          action: hashActionToUint256(parsedParams.action),
          rpId: numericRpId,
          sessionId: BigInt(validResponse.session_id!),
          nonce: BigInt(validResponse.nonce!),
          signalHash: BigInt(parsedParams.signal_hash),
          authenticatorRoot: BigInt(validResponse.authenticator_root!),
          proofTimestamp: BigInt(validResponse.proof_timestamp!),
          credentialIssuerId: BigInt(validResponse.issuer_schema_id),
          credentialGenesisIssuedAtMin: BigInt(
            validResponse.credential_genesis_issued_at_min || "0",
          ),
          compressedProof: validResponse.compressed_proof!.map((p) =>
            BigInt(p!),
          ) as [bigint, bigint, bigint, bigint],
        },
        verifierAddress,
      );

      if (!verifyResult.success) {
        await captureEvent({
          event: "action_verify_v4_failed",
          distinctId: rpId,
          properties: {
            rp_id: rpId,
            app_id: appId,
            environment: parsedParams.environment,
            proof_type: "v4",
            error: verifyResult.error,
          },
        });

        return errorResponse({
          statusCode: 400,
          code: verifyResult.error?.code || AppErrorCodes.GenericError,
          detail:
            verifyResult.error?.detail ||
            "There was an error verifying this proof.",
          attribute: null,
          req,
          app_id: routeId,
        });
      }
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      logger.error("Error verifying v4 proof", { error: errorMessage, rpId });

      return errorResponse({
        statusCode: 400,
        code: "verification_error",
        detail: errorMessage,
        attribute: null,
        req,
        app_id: routeId,
      });
    }

    nullifierForStorage = validResponse.nullifier!;
  }

  // Proof is valid - now handle action creation and nullifier

  // Check if action_v4 exists (use prefetched for v4 proofs, fetch for v3)
  let actionV4 = prefetchedActionV4;
  if (!actionV4 && isV3Proof) {
    const fetchActionResult = await getFetchActionV4Sdk(client).FetchActionV4({
      rp_id: rpId,
      action: parsedParams.action,
    });
    actionV4 = fetchActionResult.action_v4[0];
  }

  // If action doesn't exist, create it
  if (!actionV4) {
    const createResult = await getCreateActionV4Sdk(client).CreateActionV4({
      rp_id: rpId,
      action: parsedParams.action,
      description: parsedParams.action_description || "",
      environment: requestedEnvironment,
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
        proof_type: proofType,
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
          proof_type: proofType,
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
          proof_type: proofType,
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
        proof_type: proofType,
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
        proof_type: proofType,
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
            proof_type: proofType,
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
