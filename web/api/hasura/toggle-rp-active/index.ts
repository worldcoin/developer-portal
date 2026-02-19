import { getSdk as getCheckUserSdk } from "@/api/hasura/graphql/checkUserInApp.generated";
import { errorHasuraQuery } from "@/api/helpers/errors";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { getKMSClient } from "@/api/helpers/kms";
import {
  getRpRegistryConfig,
  getStagingRpRegistryConfig,
  parseRpId,
} from "@/api/helpers/rp-utils";
import { submitToggleRpActiveTransaction } from "@/api/helpers/rp-transactions";
import { getRpFromContract } from "@/api/helpers/temporal-rpc";
import { protectInternalEndpoint } from "@/api/helpers/utils";
import { validateRequestSchema } from "@/api/helpers/validate-request-schema";
import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";
import { getSdk as getClaimSlotSdk } from "./graphql/claim-toggle-slot.generated";
import { getSdk as getRpRegistrationSdk } from "./graphql/get-rp-registration.generated";
import { getSdk as getRevertStatusSdk } from "./graphql/revert-toggle-status.generated";
import { getSdk as getUpdateResultSdk } from "./graphql/update-toggle-result.generated";

const schema = yup
  .object({
    app_id: yup.string().strict().required(),
  })
  .noUnknown();

/**
 * POST handler for the toggle_rp_active Hasura action.
 *
 * This endpoint:
 * 1. Validates the user owns the app (ADMIN/OWNER)
 * 2. Verifies the RP is in managed mode and in a toggleable state
 * 3. Claims the toggle slot (prevents concurrent operations)
 * 4. Submits an updateRp transaction with toggleActive: true
 * 5. Updates the DB with the operation hash
 */
export const POST = async (req: NextRequest) => {
  const { isAuthenticated, errorResponse } = protectInternalEndpoint(req);
  if (!isAuthenticated) {
    return errorResponse;
  }

  const body = await req.json();
  if (body?.action?.name !== "toggle_rp_active") {
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

  const { app_id } = parsedParams;

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
  const currentStatus = registration.status as string;

  // STEP 2: Verify user has permission (ADMIN or OWNER) before revealing feature state
  const { team } = await getCheckUserSdk(client).CheckUserInApp({
    team_id: teamId,
    app_id,
    user_id: userId,
  });

  if (!team || team.length === 0) {
    return errorHasuraQuery({
      req,
      detail: "User does not have permission to toggle RP status.",
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
        "RP is in self-managed mode. You must toggle active status on-chain yourself.",
      code: "self_managed_mode",
      app_id,
    });
  }

  // STEP 4: Verify status is toggleable
  if (currentStatus !== "registered" && currentStatus !== "deactivated") {
    return errorHasuraQuery({
      req,
      detail: `Cannot toggle RP. Current status is '${currentStatus}'. Must be 'registered' or 'deactivated'.`,
      code: "invalid_status",
      app_id,
    });
  }

  const managerKmsKeyId = registration.manager_kms_key_id;

  // STEP 5: Claim toggle slot (status → pending)
  const { update_rp_registration: claimResult } = await getClaimSlotSdk(
    client,
  ).ClaimToggleSlot({
    rp_id: rpIdString,
    current_status: currentStatus as "registered" | "deactivated",
  });

  if (!claimResult || claimResult.affected_rows === 0) {
    return errorHasuraQuery({
      req,
      detail: "Cannot toggle RP. Another operation may already be in progress.",
      code: "operation_in_progress",
      app_id,
    });
  }

  const rpId = parseRpId(rpIdString);

  // Helper to revert status on failure
  const revertStatus = async () => {
    try {
      await getRevertStatusSdk(client).RevertToggleStatus({
        rp_id: rpIdString,
        previous_status: currentStatus as "registered" | "deactivated",
      });
    } catch (revertError) {
      logger.error("Failed to revert toggle status", {
        error: revertError,
        app_id,
        rpIdString,
      });
    }
  };

  try {
    // STEP 6: Determine target active state from DB status
    const kmsClient = await getKMSClient(primaryConfig.kmsRegion);
    const targetActive = currentStatus === "deactivated"; // deactivated → activate, registered → deactivate

    // STEP 7: Submit toggleActive to production
    let primaryOperationHash: string;
    try {
      primaryOperationHash = await submitToggleRpActiveTransaction(
        primaryConfig,
        { rpId, managerKmsKeyId, kmsClient },
      );
    } catch (error) {
      logger.error("Failed to submit toggle active transaction", {
        error,
        app_id,
      });
      await revertStatus();
      return errorHasuraQuery({
        req,
        detail: "Failed to submit toggle active transaction.",
        code: "submission_error",
        app_id,
      });
    }

    // STEP 8: Submit to staging if configured and its state differs from the target
    const stagingConfig =
      process.env.NEXT_PUBLIC_APP_ENV === "production"
        ? getStagingRpRegistryConfig()
        : null;
    if (stagingConfig) {
      try {
        const stagingRp = await getRpFromContract(
          rpId,
          stagingConfig.contractAddress,
        );

        if (stagingRp.active === targetActive) {
          logger.info("Staging already at target state, skipping toggle", {
            rpIdString,
            targetActive,
            contractAddress: stagingConfig.contractAddress,
          });
        } else {
          const operationHash = await submitToggleRpActiveTransaction(
            stagingConfig,
            { rpId, managerKmsKeyId, kmsClient },
          );

          logger.info("Staging toggle active submitted", {
            rpIdString,
            operationHash,
            contractAddress: stagingConfig.contractAddress,
          });
        }
      } catch (error) {
        // Staging is best-effort
        logger.error("Staging toggle active failed", {
          error,
          rpIdString,
          contractAddress: stagingConfig.contractAddress,
        });
      }
    }

    const operationHash = primaryOperationHash;

    // STEP 9: Update DB with operation hash
    // The status endpoint will pick up the final on-chain state via polling
    const { update_rp_registration_by_pk: updatedRegistration } =
      await getUpdateResultSdk(client).UpdateToggleResult({
        rp_id: rpIdString,
        operation_hash: operationHash,
      });

    if (!updatedRegistration) {
      logger.error("Failed to update registration record after toggle", {
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

    // STEP 10: Invalidate Redis cache so status endpoint reflects the change
    const redis = global.RedisClient;
    if (redis) {
      try {
        await redis.del(`rp_status:${rpIdString}`);
      } catch (cacheError) {
        logger.error("Failed to invalidate rp_status cache", {
          error: cacheError,
          rpIdString,
        });
      }
    }

    const action =
      currentStatus === "registered" ? "deactivation" : "activation";
    logger.info(`RP ${action} submitted`, {
      app_id,
      rpIdString,
      operationHash,
    });

    return NextResponse.json({
      rp_id: rpIdString,
      status: "pending",
      operation_hash: operationHash,
    });
  } catch (error) {
    logger.error("Unexpected error during toggle active", {
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
