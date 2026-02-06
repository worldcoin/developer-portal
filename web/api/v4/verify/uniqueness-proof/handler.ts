import { parseRpId } from "@/api/helpers/rp-utils";
import { encodeNullifierForStorage } from "@/api/helpers/verify";
import { logger } from "@/lib/logger";
import { captureEvent } from "@/services/posthogClient";
import { GraphQLClient } from "graphql-request";
import { NextResponse } from "next/server";
import { getSdk as getCheckNullifierV4Sdk } from "../graphql/check-nullifier-v4.generated";
import { getSdk as getCreateActionV4Sdk } from "../graphql/create-action-v4.generated";
import { getSdk as getFetchActionV4Sdk } from "../graphql/fetch-action-v4.generated";
import { getSdk as getInsertNullifierV4Sdk } from "../graphql/insert-nullifier-v4.generated";
import {
  UniquenessProofResponseV3,
  UniquenessProofResponseV4,
} from "../request-schema";
import { processUniquenessProofV3 } from "./verify-v3";
import { processUniquenessProofV4 } from "./verify-v4";

// Unified result type for both v3 and v4
export interface UniquenessResult {
  identifier: string;
  success: boolean;
  nullifier?: string;
  code?: string;
  detail?: string;
}

// Response types
type UniquenessProofSuccessResponse = {
  success: true;
  action: string;
  nullifier: string;
  created_at?: string;
  environment: string;
  results: UniquenessResult[];
  message: string;
};

type UniquenessProofErrorResponse = {
  success: false;
  code: string;
  detail: string;
  results?: UniquenessResult[];
};

type UniquenessProofResponse =
  | UniquenessProofSuccessResponse
  | UniquenessProofErrorResponse;

/**
 * Handle uniqueness proof verification flow.
 * Supports both v3 (cloud/sequencer) and v4 (on-chain) proofs.
 */
export async function handleUniquenessProofVerification(
  client: GraphQLClient,
  rpId: string,
  appId: string,
  parsedParams: {
    action: string;
    action_description?: string;
    nonce?: string;
    protocol_version: "3.0" | "4.0";
    responses: UniquenessProofResponseV3[] | UniquenessProofResponseV4[];
    environment?: "production" | "staging";
  },
): Promise<NextResponse<UniquenessProofResponse>> {
  // For uniqueness proofs check if action already exists to determine environment
  // Priority: explicit request environment > DB action environment > "production" default
  let existingActionV4 = null;
  let verificationEnvironment = "production";

  if (parsedParams.action) {
    const existingActionResult = await getFetchActionV4Sdk(
      client,
    ).FetchActionV4({
      rp_id: rpId,
      action: parsedParams.action,
    });
    existingActionV4 = existingActionResult.action_v4[0] ?? null;
    verificationEnvironment =
      parsedParams.environment ??
      (existingActionV4?.environment as string) ??
      "production";
  }

  // Verify all proofs in parallel
  let verificationResults: UniquenessResult[] = [];

  const protocolVersion = parsedParams.protocol_version;
  if (protocolVersion === "3.0") {
    // World ID 3.0 proofs - verify via sequencer in parallel
    verificationResults = await processUniquenessProofV3(
      appId,
      parsedParams.action!,
      parsedParams.responses as UniquenessProofResponseV3[],
      verificationEnvironment === "staging",
    );
  } else {
    // World ID 4.0 uniqueness proofs - verify via on-chain Verifier in parallel
    const numericRpId = parseRpId(rpId);

    // Select verifier contract address based on environment
    const verifierAddress =
      verificationEnvironment === "staging"
        ? process.env.VERIFIER_CONTRACT_ADDRESS_STAGING
        : process.env.VERIFIER_CONTRACT_ADDRESS;

    if (!verifierAddress) {
      return NextResponse.json<UniquenessProofErrorResponse>(
        {
          success: false,
          code: "configuration_error",
          detail: `Verifier contract address not configured for ${verificationEnvironment} environment.`,
        },
        { status: 500 },
      );
    }

    verificationResults = await processUniquenessProofV4(
      numericRpId,
      parsedParams.nonce!,
      parsedParams.action!,
      parsedParams.responses as UniquenessProofResponseV4[],
      verifierAddress,
    );
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
        protocol_version: protocolVersion,
        results: verificationResults,
      },
    });

    logger.warn("All proof verifications failed", {
      rp_id: rpId,
      app_id: appId,
      results: verificationResults,
    });

    return NextResponse.json<UniquenessProofErrorResponse>(
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
  const nullifierForStorage = encodeNullifierForStorage(
    firstSuccess!.nullifier!,
  );

  // At least one proof is valid - now handle action creation and nullifier

  // Use existing action or create new one (always production for new actions)
  let actionV4 = existingActionV4;

  // If action doesn't exist, create it (always as production)
  if (!actionV4) {
    const createResult = await getCreateActionV4Sdk(client).CreateActionV4({
      rp_id: rpId,
      action: parsedParams.action!,
      description: parsedParams.action_description || "",
      environment: "production",
    });

    actionV4 = createResult.insert_action_v4_one!;

    if (!actionV4) {
      return NextResponse.json<UniquenessProofErrorResponse>(
        {
          success: false,
          code: "internal_error",
          detail: "Failed to create action.",
        },
        { status: 500 },
      );
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
        protocol_version: protocolVersion,
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
          protocol_version: protocolVersion,
        },
      });

      return NextResponse.json<UniquenessProofSuccessResponse>(
        {
          success: true,
          action: actionV4.action,
          nullifier: nullifierForStorage,
          created_at: existingNullifier.created_at,
          environment: actionV4.environment as string,
          results: verificationResults,
          message: "Proof verified successfully (staging nullifier reuse)",
        },
        { status: 200 },
      );
    } else {
      // Production - error on duplicate nullifier
      return NextResponse.json<UniquenessProofErrorResponse>(
        {
          success: false,
          code: "max_verifications_reached",
          detail: "This person has already verified for this action.",
        },
        { status: 400 },
      );
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
      return NextResponse.json<UniquenessProofErrorResponse>(
        {
          success: false,
          code: "internal_error",
          detail: "Failed to save nullifier.",
        },
        { status: 500 },
      );
    }

    await captureEvent({
      event: "action_verify_v4_success",
      distinctId: rpId,
      properties: {
        rp_id: rpId,
        app_id: appId,
        action: parsedParams.action,
        environment: actionV4.environment as string,
        nullifier_reused: false,
        protocol_version: protocolVersion,
      },
    });

    return NextResponse.json<UniquenessProofSuccessResponse>(
      {
        success: true,
        action: actionV4.action,
        nullifier: nullifierForStorage,
        created_at: insertResult.insert_nullifier_v4_one.created_at,
        environment: actionV4.environment as string,
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
        return NextResponse.json<UniquenessProofSuccessResponse>(
          {
            success: true,
            action: actionV4.action,
            nullifier: nullifierForStorage,
            environment: actionV4.environment as string,
            results: verificationResults,
            message: "Proof verified successfully (staging nullifier reuse)",
          },
          { status: 200 },
        );
      } else {
        return NextResponse.json<UniquenessProofErrorResponse>(
          {
            success: false,
            code: "max_verifications_reached",
            detail: "This person has already verified for this action.",
          },
          { status: 400 },
        );
      }
    }

    logger.error("Error inserting nullifier", { error: errorMessage, rpId });

    return NextResponse.json<UniquenessProofErrorResponse>(
      {
        success: false,
        code: "internal_error",
        detail: "Failed to save nullifier.",
      },
      { status: 500 },
    );
  }
}
