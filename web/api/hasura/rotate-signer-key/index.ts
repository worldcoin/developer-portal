import { getSdk as getCheckUserSdk } from "@/api/hasura/graphql/checkUserInApp.generated";
import { errorHasuraQuery } from "@/api/helpers/errors";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { getKMSClient } from "@/api/helpers/kms";
import {
  getRpRegistryConfig,
  getStagingRpRegistryConfig,
  normalizeAddress,
  parseRpId,
} from "@/api/helpers/rp-utils";
import { submitRotateSignerTransaction } from "@/api/helpers/rp-transactions";
import { protectInternalEndpoint } from "@/api/helpers/utils";
import { validateRequestSchema } from "@/api/helpers/validate-request-schema";
import { logger } from "@/lib/logger";
import { isAddress } from "ethers";
import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";
import { getSdk as getClaimRotationSdk } from "./graphql/claim-rotation-slot.generated";
import { getSdk as getRpRegistrationSdk } from "./graphql/get-rp-registration.generated";
import { getSdk as getRevertStatusSdk } from "./graphql/revert-rotation-status.generated";
import { getSdk as getUpdateResultSdk } from "./graphql/update-rotation-result.generated";

/**
 * Input schema for the rotate_signer_key action.
 */
const schema = yup
  .object({
    app_id: yup.string().strict().required(),
    new_signer_address: yup
      .string()
      .strict()
      .required()
      .transform((value) => (value ? normalizeAddress(value) : value))
      .test(
        "is-address",
        "Invalid signer key. Must be 40 hex characters (0x followed by 40 characters)",
        (value) => (value ? isAddress(value) : false),
      ),
  })
  .noUnknown();

/**
 * POST handler for the rotate_signer_key Hasura action.
 *
 * This endpoint:
 * 1. Validates the user owns the app (ADMIN/OWNER)
 * 2. Verifies the RP is in managed mode
 * 3. Claims the rotation slot (prevents concurrent rotations)
 * 4. Builds and signs the updateRp transaction
 * 5. Submits to the temporal bundler
 * 6. Updates the registration with new signer address
 */
export const POST = async (req: NextRequest) => {
  const { isAuthenticated, errorResponse } = protectInternalEndpoint(req);
  if (!isAuthenticated) {
    return errorResponse;
  }

  const body = await req.json();
  if (body?.action?.name !== "rotate_signer_key") {
    return errorHasuraQuery({
      req,
      detail: "Invalid action.",
      code: "invalid_action",
    });
  }

  const userId = body.session_variables["x-hasura-user-id"];
  if (!userId) {
    return errorHasuraQuery({
      req,
      detail: "userId must be set.",
      code: "required",
    });
  }

  const { isValid, parsedParams } = await validateRequestSchema({
    value: body.input,
    schema,
  });

  if (!isValid || !parsedParams) {
    return errorHasuraQuery({
      req,
      detail: "Invalid request body.",
      code: "invalid_request",
    });
  }

  const { app_id, new_signer_address } = parsedParams;

  const primaryConfig = getRpRegistryConfig();
  if (!primaryConfig) {
    return errorHasuraQuery({
      req,
      detail: "Missing required environment variables for RP Registry.",
      code: "config_error",
    });
  }

  const client = await getAPIServiceGraphqlClient();

  // STEP 1: Fetch RP registration
  const { rp_registration } = await getRpRegistrationSdk(
    client,
  ).GetRpRegistration({ app_id });

  if (!rp_registration || rp_registration.length === 0) {
    return errorHasuraQuery({
      req,
      detail: "RP registration not found for this app.",
      code: "rp_not_registered",
      app_id,
    });
  }

  const registration = rp_registration[0];
  const rpIdString = registration.rp_id;
  const teamId = registration.app.team_id;
  const oldSignerAddress = registration.signer_address || "";

  // STEP 2: Verify user has permission (ADMIN or OWNER) before revealing feature state
  const { team } = await getCheckUserSdk(client).CheckUserInApp({
    team_id: teamId,
    app_id,
    user_id: userId,
  });

  if (!team || team.length === 0) {
    return errorHasuraQuery({
      req,
      detail: "User does not have permission to rotate signer key.",
      code: "unauthorized",
      app_id,
    });
  }

  // Check if team is enabled for World ID 4.0
  const enabledTeams = await global.ParameterStore?.getParameter<string[]>(
    "world-id-4-0/enabled-teams",
    [],
  );

  if (!enabledTeams?.includes(teamId)) {
    return errorHasuraQuery({
      req,
      detail: "World ID 4.0 is not enabled for this team.",
      code: "feature_not_enabled",
      app_id,
    });
  }

  // STEP 3: Verify mode is managed
  if (registration.mode !== "managed" || !registration.manager_kms_key_id) {
    return errorHasuraQuery({
      req,
      detail:
        "RP is in self-managed mode. You must handle signer key rotation yourself.",
      code: "self_managed_mode",
      app_id,
    });
  }

  const managerKmsKeyId = registration.manager_kms_key_id;

  // STEP 4: Atomically claim rotation slot (status: registered → pending)
  const { update_rp_registration: claimResult } = await getClaimRotationSdk(
    client,
  ).ClaimRotationSlot({ rp_id: rpIdString });

  if (!claimResult || claimResult.affected_rows === 0) {
    return errorHasuraQuery({
      req,
      detail:
        "Cannot rotate signer key. RP status is not 'registered' (rotation may already be in progress).",
      code: "rotation_in_progress",
      app_id,
    });
  }

  const rpId = parseRpId(rpIdString);

  // Helper to revert status on failure
  const revertStatus = async () => {
    try {
      await getRevertStatusSdk(client).RevertRotationStatus({
        rp_id: rpIdString,
      });
    } catch (revertError) {
      logger.error("Failed to revert rotation status", {
        error: revertError,
        app_id,
        rpIdString,
      });
    }
  };

  try {
    // STEP 5a: Submit primary signer rotation (required)
    const kmsClient = await getKMSClient(primaryConfig.kmsRegion);
    let operationHash: string;

    try {
      operationHash = await submitRotateSignerTransaction(primaryConfig, {
        rpId,
        newSignerAddress: new_signer_address,
        managerKmsKeyId,
        kmsClient,
      });
    } catch (error) {
      logger.error("Failed to submit signer rotation transaction", {
        error,
        app_id,
      });
      await revertStatus();
      return errorHasuraQuery({
        req,
        detail: "Failed to submit signer rotation transaction.",
        code: "submission_error",
        app_id,
      });
    }

    // STEP 5b: Duplicate to staging contract (best-effort, production only)
    if (process.env.NEXT_PUBLIC_APP_ENV === "production") {
      const stagingConfig = getStagingRpRegistryConfig();
      if (stagingConfig) {
        try {
          const stagingHash = await submitRotateSignerTransaction(
            stagingConfig,
            {
              rpId,
              newSignerAddress: new_signer_address,
              managerKmsKeyId,
              kmsClient,
            },
          );
          logger.info("Staging signer rotation submitted", {
            rpIdString,
            operationHash: stagingHash,
            contractAddress: stagingConfig.contractAddress,
          });
        } catch (error) {
          logger.error("Staging signer rotation failed", {
            error,
            rpIdString,
            contractAddress: stagingConfig.contractAddress,
          });
        }
      }
    }

    // STEP 6: Update the registration with new signer address and operation hash
    const { update_rp_registration_by_pk: updatedRegistration } =
      await getUpdateResultSdk(client).UpdateRotationResult({
        rp_id: rpIdString,
        signer_address: new_signer_address,
        operation_hash: operationHash,
      });

    if (!updatedRegistration) {
      // On-chain tx may succeed; manual intervention needed to reconcile state
      logger.error("Failed to update registration record after submission", {
        app_id,
        rpIdString,
        operationHash,
      });
      return errorHasuraQuery({
        req,
        detail: "Failed to update registration record.",
        code: "db_error",
        app_id,
      });
    }

    logger.info("Signer key rotation successful", {
      app_id,
      rpIdString,
      oldSignerAddress,
      new_signer_address,
      operationHash,
    });

    return NextResponse.json({
      rp_id: rpIdString,
      new_signer_address,
      old_signer_address: oldSignerAddress,
      status: "pending",
      operation_hash: operationHash,
    });
  } catch (error) {
    logger.error("Unexpected error during signer key rotation", {
      error,
      app_id,
    });
    await revertStatus();
    return errorHasuraQuery({
      req,
      detail: "An unexpected error occurred.",
      code: "internal_error",
      app_id,
    });
  }
};
