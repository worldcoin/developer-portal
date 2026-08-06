import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { getKMSClient } from "@/api/helpers/kms";
import {
  acquireRpMigrationLock,
  holdRpMigrationLockForInFlightOp,
  migrationMayHaveInFlightOperation,
  releaseRpMigrationLock,
  retainRpMigrationLockForInFlightOp,
  RP_MIGRATION_IN_FLIGHT_LOCK_MS,
} from "@/api/helpers/rp-manager-key-migration";
import {
  getRpRegistryConfig,
  getStagingRpRegistryConfig,
} from "@/api/helpers/rp-utils";
import { protectInternalEndpoint } from "@/api/helpers/utils";
import { logger } from "@/lib/logger";
import { gql, type GraphQLClient } from "graphql-request";
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { migrateRpManagersToSharedKey } from "../../scripts/migrate-rp-manager-to-shared-key";

// #region Constants and types

const GLOBAL_LOCK_KEY = "rp-manager-key-migration:run";
const GLOBAL_LOCK_TTL_MS = 5 * 60 * 1000; // 5 min
const FAILURE_COOLDOWN_MS = RP_MIGRATION_IN_FLIGHT_LOCK_MS;
const CANDIDATE_BATCH_SIZE = 10;

type Candidate = {
  rp_id: string;
  app_id: string;
  manager_kms_key_id: string;
};

type CandidateQueryResult = {
  rp_registration: Candidate[];
};

type TouchResult = {
  update_rp_registration: { affected_rows: number } | null;
};

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

// #region GraphQL

const GET_NEXT_CANDIDATES = gql`
  query GetNextRpManagerKeyMigrationCandidates(
    $before: timestamptz!
    $limit: Int!
  ) {
    rp_registration(
      where: {
        mode: { _eq: managed }
        status: { _eq: registered }
        signer_address: { _is_null: false }
        manager_kms_key_id: { _is_null: false }
        is_unique_manager_key: { _eq: true }
        updated_at: { _lte: $before }
        app: {
          status: { _eq: "active" }
          is_archived: { _eq: false }
          deleted_at: { _is_null: true }
        }
      }
      order_by: [{ updated_at: asc }, { created_at: asc }]
      limit: $limit
    ) {
      rp_id
      app_id
      manager_kms_key_id
    }
  }
`;

const TOUCH_FAILED_CANDIDATE = gql`
  mutation TouchFailedRpManagerKeyMigration(
    $rp_id: String!
    $updated_at: timestamptz!
  ) {
    update_rp_registration(
      where: {
        rp_id: { _eq: $rp_id }
        mode: { _eq: managed }
        is_unique_manager_key: { _eq: true }
      }
      _set: { updated_at: $updated_at }
    ) {
      affected_rows
    }
  }
`;

// #endregion

// #region Lock and cooldown helpers

async function acquireGlobalLock(): Promise<
  | { status: "acquired"; owner: string; redis: RedisLockClient }
  | { status: "busy" }
  | { status: "unavailable"; error?: unknown }
> {
  const redis = global.RedisClient as RedisLockClient | undefined;
  if (!redis) return { status: "unavailable" };

  const owner = randomUUID();

  try {
    const result = await redis.set(
      GLOBAL_LOCK_KEY,
      owner,
      "PX",
      GLOBAL_LOCK_TTL_MS,
      "NX",
    );

    return result === "OK"
      ? { status: "acquired", owner, redis }
      : { status: "busy" };
  } catch (error) {
    return { status: "unavailable", error };
  }
}

async function releaseGlobalLock(
  redis: RedisLockClient,
  owner: string,
  attemptId: string | null,
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
    logger.warn("Failed to release RP manager migration lock", {
      error,
      attempt_id: attemptId,
    });
  }
}

async function touchForCooldown(
  client: GraphQLClient,
  rpId: string,
  attemptId: string,
): Promise<void> {
  const result = await client.request<
    TouchResult,
    { rp_id: string; updated_at: string }
  >(TOUCH_FAILED_CANDIDATE, {
    rp_id: rpId,
    updated_at: new Date().toISOString(),
  });

  if (result.update_rp_registration?.affected_rows !== 1) {
    logger.warn("Failed RP migration candidate changed before cooldown", {
      attempt_id: attemptId,
      rp_id: rpId,
    });
  }
}

// #endregion

// #region Endpoint

export async function POST(request: NextRequest): Promise<NextResponse> {
  const { isAuthenticated, errorResponse } = protectInternalEndpoint(request);
  if (!isAuthenticated) return errorResponse!;

  if (process.env.ENABLE_RP_MANAGER_KEY_MIGRATION !== "true") {
    return new NextResponse(null, { status: 204 });
  }

  const lock = await acquireGlobalLock();
  if (lock.status === "busy") {
    return new NextResponse(null, { status: 204 });
  }

  if (lock.status === "unavailable") {
    logger.error("Redis unavailable for RP manager migration", {
      error: lock.error,
    });

    return NextResponse.json(
      { error: "migration_dependency_unavailable" },
      { status: 503 },
    );
  }

  let client: GraphQLClient | null = null;
  let candidate: Candidate | null = null;
  let attemptId: string | null = null;
  let rpLock: Awaited<ReturnType<typeof acquireRpMigrationLock>> | null = null;
  let mayHaveSubmittedTransfer = false;
  let retainRpLockForInFlightOp = false;
  let rpLockHeldForInFlightOp: boolean | null = null;
  let lockedCandidatesSkipped = 0;
  const startedAt = Date.now();

  const holdRpLockForInFlightOp = async (
    redis: Parameters<typeof holdRpMigrationLockForInFlightOp>[0],
    rpId: string,
    owner: string,
  ): Promise<void> => {
    // Recreate the key only when a transfer really left the process: the
    // pre-submit gate aborts instead of submitting, so its lock must stay free.
    rpLockHeldForInFlightOp = mayHaveSubmittedTransfer
      ? await holdRpMigrationLockForInFlightOp(redis, rpId, owner, attemptId)
      : await retainRpMigrationLockForInFlightOp(redis, rpId, owner, attemptId);

    if (!rpLockHeldForInFlightOp && mayHaveSubmittedTransfer) {
      logger.error(
        "RP manager migration per-RP lock lost while a transfer may still land",
        {
          attempt_id: attemptId,
          rp_id: rpId,
        },
      );
    }
  };

  try {
    const sharedKeyId = process.env.RP_REGISTRY_MANAGER_KMS_KEY_ID?.trim();
    const primaryConfig = getRpRegistryConfig();
    const isProduction = process.env.NEXT_PUBLIC_APP_ENV === "production";
    const stagingConfig = isProduction ? getStagingRpRegistryConfig() : null;

    if (!sharedKeyId || !primaryConfig || (isProduction && !stagingConfig)) {
      throw new Error("RP manager migration configuration is incomplete");
    }

    client = await getAPIServiceGraphqlClient();
    const before = new Date(Date.now() - FAILURE_COOLDOWN_MS).toISOString();

    const candidates = await client.request<
      CandidateQueryResult,
      { before: string; limit: number }
    >(GET_NEXT_CANDIDATES, { before, limit: CANDIDATE_BATCH_SIZE });

    if (candidates.rp_registration.length === 0) {
      return new NextResponse(null, { status: 204 });
    }

    attemptId = randomUUID();

    for (const next of candidates.rp_registration) {
      const lockAttempt = await acquireRpMigrationLock(next.rp_id);
      if (lockAttempt.status === "busy") {
        lockedCandidatesSkipped += 1;
        continue;
      }
      if (lockAttempt.status === "unavailable") {
        logger.error("Redis unavailable for RP manager migration per-RP lock", {
          error: lockAttempt.error,
          attempt_id: attemptId,
          rp_id: next.rp_id,
        });

        return NextResponse.json(
          { error: "migration_dependency_unavailable" },
          { status: 503 },
        );
      }

      candidate = next;
      rpLock = lockAttempt;
      break;
    }

    if (!candidate || rpLock?.status !== "acquired") {
      logger.info("No unlocked RP manager migration candidate available", {
        attempt_id: attemptId,
        candidate_count: candidates.rp_registration.length,
        locked_candidates_skipped: lockedCandidatesSkipped,
      });

      return new NextResponse(null, { status: 204 });
    }

    logger.info("RP manager key migration attempt started", {
      attempt_id: attemptId,
      rp_id: candidate.rp_id,
      app_id: candidate.app_id,
      old_manager_kms_key_id: candidate.manager_kms_key_id,
      locked_candidates_skipped: lockedCandidatesSkipped,
    });

    const kmsClient = await getKMSClient(primaryConfig.kmsRegion);
    const acquiredRpLock = rpLock;

    const report = await migrateRpManagersToSharedKey({
      graphqlClient: client,
      kmsClient,
      sharedManagerKeyId: sharedKeyId,
      primaryRegistry: { name: "primary", config: primaryConfig },
      stagingMirrorRegistry: stagingConfig
        ? { name: "staging", config: stagingConfig }
        : undefined,
      rpIds: [candidate.rp_id],
      attemptId,
      pollIntervalMs: 2_000,
      confirmationTimeoutMs: 15_000,
      beforeSubmitOperation: async () => {
        // Extend before submit so a crash between send and finally cannot
        // free the row while the UserOp is still includable.
        const retained = await retainRpMigrationLockForInFlightOp(
          acquiredRpLock.redis,
          candidate!.rp_id,
          acquiredRpLock.owner,
          attemptId,
        );
        if (!retained) {
          logger.warn(
            "Aborting RP manager migration transfer; per-RP lock was not retained",
            {
              attempt_id: attemptId,
              rp_id: candidate!.rp_id,
            },
          );
          throw new Error(
            "Failed to retain per-RP lock before submitting transfer",
          );
        }
        mayHaveSubmittedTransfer = true;
      },
    });

    const result = report.results[0];

    const settled =
      result?.status === "migrated" || result?.status === "already_migrated";

    retainRpLockForInFlightOp =
      !settled &&
      (mayHaveSubmittedTransfer || migrationMayHaveInFlightOperation(result));

    if (retainRpLockForInFlightOp && rpLock.status === "acquired") {
      await holdRpLockForInFlightOp(
        rpLock.redis,
        candidate.rp_id,
        rpLock.owner,
      );
    }

    if (!result || result.status === "failed") {
      await touchForCooldown(client, candidate.rp_id, attemptId);
    }

    const outcome = result?.status ?? "ineligible";

    logger.info("RP manager key migration attempt finished", {
      attempt_id: attemptId,
      rp_id: candidate.rp_id,
      app_id: candidate.app_id,
      old_manager_kms_key_id: candidate.manager_kms_key_id,
      operation_hashes: result?.operationHashes ?? {},
      skipped_registries: result?.skippedRegistries ?? [],
      outcome,
      failure: result?.status === "failed" ? result.failure : undefined,
      locked_candidates_skipped: lockedCandidatesSkipped,
      retain_rp_lock: retainRpLockForInFlightOp,
      rp_lock_held: rpLockHeldForInFlightOp,
      duration_ms: Date.now() - startedAt,
    });

    return NextResponse.json({
      rp_id: candidate.rp_id,
      outcome,
      operation_hashes: result?.operationHashes ?? {},
    });
  } catch (error) {
    if (mayHaveSubmittedTransfer) {
      retainRpLockForInFlightOp = true;
    }

    if (client && candidate) {
      try {
        await touchForCooldown(
          client,
          candidate.rp_id,
          attemptId ?? randomUUID(),
        );
      } catch (cooldownError) {
        logger.warn("Failed to apply RP migration cooldown", {
          error: cooldownError,
          attempt_id: attemptId,
          rp_id: candidate.rp_id,
        });
      }
    }

    logger.error("Unexpected RP manager migration cron failure", {
      error,
      attempt_id: attemptId,
      rp_id: candidate?.rp_id,
      old_manager_kms_key_id: candidate?.manager_kms_key_id,
      duration_ms: Date.now() - startedAt,
    });

    return NextResponse.json(
      { error: "migration_dependency_unavailable" },
      { status: 503 },
    );
  } finally {
    if (rpLock?.status === "acquired" && candidate) {
      if (retainRpLockForInFlightOp) {
        if (rpLockHeldForInFlightOp !== true) {
          await holdRpLockForInFlightOp(
            rpLock.redis,
            candidate.rp_id,
            rpLock.owner,
          );
        }
      } else {
        await releaseRpMigrationLock(
          rpLock.redis,
          candidate.rp_id,
          rpLock.owner,
          attemptId,
        );
      }
    }
    await releaseGlobalLock(lock.redis, lock.owner, attemptId);
  }
}

// #endregion
