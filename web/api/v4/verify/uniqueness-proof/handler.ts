import { errorResponse, ErrorResponseBody } from "@/api/helpers/errors";
import { logPortalEvent } from "@/api/helpers/portal-events";
import { parseRpId } from "@/api/helpers/rp-utils";
import {
  encodeNullifierForStorage,
  normalizeNullifierHash,
} from "@/api/helpers/verify";
import { logger } from "@/lib/logger";
import { captureEvent } from "@/services/posthogClient";
import { GraphQLClient } from "graphql-request";
import { NextRequest, NextResponse } from "next/server";
import { getSdk as getAtomicUpsertNullifierV4Sdk } from "../graphql/atomic-upsert-nullifier-v4.generated";
import { getSdk as getCreateActionV4Sdk } from "../graphql/create-action-v4.generated";
import { getSdk as getFetchActionV4Sdk } from "../graphql/fetch-action-v4.generated";
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
  attribute?: string;
}

// Response types
type UniquenessProofSuccessResponse = {
  success: true;
  action: string;
  nullifier: string; // Hex format `0x` prefixed
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
    environment?: "production" | "staging" | "sandbox";
  },
  req: NextRequest,
): Promise<NextResponse<UniquenessProofResponse | ErrorResponseBody>> {
  // Resolve sandbox to staging for verifier/storage while preserving the
  // requested environment for API responses.
  const requestedEnvironment = parsedParams.environment ?? "production";
  const verificationEnvironment =
    requestedEnvironment === "sandbox" ? "staging" : requestedEnvironment;

  // Fetch existing action filtered by environment
  let existingActionV4 = null;

  if (parsedParams.action) {
    const existingActionResult = await getFetchActionV4Sdk(
      client,
    ).FetchActionV4({
      rp_id: rpId,
      action: parsedParams.action,
      environment: verificationEnvironment,
    });
    existingActionV4 = existingActionResult.action_v4[0] ?? null;
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
        { status: 400 },
      );
    }

    // World ID 4.0 uniqueness proofs - verify via on-chain Verifier in parallel
    const numericRpId = parseRpId(rpId);
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

  // We normalize the nullifier to hex for the response, to match the request format which expects a hex string.
  const normalizedNullifier = normalizeNullifierHash(firstSuccess!.nullifier!);

  // At least one proof is valid - now handle action creation and nullifier

  // Use existing action or create new one for the resolved environment
  let actionV4 = existingActionV4;

  // If action doesn't exist, create it with the resolved environment
  if (!actionV4) {
    const createResult = await getCreateActionV4Sdk(client).CreateActionV4({
      rp_id: rpId,
      action: parsedParams.action!,
      description: parsedParams.action_description || "",
      environment: verificationEnvironment,
    });

    actionV4 = createResult.insert_action_v4_one!;

    if (!actionV4) {
      return errorResponse({
        statusCode: 500,
        code: "internal_error",
        detail: "Failed to create action.",
        attribute: null,
        req,
        app_id: appId,
      });
    }

    logger.info("Created new action_v4", {
      actionId: actionV4.id,
      rpId,
      action: parsedParams.action,
    });
  }

  // Atomically count the verification: insert with uses: 0 (on conflict do nothing),
  // then increment by 1 filtered by action — both fields run in one Hasura transaction.
  // The action_v4_id filter is the cross-action guard; anything other than exactly one
  // updated row is a server error, so there is no HTTP success without a committed count.
  let upsertResult;
  try {
    upsertResult = await getAtomicUpsertNullifierV4Sdk(
      client,
    ).AtomicUpsertNullifierV4({
      action_v4_id: actionV4.id,
      nullifier: nullifierForStorage,
    });
  } catch (e: unknown) {
    logger.error("Error upserting nullifier", {
      error: e instanceof Error ? e.message : String(e),
      rpId,
    });

    return NextResponse.json<UniquenessProofErrorResponse>(
      {
        success: false,
        code: "internal_error",
        detail: "Failed to save nullifier.",
      },
      { status: 500 },
    );
  }

  const updatedRows = upsertResult.update_nullifier_v4?.affected_rows ?? 0;
  const nullifierRow = upsertResult.update_nullifier_v4?.returning?.[0];

  if (updatedRows !== 1 || !nullifierRow) {
    // Zero rows means the nullifier exists under a different action.
    logger.error("Nullifier upsert affected an unexpected row count", {
      affectedRows: updatedRows,
      rpId,
      actionId: actionV4.id,
      action: parsedParams.action,
      protocol_version: protocolVersion,
    });

    return NextResponse.json<UniquenessProofErrorResponse>(
      {
        success: false,
        code: "internal_error",
        detail: "Failed to save nullifier.",
      },
      { status: 500 },
    );
  }

  const nullifierReused = !upsertResult.insert_nullifier_v4_one;

  if (nullifierReused) {
    logger.info("Nullifier reused", {
      nullifier: nullifierForStorage,
      rpId,
      action: parsedParams.action,
      uses: nullifierRow.uses,
      protocol_version: protocolVersion,
    });
  }

  await captureEvent({
    event: "action_verify_v4_success",
    distinctId: rpId,
    properties: {
      rp_id: rpId,
      app_id: appId,
      action: parsedParams.action,
      environment: requestedEnvironment,
      nullifier_reused: nullifierReused,
      protocol_version: protocolVersion,
    },
  });

  logPortalEvent({
    event: "action_verification",
    actor: "human",
    app_id: appId,
    action: parsedParams.action,
    metadata: {
      rp_id: rpId,
      environment: requestedEnvironment,
      nullifier_reused: nullifierReused,
      protocol_version: protocolVersion,
    },
  });

  return NextResponse.json<UniquenessProofSuccessResponse>(
    {
      success: true,
      action: actionV4.action,
      nullifier: normalizedNullifier,
      created_at: nullifierRow.created_at,
      environment: requestedEnvironment,
      results: verificationResults,
      message: nullifierReused
        ? "Proof verified successfully (nullifier reuse)"
        : "Proof verified successfully",
    },
    { status: 200 },
  );
}
