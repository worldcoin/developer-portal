import { getSdk as getCheckUserSdk } from "@/api/hasura/graphql/checkUserInApp.generated";
import { errorHasuraQuery } from "@/api/helpers/errors";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { getKMSClient, scheduleKeyDeletion } from "@/api/helpers/kms";
import {
  getRpRegistryConfig,
  getStagingRpRegistryConfig,
  normalizeAddress,
  parseRpId,
} from "@/api/helpers/rp-utils";
import { submitTransferManagerTransaction } from "@/api/helpers/rp-transactions";
import { protectInternalEndpoint } from "@/api/helpers/utils";
import { validateRequestSchema } from "@/api/helpers/validate-request-schema";
import { logger } from "@/lib/logger";
import { isAddress } from "ethers";
import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";
import { getSdk as getClaimSlotSdk } from "./graphql/claim-mode-switch-slot.generated";
import { getSdk as getRpRegistrationSdk } from "./graphql/get-rp-registration.generated";
import { getSdk as getRevertStatusSdk } from "./graphql/revert-mode-switch-status.generated";
import { getSdk as getUpdateResultSdk } from "./graphql/update-mode-switch-result.generated";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

const schema = yup
  .object({
    app_id: yup.string().strict().required(),
    new_manager_address: yup
      .string()
      .strict()
      .required()
      .transform((value) => (value ? normalizeAddress(value) : value))
      .test(
        "is-address",
        "Invalid manager address. Must be 40 hex characters (0x followed by 40 characters)",
        (value) => (value ? isAddress(value) : false),
      )
      .test(
        "not-zero",
        "Cannot use zero address",
        (value) => value !== ZERO_ADDRESS,
      ),
  })
  .noUnknown();

/**
 * POST handler for the switch_to_self_managed Hasura action.
 *
 * This endpoint:
 * 1. Validates the user owns the app (ADMIN/OWNER)
 * 2. Verifies the RP is in managed mode and registered
 * 3. Claims the mode-switch slot (prevents concurrent operations)
 * 4. Submits an updateRp transaction to transfer the manager on-chain
 * 5. Updates the DB to self_managed mode, clears KMS key and signer address
 * 6. Schedules KMS key deletion
 */
export const POST = async (req: NextRequest) => {
  const { isAuthenticated, errorResponse } = protectInternalEndpoint(req);
  if (!isAuthenticated) {
    return errorResponse;
  }

  const body = await req.json();
  if (body?.action?.name !== "switch_to_self_managed") {
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

  const { app_id, new_manager_address } = parsedParams;

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

  // STEP 2: Verify user has permission (ADMIN or OWNER) before revealing feature state
  const { team } = await getCheckUserSdk(client).CheckUserInApp({
    team_id: teamId,
    app_id,
    user_id: userId,
  });

  if (!team || team.length === 0) {
    return errorHasuraQuery({
      req,
      detail: "User does not have permission to switch mode.",
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
      detail: "RP is already in self-managed mode.",
      code: "already_self_managed",
      app_id,
    });
  }

  const managerKmsKeyId = registration.manager_kms_key_id;

  // STEP 4: Claim mode-switch slot (status: registered → pending)
  const { update_rp_registration: claimResult } = await getClaimSlotSdk(
    client,
  ).ClaimModeSwitchSlot({ rp_id: rpIdString });

  if (!claimResult || claimResult.affected_rows === 0) {
    return errorHasuraQuery({
      req,
      detail:
        "Cannot switch mode. RP status is not 'registered' (another operation may be in progress).",
      code: "operation_in_progress",
      app_id,
    });
  }

  const rpId = parseRpId(rpIdString);

  // Helper to revert status on failure
  const revertStatus = async () => {
    try {
      await getRevertStatusSdk(client).RevertModeSwitchStatus({
        rp_id: rpIdString,
      });
    } catch (revertError) {
      logger.error("Failed to revert mode switch status", {
        error: revertError,
        app_id,
        rpIdString,
      });
    }
  };

  try {
    // STEP 5a: Submit primary manager transfer (required)
    const kmsClient = await getKMSClient(primaryConfig.kmsRegion);
    let operationHash: string;

    try {
      operationHash = await submitTransferManagerTransaction(primaryConfig, {
        rpId,
        newManagerAddress: new_manager_address,
        managerKmsKeyId,
        kmsClient,
      });
    } catch (error) {
      logger.error("Failed to submit manager transfer transaction", {
        error,
        app_id,
      });
      await revertStatus();
      return errorHasuraQuery({
        req,
        detail: "Failed to submit manager transfer transaction.",
        code: "submission_error",
        app_id,
      });
    }

    // STEP 5b: Duplicate to staging contract (best-effort, production only)
    if (process.env.NEXT_PUBLIC_APP_ENV === "production") {
      const stagingConfig = getStagingRpRegistryConfig();
      if (stagingConfig) {
        try {
          const stagingHash = await submitTransferManagerTransaction(
            stagingConfig,
            {
              rpId,
              newManagerAddress: new_manager_address,
              managerKmsKeyId,
              kmsClient,
            },
          );
          logger.info("Staging manager transfer submitted", {
            rpIdString,
            operationHash: stagingHash,
            contractAddress: stagingConfig.contractAddress,
          });
        } catch (error) {
          logger.error("Staging manager transfer failed", {
            error,
            rpIdString,
            contractAddress: stagingConfig.contractAddress,
          });
        }
      }
    }

    // STEP 6: Update DB to self-managed mode
    const { update_rp_registration_by_pk: updatedRegistration } =
      await getUpdateResultSdk(client).UpdateModeSwitchResult({
        rp_id: rpIdString,
        operation_hash: operationHash,
      });

    if (!updatedRegistration) {
      logger.error(
        "Failed to update registration record after manager transfer",
        { app_id, rpIdString, operationHash },
      );
      await revertStatus();
      return errorHasuraQuery({
        req,
        detail: "Failed to update registration record.",
        code: "db_error",
        app_id,
      });
    }

    // STEP 7: Invalidate status cache
    const redis = global.RedisClient;
    if (redis) {
      try {
        const cacheKey = `rp_status:${rpIdString}`;
        await redis.del(cacheKey);
        logger.info("Invalidated rp_status cache after mode switch", {
          rpIdString,
          cacheKey,
        });
      } catch (cacheError) {
        logger.warn("Failed to invalidate rp_status cache", {
          error: cacheError,
          rpIdString,
        });
        // Non-critical, continue
      }
    }

    // STEP 8: Schedule KMS key deletion
    await scheduleKeyDeletion(kmsClient, managerKmsKeyId);

    logger.info("Mode switch to self-managed successful", {
      app_id,
      rpIdString,
      new_manager_address,
      operationHash,
    });

    return NextResponse.json({
      rp_id: rpIdString,
      status: "pending",
      operation_hash: operationHash,
    });
  } catch (error) {
    logger.error("Unexpected error during mode switch", {
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
