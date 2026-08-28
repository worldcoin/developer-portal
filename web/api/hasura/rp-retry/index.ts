import { getSdk as getCheckUserSdk } from "@/api/hasura/graphql/checkUserInApp.generated";
import { errorHasuraQuery } from "@/api/helpers/errors";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { getKMSClient } from "@/api/helpers/kms";
import { getEthAddressFromKMS } from "@/api/helpers/kms-eth";
import {
  submitRegisterRpTransaction,
  submitRotateSignerTransaction,
} from "@/api/helpers/rp-transactions";
import {
  getRpRegistryConfig,
  getStagingRpRegistryConfig,
  isValidRpId,
  normalizeAddress,
  parseRpId,
  RpRegistryConfig,
} from "@/api/helpers/rp-utils";
import { getRpFromContract } from "@/api/helpers/temporal-rpc";
import { protectInternalEndpoint } from "@/api/helpers/utils";
import { validateRequestSchema } from "@/api/helpers/validate-request-schema";
import { logger } from "@/lib/logger";
import { KMSClient } from "@aws-sdk/client-kms";
import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";
import { getSdk as getClaimProductionRetrySdk } from "./graphql/claim-production-retry.generated";
import { getSdk as getCompleteProductionRetrySdk } from "./graphql/complete-production-retry.generated";
import { getSdk as getGetRpRegistrationSdk } from "./graphql/get-rp-registration.generated";
import { getSdk as getReconcileProductionRetrySdk } from "./graphql/reconcile-production-retry.generated";
import { getSdk as getRevertProductionRetrySdk } from "./graphql/revert-production-retry.generated";
import { getSdk as getUpdateStagingRetrySdk } from "./graphql/update-staging-retry.generated";

const CACHE_KEY_PREFIX = "rp_status:v2:";

type Environment = "production" | "staging";

const schema = yup
  .object({
    rp_id: yup.string().strict().required(),
    environment: yup.string().oneOf(["production", "staging"]).required(),
  })
  .noUnknown();

function getConfigForEnvironment(
  environment: Environment,
): RpRegistryConfig | null {
  const primaryConfig = getRpRegistryConfig();
  if (!primaryConfig) return null;

  if (environment === "production") {
    return primaryConfig;
  }

  const stagingOverrides = getStagingRpRegistryConfig();
  if (!stagingOverrides) return null;

  return {
    ...primaryConfig,
    contractAddress: stagingOverrides.contractAddress,
    domainSeparator: stagingOverrides.domainSeparator,
    updateRpTypehash: stagingOverrides.updateRpTypehash,
  };
}

export const POST = async (req: NextRequest) => {
  const { isAuthenticated, errorResponse } = protectInternalEndpoint(req);
  if (!isAuthenticated) {
    return errorResponse;
  }

  const body = await req.json();
  if (body?.action?.name !== "retry_rp") {
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

  const rpId = parsedParams.rp_id;
  const environment = parsedParams.environment as Environment;

  if (!isValidRpId(rpId)) {
    return errorHasuraQuery({
      req,
      detail: "Invalid rp_id format. Must start with 'rp_'.",
      code: "invalid_rp_id",
    });
  }

  const config = getConfigForEnvironment(environment);
  if (!config) {
    return errorHasuraQuery({
      req,
      detail: `The ${environment} contract is not configured.`,
      code: "environment_not_configured",
    });
  }

  const client = await getAPIServiceGraphqlClient();
  const { rp_registration_by_pk: dbRecord } = await getGetRpRegistrationSdk(
    client,
  ).GetRpRegistrationForRetry({ rp_id: rpId });

  if (!dbRecord) {
    return errorHasuraQuery({
      req,
      detail: "RP registration not found.",
      code: "not_found",
    });
  }

  const appId = dbRecord.app_id;
  const teamId = dbRecord.app?.team_id;

  if (!teamId) {
    return errorHasuraQuery({
      req,
      detail: "RP registration is missing team context.",
      code: "invalid_request",
      app_id: appId,
    });
  }

  const { team } = await getCheckUserSdk(client).CheckUserInApp({
    team_id: teamId,
    app_id: appId,
    user_id: userId,
  });

  if (!team || team.length === 0) {
    return errorHasuraQuery({
      req,
      detail: "User does not have permission to retry RP registration.",
      code: "unauthorized",
      app_id: appId,
      team_id: teamId,
    });
  }

  if (dbRecord.mode !== "managed" || !dbRecord.manager_kms_key_id) {
    return errorHasuraQuery({
      req,
      detail: "Retry is only available for managed mode RPs.",
      code: "not_managed",
      app_id: appId,
      team_id: teamId,
    });
  }

  const managerKmsKeyId = dbRecord.manager_kms_key_id;
  const signerAddress = dbRecord.signer_address;

  if (!signerAddress) {
    return errorHasuraQuery({
      req,
      detail: "Signer address is missing for this managed RP.",
      code: "missing_signer",
      app_id: appId,
      team_id: teamId,
    });
  }

  const appName = dbRecord.app?.app_metadata?.[0]?.name || "";
  const numericRpId = parseRpId(rpId);

  const kmsClient: KMSClient = await getKMSClient(config.kmsRegion);

  let managerAddress: string;
  try {
    managerAddress = await getEthAddressFromKMS(
      kmsClient,
      managerKmsKeyId,
      config.kmsRegion,
    );
  } catch (error) {
    logger.error("Failed to derive manager address from KMS key", {
      rpId,
      appId,
      teamId,
      error,
    });
    return errorHasuraQuery({
      req,
      detail: "Failed to derive manager address.",
      code: "kms_error",
      app_id: appId,
      team_id: teamId,
    });
  }

  let onChainRp;
  try {
    onChainRp = await getRpFromContract(numericRpId, config.contractAddress);
  } catch (error) {
    logger.error("Failed to fetch RP from contract", {
      rpId,
      appId,
      teamId,
      environment,
      error,
    });
    return errorHasuraQuery({
      req,
      detail: "Failed to fetch on-chain RP status.",
      code: "rpc_error",
      app_id: appId,
      team_id: teamId,
    });
  }

  // An initialized RP whose on-chain manager is not our KMS manager belongs to
  // someone else: rp_id is uint64(keccak256(app_id)) and on-chain `register()`
  // is permissionless, so a third party can claim it before we do. Retrying
  // would submit an `updateRp` signed by a key the contract does not recognise
  // as the manager — it reverts, yet the handler below still writes
  // `status: pending`, wedging the row and burning gas on every click. Bail
  // with a distinct code so the UI stops offering an action that cannot work.
  if (
    onChainRp.initialized &&
    normalizeAddress(onChainRp.manager).toLowerCase() !==
      normalizeAddress(managerAddress).toLowerCase()
  ) {
    logger.warn("Retry: rp_id is managed on-chain by a foreign manager", {
      rpId,
      appId,
      teamId,
      environment,
      expectedManager: managerAddress,
      onChainManager: onChainRp.manager,
    });
    return errorHasuraQuery({
      req,
      detail:
        "This app's RP is controlled on-chain by a different manager, so Portal cannot update it. Contact support.",
      code: "rp_id_taken",
      app_id: appId,
      team_id: teamId,
    });
  }

  const needsRegistration = !onChainRp.initialized;
  const needsSignerRotation =
    onChainRp.initialized &&
    normalizeAddress(onChainRp.signer).toLowerCase() !==
      normalizeAddress(signerAddress).toLowerCase();
  const needsExternalOperation = needsRegistration || needsSignerRotation;

  let productionClaimed = false;
  if (environment === "production" && needsExternalOperation) {
    try {
      const { update_rp_registration: claim } =
        await getClaimProductionRetrySdk(client).ClaimProductionRetry({
          rp_id: rpId,
        });

      if (!claim || claim.affected_rows !== 1) {
        return errorHasuraQuery({
          req,
          detail:
            "Cannot retry registration. Another operation or listing review may be in progress.",
          code: "operation_in_progress",
          app_id: appId,
          team_id: teamId,
        });
      }
      productionClaimed = true;
    } catch (error) {
      logger.warn("Retry: failed to claim production registration", {
        rpId,
        appId,
        teamId,
        error,
      });
      return errorHasuraQuery({
        req,
        detail:
          "Cannot retry registration. Another operation or listing review may be in progress.",
        code: "operation_in_progress",
        app_id: appId,
        team_id: teamId,
      });
    }
  }

  const revertProductionClaim = async () => {
    if (!productionClaimed) return;

    try {
      await getRevertProductionRetrySdk(client).RevertProductionRetry({
        rp_id: rpId,
      });
    } catch (error) {
      logger.error("Retry: failed to release production registration claim", {
        rpId,
        appId,
        teamId,
        error,
      });
    }
  };

  let operationHash: string | undefined;

  if (needsRegistration) {
    try {
      operationHash = await submitRegisterRpTransaction(config, {
        rpId: numericRpId,
        managerAddress,
        signerAddress,
        appName,
        kmsClient,
      });

      logger.info("Retry: registerRp submitted", {
        rpId,
        appId,
        teamId,
        environment,
        operationHash,
      });
    } catch (error) {
      logger.error("Retry: failed to submit registerRp", {
        rpId,
        appId,
        teamId,
        environment,
        error,
      });
      await revertProductionClaim();
      return errorHasuraQuery({
        req,
        detail: "Failed to submit registration transaction.",
        code: "submission_error",
        app_id: appId,
        team_id: teamId,
      });
    }
  } else if (needsSignerRotation) {
    try {
      operationHash = await submitRotateSignerTransaction(config, {
        rpId: numericRpId,
        newSignerAddress: signerAddress,
        managerKmsKeyId,
        kmsClient,
      });

      logger.info("Retry: updateRp (signer rotation) submitted", {
        rpId,
        appId,
        teamId,
        environment,
        operationHash,
      });
    } catch (error) {
      logger.error("Retry: failed to submit updateRp", {
        rpId,
        appId,
        teamId,
        environment,
        error,
      });
      await revertProductionClaim();
      return errorHasuraQuery({
        req,
        detail: "Failed to submit signer update transaction.",
        code: "submission_error",
        app_id: appId,
        team_id: teamId,
      });
    }
  } else {
    logger.info("Retry: RP already in sync on-chain", {
      rpId,
      appId,
      teamId,
      environment,
    });
  }

  // Persist the operation only while holding the production claim. If this
  // write is ambiguous, leave the durable claim in place so a retry cannot
  // submit the same on-chain operation twice.
  if (operationHash) {
    try {
      if (environment === "production") {
        const { update_rp_registration: completed } =
          await getCompleteProductionRetrySdk(client).CompleteProductionRetry({
            rp_id: rpId,
            operation_hash: operationHash,
          });

        if (!completed || completed.affected_rows !== 1) {
          throw new Error("Production retry claim was lost before completion.");
        }
      } else {
        await getUpdateStagingRetrySdk(client).UpdateStagingRetry({
          rp_id: rpId,
          staging_operation_hash: operationHash,
          staging_status: "pending",
        });
      }
    } catch (error) {
      logger.error("Failed to update retry state in DB", {
        rpId,
        appId,
        teamId,
        environment,
        error,
      });
      if (environment === "production") {
        return errorHasuraQuery({
          req,
          detail:
            "The registration was submitted, but Portal could not save its operation reference. Contact support before retrying.",
          code: "db_error",
          app_id: appId,
          team_id: teamId,
        });
      }
    }
  } else if (environment === "production") {
    try {
      const { update_rp_registration: reconciled } =
        await getReconcileProductionRetrySdk(client).ReconcileProductionRetry({
          rp_id: rpId,
        });

      if (!reconciled || reconciled.affected_rows !== 1) {
        return errorHasuraQuery({
          req,
          detail: "Registration state changed while it was being retried.",
          code: "operation_in_progress",
          app_id: appId,
          team_id: teamId,
        });
      }
    } catch (error) {
      logger.error("Failed to reconcile retry state in DB", {
        rpId,
        appId,
        teamId,
        error,
      });
      return errorHasuraQuery({
        req,
        detail: "Failed to reconcile registration state.",
        code: "db_error",
        app_id: appId,
        team_id: teamId,
      });
    }
  }

  const redis = global.RedisClient;
  if (redis) {
    try {
      const cacheKey = `${CACHE_KEY_PREFIX}${rpId}`;
      await redis.del(cacheKey);
    } catch (error) {
      logger.warn("Failed to clear cache", { rpId, appId, teamId, error });
    }
  }

  return NextResponse.json({
    success: true,
    environment,
    operation_hash: operationHash ?? null,
  });
};
