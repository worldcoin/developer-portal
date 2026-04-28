import { errorResponse } from "@/api/helpers/errors";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import {
  isValidRpId,
  mapOnChainToDbStatus,
  normalizeAddress,
  parseRpId,
  RpRegistrationStatus,
} from "@/api/helpers/rp-utils";
import { getRpFromContract } from "@/api/helpers/temporal-rpc";
import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { getSdk as getGetRpRegistrationSdk } from "./graphql/get-rp-registration.generated";
import { getSdk as getUpdateRpStatusSdk } from "./graphql/update-rp-status.generated";
import { getSdk as getUpdateStagingStatusSdk } from "./graphql/update-staging-status.generated";

const CACHE_TTL_SECONDS = 3600;
const CACHE_KEY_PREFIX = "rp_status:v2:";
const PENDING_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

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
  const currentDbStagingStatus =
    (dbRecord.staging_status as RpRegistrationStatus) ?? null;

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
      // Not initialized on-chain — use DB status (tracks production)
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
  let stagingRpcSucceeded = false;
  // True only when we successfully read staging AND its signer matches the DB
  // signer. If the signer drifts (rotation in flight, rotation failed, retry
  // pending), we must NOT auto-sync staging_status to "registered" — that
  // would clobber a legit "pending"/"failed" set by the rotation handler.
  let stagingSignerMatches = false;
  if (stagingContractAddress) {
    try {
      const stagingOnChainRp = await getRpFromContract(
        numericRpId,
        stagingContractAddress,
      );
      stagingRpcSucceeded = true;
      stagingInitialized = stagingOnChainRp.initialized;

      if (stagingOnChainRp.initialized) {
        const expectedSigner = dbRecord.signer_address;
        stagingSignerMatches =
          !!expectedSigner &&
          normalizeAddress(stagingOnChainRp.signer).toLowerCase() ===
            normalizeAddress(expectedSigner).toLowerCase();

        // When signer mismatches, the on-chain "registered" reading is
        // misleading — a rotation either hasn't been applied yet or failed.
        // Preserve whatever rotate-signer-key/rp-retry persisted in the DB
        // (pending or failed). For self-managed RPs (no DB signer) we have
        // no expected value to compare against, so fall back to on-chain.
        stagingStatus = stagingSignerMatches
          ? mapOnChainToDbStatus(
              stagingOnChainRp.initialized,
              stagingOnChainRp.active,
            )
          : currentDbStagingStatus ??
            mapOnChainToDbStatus(
              stagingOnChainRp.initialized,
              stagingOnChainRp.active,
            );
      } else {
        stagingStatus = RpRegistrationStatus.Pending;
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

  const ageMs = Date.now() - new Date(dbRecord.created_at).getTime();
  const isPastGracePeriod = ageMs > PENDING_TIMEOUT_MS;

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

  // Sync staging status to DB when on-chain state differs.
  // Only when the on-chain signer matches the DB signer — otherwise the
  // on-chain "registered" reading would clobber a legit "pending"/"failed"
  // that rotate-signer-key or rp-retry persisted while a rotation is in
  // flight or after a rotation failure.
  if (
    stagingRpcSucceeded &&
    stagingInitialized &&
    stagingSignerMatches &&
    stagingStatus &&
    stagingStatus !== currentDbStagingStatus
  ) {
    try {
      await getUpdateStagingStatusSdk(client).UpdateStagingStatus({
        rp_id: rpId,
        staging_status: stagingStatus,
      });
      logger.info("Updated staging status in DB", {
        rpId,
        oldStatus: currentDbStagingStatus,
        newStatus: stagingStatus,
      });
    } catch (error) {
      logger.error("Failed to update staging status in DB", { rpId, error });
    }
  }

  // Timeout: if a managed RP is NOT initialized on-chain and DB status is still
  // pending after 5 minutes, transition to failed so the user sees a retry button.
  // Self-managed RPs intentionally stay pending until the developer completes
  // on-chain setup manually, so we skip the timeout for those.
  if (
    !productionInitialized &&
    currentDbStatus === RpRegistrationStatus.Pending &&
    isPastGracePeriod &&
    dbRecord.mode === "managed"
  ) {
    logger.warn("RP registration pending timeout — transitioning to failed", {
      rpId,
      createdAt: dbRecord.created_at,
      ageMs,
      operation_hash: dbRecord.operation_hash ?? "null",
    });

    try {
      await getUpdateRpStatusSdk(client).UpdateRpStatus({
        rp_id: rpId,
        status: RpRegistrationStatus.Failed,
      });

      productionStatus = RpRegistrationStatus.Failed;
    } catch (error) {
      logger.error("Failed to update timed-out RP status in DB", {
        rpId,
        error,
      });
    }
  }

  // Staging timeout: if staging is not initialized after the grace period,
  // transition to failed so the user gets a retry button and polling stops.
  // Only apply when the RPC call succeeded — a transient RPC failure should
  // not permanently mark a healthy staging registration as failed.
  // Use updated_at (not created_at) so a fresh staging retry resets the clock.
  const stagingAgeMs = Date.now() - new Date(dbRecord.updated_at).getTime();
  const isStagingPastGracePeriod = stagingAgeMs > PENDING_TIMEOUT_MS;
  if (
    stagingContractAddress &&
    stagingRpcSucceeded &&
    !stagingInitialized &&
    isStagingPastGracePeriod &&
    dbRecord.mode === "managed"
  ) {
    stagingStatus = RpRegistrationStatus.Failed;

    if (currentDbStagingStatus !== RpRegistrationStatus.Failed) {
      try {
        await getUpdateStagingStatusSdk(client).UpdateStagingStatus({
          rp_id: rpId,
          staging_status: RpRegistrationStatus.Failed,
        });
      } catch (error) {
        logger.error("Failed to update staging timeout status in DB", {
          rpId,
          error,
        });
      }
    }
  }

  const result: DualStatus = {
    production_status: productionStatus,
    staging_status: stagingStatus,
  };

  if (redis) {
    try {
      // Use a minimal TTL for pending statuses so polling picks up on-chain changes quickly
      const ttl =
        productionStatus === "pending" || stagingStatus === "pending"
          ? 1
          : CACHE_TTL_SECONDS;
      const cacheKey = `${CACHE_KEY_PREFIX}${rpId}`;
      await redis.set(cacheKey, JSON.stringify(result), "EX", ttl);
    } catch (error) {
      logger.warn("Failed to write to cache", { rpId, error });
    }
  }

  return NextResponse.json(result, { status: 200 });
}
