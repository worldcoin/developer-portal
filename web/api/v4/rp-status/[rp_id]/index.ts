import { errorResponse } from "@/api/helpers/errors";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import {
  isValidRpId,
  mapOnChainToDbStatus,
  parseRpId,
  RpRegistrationStatus,
} from "@/api/helpers/rp-utils";
import { getRpFromContract } from "@/api/helpers/temporal-rpc";
import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { getSdk as getGetRpRegistrationSdk } from "./graphql/get-rp-registration.generated";
import { getSdk as getUpdateRpStatusSdk } from "./graphql/update-rp-status.generated";

const CACHE_TTL_SECONDS = 3600;
const CACHE_KEY_PREFIX = "rp_status:";

interface DualStatus {
  production_status: string;
  staging_status: string | null;
}

/**
 * Returns the registration status of an RP for both production and staging contracts.
 * Checks cache first, then DB + on-chain.
 * Syncs DB status based on the production contract only.
 */
export async function GET(
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

  const redis = global.RedisClient;

  if (redis) {
    try {
      const cacheKey = `${CACHE_KEY_PREFIX}${rpId}`;
      const cachedValue = await redis.get(cacheKey);

      if (cachedValue) {
        try {
          const parsed = JSON.parse(cachedValue) as DualStatus;
          return NextResponse.json(parsed, { status: 200 });
        } catch {
          // Legacy single-status cache entry, ignore and re-fetch
        }
      }
    } catch (error) {
      logger.warn("Failed to read from cache", { rpId, error });
    }
  }

  const client = await getAPIServiceGraphqlClient();
  const { rp_registration_by_pk: dbRecord } = await getGetRpRegistrationSdk(
    client,
  ).GetRpRegistration({ rp_id: rpId });

  if (!dbRecord) {
    return errorResponse({
      statusCode: 404,
      code: "not_found",
      detail: "RP not found.",
      attribute: "rp_id",
      req,
    });
  }

  const currentDbStatus = dbRecord.status as RpRegistrationStatus;

  const productionContractAddress = process.env.RP_REGISTRY_CONTRACT_ADDRESS;
  if (!productionContractAddress) {
    logger.error("RP_REGISTRY_CONTRACT_ADDRESS not configured");
    return errorResponse({
      statusCode: 500,
      code: "server_error",
      detail: "Server configuration error.",
      attribute: null,
      req,
    });
  }

  const stagingContractAddress =
    process.env.RP_REGISTRY_STAGING_CONTRACT_ADDRESS || null;

  const numericRpId = parseRpId(rpId);

  // Fetch production on-chain state
  let productionStatus: string;
  let productionInitialized = false;
  try {
    const onChainRp = await getRpFromContract(
      numericRpId,
      productionContractAddress,
    );
    productionInitialized = onChainRp.initialized;

    if (onChainRp.initialized) {
      productionStatus = mapOnChainToDbStatus(
        onChainRp.initialized,
        onChainRp.active,
      );
    } else {
      // Not initialized on production — we'll determine status below
      productionStatus = currentDbStatus;
    }
  } catch (error) {
    logger.error("Failed to fetch RP from production contract", {
      rpId,
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

  // Fetch staging on-chain state (if configured)
  let stagingStatus: string | null = null;
  let stagingInitialized = false;
  if (stagingContractAddress) {
    try {
      const stagingOnChainRp = await getRpFromContract(
        numericRpId,
        stagingContractAddress,
      );
      stagingInitialized = stagingOnChainRp.initialized;

      if (stagingOnChainRp.initialized) {
        stagingStatus = mapOnChainToDbStatus(
          stagingOnChainRp.initialized,
          stagingOnChainRp.active,
        );
      } else {
        // Not initialized on staging — determine below
        stagingStatus = currentDbStatus;
      }
    } catch (error) {
      logger.error("Failed to fetch RP from staging contract", {
        rpId,
        error,
      });
      // Staging failure is non-fatal; report as failed
      stagingStatus = RpRegistrationStatus.Failed;
    }
  }

  // Cross-contract logic: if one contract IS initialized but the other is NOT,
  // the non-initialized one should be "failed" (submission never went through)
  if (stagingContractAddress) {
    if (productionInitialized && !stagingInitialized) {
      stagingStatus = RpRegistrationStatus.Failed;
    }
    if (!productionInitialized && stagingInitialized) {
      productionStatus = RpRegistrationStatus.Failed;
    }
  }

  // Sync DB status based on production contract only
  if (productionInitialized && productionStatus !== currentDbStatus) {
    try {
      await getUpdateRpStatusSdk(client).UpdateRpStatus({
        rp_id: rpId,
        status: productionStatus,
      });
      logger.info("Updated RP status in DB", {
        rpId,
        oldStatus: currentDbStatus,
        newStatus: productionStatus,
      });
    } catch (error) {
      logger.error("Failed to update RP status in DB", { rpId, error });
    }
  }

  const result: DualStatus = {
    production_status: productionStatus,
    staging_status: stagingStatus,
  };

  if (redis) {
    try {
      const cacheKey = `${CACHE_KEY_PREFIX}${rpId}`;
      await redis.set(
        cacheKey,
        JSON.stringify(result),
        "EX",
        CACHE_TTL_SECONDS,
      );
    } catch (error) {
      logger.warn("Failed to write to cache", { rpId, error });
    }
  }

  return NextResponse.json(result, { status: 200 });
}
