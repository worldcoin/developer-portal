import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { getKMSClient } from "@/api/helpers/kms";
import {
  getRpRegistryConfig,
  getStagingRpRegistryConfig,
} from "@/api/helpers/rp-utils";
import { protectInternalEndpoint } from "@/api/helpers/utils";
import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { cleanupRpManagerKeys } from "../../scripts/cleanup-rp-manager-keys";

// #region Constants and types

const GLOBAL_LOCK_KEY = "rp-manager-key-cleanup:run";
const GLOBAL_LOCK_TTL_MS = 5 * 60 * 1000;

type RedisLockClient = {
  set(
    key: string,
    value: string,
    px: "PX",
    ttlMs: number,
    nx: "NX",
  ): Promise<"OK" | null>;
  eval(
    script: string,
    numberOfKeys: number,
    ...args: Array<string | number>
  ): Promise<unknown>;
};

// #endregion

// #region Lock helpers

async function acquireGlobalLock(): Promise<
  | { status: "acquired"; owner: string; redis: RedisLockClient }
  | { status: "busy" }
  | { status: "unavailable"; error?: unknown }
> {
  const redis = global.RedisClient as RedisLockClient | undefined;
  if (!redis) {
    return { status: "unavailable" };
  }

  const owner = randomUUID();

  try {
    const result = await redis.set(
      GLOBAL_LOCK_KEY,
      owner,
      "PX",
      GLOBAL_LOCK_TTL_MS,
      "NX",
    );

    if (result === "OK") {
      return { status: "acquired", owner, redis };
    }

    return { status: "busy" };
  } catch (error) {
    return { status: "unavailable", error };
  }
}

async function releaseGlobalLock(
  redis: RedisLockClient,
  owner: string,
): Promise<void> {
  try {
    await redis.eval(
      `if redis.call("get", KEYS[1]) == ARGV[1] then
         return redis.call("del", KEYS[1])
       end
       return 0`,
      1,
      GLOBAL_LOCK_KEY,
      owner,
    );
  } catch (error) {
    logger.warn("Failed to release RP manager key cleanup lock", {
      error,
    });
  }
}

// #endregion

// #region Endpoint

export async function POST(request: NextRequest): Promise<NextResponse> {
  const { isAuthenticated, errorResponse } = protectInternalEndpoint(request);
  if (!isAuthenticated) {
    return errorResponse!;
  }

  if (process.env.ENABLE_RP_MANAGER_KEY_CLEANUP !== "true") {
    return new NextResponse(null, { status: 204 });
  }

  if (process.env.ENABLE_RP_MANAGER_KEY_MIGRATION === "true") {
    logger.info("RP manager key cleanup skipped because migration is enabled");
    return new NextResponse(null, { status: 204 });
  }

  const lock = await acquireGlobalLock();
  if (lock.status === "busy") {
    return new NextResponse(null, { status: 204 });
  }

  if (lock.status === "unavailable") {
    logger.error("Redis unavailable for RP manager key cleanup", {
      error: lock.error,
    });

    return NextResponse.json(
      { error: "cleanup_dependency_unavailable" },
      { status: 503 },
    );
  }

  const startedAt = Date.now();

  try {
    const primaryConfig = getRpRegistryConfig();
    const isProduction = process.env.NEXT_PUBLIC_APP_ENV === "production";
    const stagingConfig = isProduction ? getStagingRpRegistryConfig() : null;

    if (!primaryConfig || (isProduction && !stagingConfig)) {
      throw new Error("RP manager key cleanup configuration is incomplete");
    }

    const graphqlClient = await getAPIServiceGraphqlClient();
    const kmsClient = await getKMSClient(primaryConfig.kmsRegion);

    const report = await cleanupRpManagerKeys({
      graphqlClient,
      kmsClient,
      primaryRegistry: { name: "primary", config: primaryConfig },
      stagingMirrorRegistry: stagingConfig
        ? { name: "staging", config: stagingConfig }
        : undefined,
      limit: 1,
    });

    const result = report.results[0];
    if (!result) {
      return new NextResponse(null, { status: 204 });
    }

    logger.info("RP manager key cleanup attempt finished", {
      rp_id: result.rpId,
      app_id: result.appId,
      old_manager_kms_key_arn: result.oldManagerKeyArn,
      cleanup_status: result.status,
      detail: result.detail,
      duration_ms: Date.now() - startedAt,
    });

    return NextResponse.json({
      rp_id: result.rpId,
      outcome: result.status,
      detail: result.detail,
    });
  } catch (error) {
    logger.error("Unexpected RP manager key cleanup cron failure", {
      error,
      duration_ms: Date.now() - startedAt,
    });

    return NextResponse.json(
      { error: "cleanup_dependency_unavailable" },
      { status: 503 },
    );
  } finally {
    await releaseGlobalLock(lock.redis, lock.owner);
  }
}

// #endregion
