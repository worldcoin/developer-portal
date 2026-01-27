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

/**
 * Returns the registration status of an RP.
 * Checks cache first, then DB, then on-chain for registered/deactivated RPs.
 * Syncs DB if on-chain status differs.
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
      const cachedStatus = await redis.get(cacheKey);

      if (cachedStatus) {
        return NextResponse.json({ status: cachedStatus }, { status: 200 });
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

  const contractAddress = process.env.RP_REGISTRY_CONTRACT_ADDRESS;
  if (!contractAddress) {
    logger.error("RP_REGISTRY_CONTRACT_ADDRESS not configured");
    return errorResponse({
      statusCode: 500,
      code: "server_error",
      detail: "Server configuration error.",
      attribute: null,
      req,
    });
  }

  let onChainRp;
  try {
    const numericRpId = parseRpId(rpId);
    onChainRp = await getRpFromContract(numericRpId, contractAddress);
  } catch (error) {
    logger.error("Failed to fetch RP from contract", { rpId, error });
    return errorResponse({
      statusCode: 500,
      code: "rpc_error",
      detail: "Failed to fetch on-chain RP status.",
      attribute: null,
      req,
    });
  }

  const onChainStatus = mapOnChainToDbStatus(
    onChainRp.initialized,
    onChainRp.active,
  );

  if (onChainStatus !== currentDbStatus) {
    try {
      await getUpdateRpStatusSdk(client).UpdateRpStatus({
        rp_id: rpId,
        status: onChainStatus,
      });
      logger.info("Updated RP status in DB", {
        rpId,
        oldStatus: currentDbStatus,
        newStatus: onChainStatus,
      });
    } catch (error) {
      logger.error("Failed to update RP status in DB", { rpId, error });
    }
  }

  if (redis) {
    try {
      const cacheKey = `${CACHE_KEY_PREFIX}${rpId}`;
      await redis.set(cacheKey, onChainStatus, "EX", CACHE_TTL_SECONDS);
    } catch (error) {
      logger.warn("Failed to write to cache", { rpId, error });
    }
  }

  return NextResponse.json({ status: onChainStatus }, { status: 200 });
}
