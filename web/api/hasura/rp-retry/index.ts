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
import { getSdk as getGetRpRegistrationSdk } from "./graphql/get-rp-registration.generated";

const CACHE_KEY_PREFIX = "rp_status:";

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
  const appName = dbRecord.app?.app_metadata?.[0]?.name || "";
  const numericRpId = parseRpId(rpId);

  const kmsClient: KMSClient = await getKMSClient(config.kmsRegion);

  let managerAddress: string;
  try {
    managerAddress = await getEthAddressFromKMS(kmsClient, managerKmsKeyId);
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

  let operationHash: string | undefined;

  if (!onChainRp.initialized) {
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
      return errorHasuraQuery({
        req,
        detail: "Failed to submit registration transaction.",
        code: "submission_error",
        app_id: appId,
        team_id: teamId,
      });
    }
  } else if (
    normalizeAddress(onChainRp.signer).toLowerCase() !==
    normalizeAddress(signerAddress).toLowerCase()
  ) {
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
