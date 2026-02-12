import { errorResponse } from "@/api/helpers/errors";
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
import { logger } from "@/lib/logger";
import { KMSClient } from "@aws-sdk/client-kms";
import { NextRequest, NextResponse } from "next/server";
import { getSdk as getGetRpRegistrationSdk } from "./graphql/get-rp-registration.generated";

const CACHE_KEY_PREFIX = "rp_status:";

type Environment = "production" | "staging";

/**
 * Returns the contract config for the specified environment.
 */
function getConfigForEnvironment(
  environment: Environment,
): RpRegistryConfig | null {
  const primaryConfig = getRpRegistryConfig();
  if (!primaryConfig) return null;

  if (environment === "production") {
    return primaryConfig;
  }

  // Staging: merge staging overrides with primary config
  const stagingOverrides = getStagingRpRegistryConfig();
  if (!stagingOverrides) return null;

  return {
    ...primaryConfig,
    contractAddress: stagingOverrides.contractAddress,
    domainSeparator: stagingOverrides.domainSeparator,
    updateRpTypehash: stagingOverrides.updateRpTypehash,
  };
}

/**
 * POST handler: re-submits the on-chain transaction to a specific contract.
 *
 * Request body: { environment: "production" | "staging" }
 *
 * Flow:
 * 1. Validate rp_id and environment
 * 2. Fetch RP registration from DB
 * 3. Get the target contract config
 * 4. Check on-chain state for the target contract
 * 5. If not initialized → re-submit registerRp
 * 6. If initialized but signer doesn't match → re-submit updateRp (rotation)
 * 7. If initialized and signer matches → already in sync
 * 8. Clear cached status in Redis
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { rp_id: string } },
) {
  const rpId = params.rp_id;

  if (!isValidRpId(rpId)) {
    return errorResponse({
      statusCode: 400,
      code: "invalid_rp_id",
      detail: "Invalid rp_id format. Must start with 'rp_'.",
      attribute: "rp_id",
      req,
    });
  }

  let body: { environment?: string };
  try {
    body = await req.json();
  } catch {
    return errorResponse({
      statusCode: 400,
      code: "invalid_body",
      detail: "Request body must be valid JSON.",
      attribute: null,
      req,
    });
  }

  const environment = body.environment;
  if (environment !== "production" && environment !== "staging") {
    return errorResponse({
      statusCode: 400,
      code: "invalid_environment",
      detail: 'environment must be "production" or "staging".',
      attribute: "environment",
      req,
    });
  }

  // Get contract config for the target environment
  const config = getConfigForEnvironment(environment);
  if (!config) {
    return errorResponse({
      statusCode: 400,
      code: "environment_not_configured",
      detail: `The ${environment} contract is not configured.`,
      attribute: "environment",
      req,
    });
  }

  // Fetch RP registration from DB
  const client = await getAPIServiceGraphqlClient();
  const { rp_registration_by_pk: dbRecord } = await getGetRpRegistrationSdk(
    client,
  ).GetRpRegistrationForRetry({ rp_id: rpId });

  if (!dbRecord) {
    return errorResponse({
      statusCode: 404,
      code: "not_found",
      detail: "RP registration not found.",
      attribute: "rp_id",
      req,
    });
  }

  if (dbRecord.mode !== "managed" || !dbRecord.manager_kms_key_id) {
    return errorResponse({
      statusCode: 400,
      code: "not_managed",
      detail: "Retry is only available for managed mode RPs.",
      attribute: null,
      req,
    });
  }

  const managerKmsKeyId = dbRecord.manager_kms_key_id;
  const signerAddress = dbRecord.signer_address;

  if (!signerAddress) {
    return errorResponse({
      statusCode: 400,
      code: "missing_signer",
      detail: "Signer address is missing for this managed RP.",
      attribute: null,
      req,
    });
  }

  const appName = dbRecord.app?.app_metadata?.[0]?.name || "";
  const numericRpId = parseRpId(rpId);

  // Get KMS client
  const kmsClient: KMSClient = await getKMSClient(config.kmsRegion);

  // Derive manager address from KMS key
  let managerAddress: string;
  try {
    managerAddress = await getEthAddressFromKMS(kmsClient, managerKmsKeyId);
  } catch (error) {
    logger.error("Failed to derive manager address from KMS key", {
      rpId,
      error,
    });
    return errorResponse({
      statusCode: 500,
      code: "kms_error",
      detail: "Failed to derive manager address.",
      attribute: null,
      req,
    });
  }

  // Check on-chain state for the target contract
  let onChainRp;
  try {
    onChainRp = await getRpFromContract(numericRpId, config.contractAddress);
  } catch (error) {
    logger.error("Failed to fetch RP from contract", {
      rpId,
      environment,
      error,
    });
    return errorResponse({
      statusCode: 500,
      code: "rpc_error",
      detail: "Failed to fetch on-chain RP status.",
      attribute: null,
      req,
    });
  }

  let operationHash: string | undefined;

  if (!onChainRp.initialized) {
    // Not initialized → re-submit registerRp
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
        environment,
        operationHash,
      });
    } catch (error) {
      logger.error("Retry: failed to submit registerRp", {
        rpId,
        environment,
        error,
      });
      return errorResponse({
        statusCode: 500,
        code: "submission_error",
        detail: "Failed to submit registration transaction.",
        attribute: null,
        req,
      });
    }
  } else if (
    normalizeAddress(onChainRp.signer).toLowerCase() !==
    normalizeAddress(signerAddress).toLowerCase()
  ) {
    // Initialized but signer doesn't match DB → re-submit updateRp (rotation)
    try {
      operationHash = await submitRotateSignerTransaction(config, {
        rpId: numericRpId,
        newSignerAddress: signerAddress,
        managerKmsKeyId,
        kmsClient,
      });

      logger.info("Retry: updateRp (signer rotation) submitted", {
        rpId,
        environment,
        operationHash,
      });
    } catch (error) {
      logger.error("Retry: failed to submit updateRp", {
        rpId,
        environment,
        error,
      });
      return errorResponse({
        statusCode: 500,
        code: "submission_error",
        detail: "Failed to submit signer update transaction.",
        attribute: null,
        req,
      });
    }
  } else {
    // Already in sync
    logger.info("Retry: RP already in sync on-chain", { rpId, environment });
  }

  // Clear cached status in Redis
  const redis = global.RedisClient;
  if (redis) {
    try {
      const cacheKey = `${CACHE_KEY_PREFIX}${rpId}`;
      await redis.del(cacheKey);
    } catch (error) {
      logger.warn("Failed to clear cache", { rpId, error });
    }
  }

  return NextResponse.json(
    {
      success: true,
      environment,
      operation_hash: operationHash ?? null,
    },
    { status: 200 },
  );
}
