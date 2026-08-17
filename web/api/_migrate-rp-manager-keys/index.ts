import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { getKMSClient } from "@/api/helpers/kms";
import {
  acquireRpMigrationLock,
  migrationMayHaveInFlightOperation,
  releaseRpMigrationLock,
  RP_MIGRATION_LOCK_TTL_MS,
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
const FAILURE_COOLDOWN_MS = RP_MIGRATION_LOCK_TTL_MS;
const MIGRATE_PER_RUN = 15;
const CANDIDATE_FETCH_LIMIT = 20;

type Candidate = {
  rp_id: string;
  app_id: string;
  manager_kms_key_id: string;
};

type AcquiredRpLock = Extract<
  Awaited<ReturnType<typeof acquireRpMigrationLock>>,
  { status: "acquired" }
>;

type LockedCandidate = {
  candidate: Candidate;
  rpLock: AcquiredRpLock;
};

function candidateIdentity(candidate: Candidate) {
  return {
    rp_id: candidate.rp_id,
    app_id: candidate.app_id,
    old_manager_kms_key_id: candidate.manager_kms_key_id,
  };
}

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
  candidate: Candidate,
  attemptId: string,
): Promise<void> {
  const result = await client.request<
    TouchResult,
    { rp_id: string; updated_at: string }
  >(TOUCH_FAILED_CANDIDATE, {
    rp_id: candidate.rp_id,
    updated_at: new Date().toISOString(),
  });

  if (result.update_rp_registration?.affected_rows !== 1) {
    logger.warn("Failed RP migration candidate changed before cooldown", {
      attempt_id: attemptId,
      ...candidateIdentity(candidate),
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
    logger.info("RP manager key migration skipped, global lock held");
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
  let attemptId: string | null = null;
  const locked: LockedCandidate[] = [];
  const retainRpIds = new Set<string>();
  let migrationInvocationStarted = false;
  let lockedCandidatesSkipped = 0;
  const skippedLocked: Candidate[] = [];
  const startedAt = Date.now();

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
    >(GET_NEXT_CANDIDATES, { before, limit: CANDIDATE_FETCH_LIMIT });

    if (candidates.rp_registration.length === 0) {
      return new NextResponse(null, { status: 204 });
    }

    attemptId = randomUUID();

    for (const next of candidates.rp_registration) {
      if (locked.length >= MIGRATE_PER_RUN) {
        break;
      }

      const lockAttempt = await acquireRpMigrationLock(next.rp_id);
      if (lockAttempt.status === "busy") {
        lockedCandidatesSkipped += 1;
        skippedLocked.push(next);
        continue;
      }
      if (lockAttempt.status === "unavailable") {
        logger.error("Redis unavailable for RP manager migration per-RP lock", {
          error: lockAttempt.error,
          attempt_id: attemptId,
          ...candidateIdentity(next),
        });

        return NextResponse.json(
          { error: "migration_dependency_unavailable" },
          { status: 503 },
        );
      }

      locked.push({ candidate: next, rpLock: lockAttempt });
    }

    if (locked.length === 0) {
      logger.info("No unlocked RP manager migration candidate available", {
        attempt_id: attemptId,
        candidate_count: candidates.rp_registration.length,
        locked_candidates_skipped: lockedCandidatesSkipped,
        skipped_locked: skippedLocked.map(candidateIdentity),
      });

      return new NextResponse(null, { status: 204 });
    }

    const rpIds = locked.map((item) => item.candidate.rp_id);

    logger.info("RP manager key migration batch started", {
      attempt_id: attemptId,
      rp_ids: rpIds,
      candidate_count: locked.length,
      locked_candidates_skipped: lockedCandidatesSkipped,
      candidates: locked.map((item) => candidateIdentity(item.candidate)),
      skipped_locked: skippedLocked.map(candidateIdentity),
    });

    const kmsClient = await getKMSClient(primaryConfig.kmsRegion);

    migrationInvocationStarted = true;
    const report = await migrateRpManagersToSharedKey({
      graphqlClient: client,
      kmsClient,
      sharedManagerKeyId: sharedKeyId,
      primaryRegistry: { name: "primary", config: primaryConfig },
      stagingMirrorRegistry: stagingConfig
        ? { name: "staging", config: stagingConfig }
        : undefined,
      rpIds,
      attemptId,
      pollIntervalMs: 2_000,
      confirmationTimeoutMs: 15_000,
      concurrency: MIGRATE_PER_RUN,
    });

    const resultsByRpId = new Map(
      report.results.map((result) => [result.rpId, result]),
    );
    const responseItems: Array<{
      rp_id: string;
      outcome: string;
      operation_hashes: Record<string, string>;
    }> = [];
    const resultLogs: Array<{
      rp_id: string;
      app_id: string;
      old_manager_kms_key_id: string;
      outcome: string;
      operation_hashes: Record<string, string>;
      skipped_registries: string[];
      retain_rp_lock: boolean;
      failure?: { stage: string; detail: string };
    }> = [];

    for (const { candidate } of locked) {
      const result = resultsByRpId.get(candidate.rp_id);
      const settled =
        result?.status === "migrated" || result?.status === "already_migrated";
      const retainRpLock =
        !settled && migrationMayHaveInFlightOperation(result);

      if (retainRpLock) {
        retainRpIds.add(candidate.rp_id);
      }

      if (!result || result.status === "failed") {
        await touchForCooldown(client, candidate, attemptId);
      }

      const outcome = result?.status ?? "ineligible";
      const operationHashes = result?.operationHashes ?? {};

      responseItems.push({
        rp_id: candidate.rp_id,
        outcome,
        operation_hashes: operationHashes,
      });
      resultLogs.push({
        ...candidateIdentity(candidate),
        outcome,
        operation_hashes: operationHashes,
        skipped_registries: result?.skippedRegistries ?? [],
        retain_rp_lock: retainRpLock,
        ...(result?.status === "failed" ? { failure: result.failure } : {}),
      });
    }

    const succeededRpIds = resultLogs
      .filter(
        (item) =>
          item.outcome === "migrated" || item.outcome === "already_migrated",
      )
      .map((item) => item.rp_id);
    const failedRpIds = resultLogs
      .filter((item) => item.outcome === "failed")
      .map((item) => item.rp_id);
    const ineligibleRpIds = resultLogs
      .filter((item) => item.outcome === "ineligible")
      .map((item) => item.rp_id);
    const batchOutcome =
      failedRpIds.length + ineligibleRpIds.length === 0
        ? "all_succeeded"
        : succeededRpIds.length === 0
          ? "all_failed"
          : "partial_failure";
    const batchLog = {
      attempt_id: attemptId,
      batch_outcome: batchOutcome,
      rp_ids: rpIds,
      succeeded_rp_ids: succeededRpIds,
      failed_rp_ids: failedRpIds,
      ineligible_rp_ids: ineligibleRpIds,
      candidate_count: locked.length,
      succeeded_count: succeededRpIds.length,
      failed_count: failedRpIds.length,
      ineligible_count: ineligibleRpIds.length,
      locked_candidates_skipped: lockedCandidatesSkipped,
      skipped_locked: skippedLocked.map(candidateIdentity),
      retained_rp_locks: [...retainRpIds],
      duration_ms: Date.now() - startedAt,
      results: resultLogs,
    };

    if (batchOutcome === "all_succeeded") {
      logger.info("RP manager key migration batch finished", batchLog);
    } else if (batchOutcome === "partial_failure") {
      logger.warn("RP manager key migration batch finished", batchLog);
    } else {
      logger.error("RP manager key migration batch finished", batchLog);
    }

    return NextResponse.json({ results: responseItems });
  } catch (error) {
    if (migrationInvocationStarted) {
      for (const { candidate } of locked) {
        retainRpIds.add(candidate.rp_id);
      }
    }

    if (client) {
      for (const { candidate } of locked) {
        try {
          await touchForCooldown(client, candidate, attemptId ?? randomUUID());
        } catch (cooldownError) {
          logger.warn("Failed to apply RP migration cooldown", {
            error: cooldownError,
            attempt_id: attemptId,
            ...candidateIdentity(candidate),
          });
        }
      }
    }

    logger.error("Unexpected RP manager migration cron failure", {
      error,
      attempt_id: attemptId,
      rp_ids: locked.map((item) => item.candidate.rp_id),
      candidates: locked.map((item) => candidateIdentity(item.candidate)),
      migration_invocation_started: migrationInvocationStarted,
      duration_ms: Date.now() - startedAt,
    });

    return NextResponse.json(
      { error: "migration_dependency_unavailable" },
      { status: 503 },
    );
  } finally {
    for (const { candidate, rpLock } of locked) {
      if (!retainRpIds.has(candidate.rp_id)) {
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
