// TODO: delete this file after the RP manager key migration completes.
//
// Cleanup checklist:
// 1. Delete this file.
// 2. Remove every call site marked
//    `// TODO: remove after the RP manager key migration completes`.
// 3. Remove per-RP lock acquire/release from `/api/_migrate-rp-manager-keys`.
// 4. Delete the related tests added for these helpers and call sites.
// 5. Remove `ENABLE_SHARED_KEY_RP_REGISTRATION` once all new registrations use
//    the shared key permanently (or fold that path into the permanent flow).
//
// Redis unavailable: the cron already fails closed (503) on the global lock.
// Handler guards fail open so user operations keep working if Redis blips;
// the cron will not run without Redis, so there is no concurrent migration.

import "server-only";

import { getSdk as getVerifySchemaSdk } from "@/api/hasura/register-rp/graphql/verify-manager-key-schema.generated";
import { createManagerKey, getEthAddressFromKMS } from "@/api/helpers/kms-eth";
import { logger } from "@/lib/logger";
import type { KMSClient } from "@aws-sdk/client-kms";
import type { GraphQLClient } from "graphql-request";
import { randomUUID } from "node:crypto";

const RP_LOCK_KEY_PREFIX = "rp-manager-key-migration:rp:";
const RP_LOCK_TTL_MS = 5 * 60 * 1000; // 5 min

type RedisLockClient = {
  get(key: string): Promise<string | null>;
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
    key: string,
    owner: string,
  ): Promise<unknown>;
};

export function rpMigrationLockKey(rpId: string): string {
  return `${RP_LOCK_KEY_PREFIX}${rpId}`;
}

export async function acquireRpMigrationLock(
  rpId: string,
): Promise<
  | { status: "acquired"; owner: string; redis: RedisLockClient }
  | { status: "busy" }
  | { status: "unavailable"; error?: unknown }
> {
  const redis = global.RedisClient as RedisLockClient | undefined;
  if (!redis) return { status: "unavailable" };

  const owner = randomUUID();

  try {
    const result = await redis.set(
      rpMigrationLockKey(rpId),
      owner,
      "PX",
      RP_LOCK_TTL_MS,
      "NX",
    );

    return result === "OK"
      ? { status: "acquired", owner, redis }
      : { status: "busy" };
  } catch (error) {
    return { status: "unavailable", error };
  }
}

export async function releaseRpMigrationLock(
  redis: RedisLockClient,
  rpId: string,
  owner: string,
  attemptId?: string | null,
): Promise<void> {
  try {
    await redis.eval(
      `if redis.call("get", KEYS[1]) == ARGV[1] then
         return redis.call("del", KEYS[1])
       end
       return 0`,
      1,
      rpMigrationLockKey(rpId),
      owner,
    );
  } catch (error) {
    logger.warn("Failed to release RP manager migration per-RP lock", {
      error,
      attempt_id: attemptId,
      rp_id: rpId,
    });
  }
}

/**
 * After a handler claims the DB slot, abort if the migration cron holds the
 * per-RP Redis lock. Fail open when Redis is missing or errors.
 */
export async function abortIfManagerKeyMigrationInFlight<T>({
  rpId,
  revert,
  onConflict,
}: {
  rpId: string;
  revert: () => Promise<void>;
  onConflict: () => T;
}): Promise<T | null> {
  const redis = global.RedisClient as RedisLockClient | undefined;
  if (!redis) return null;

  try {
    const held = await redis.get(rpMigrationLockKey(rpId));
    if (!held) return null;

    await revert();
    return onConflict();
  } catch (error) {
    logger.warn("Failed to check RP manager migration per-RP lock", {
      error,
      rp_id: rpId,
    });
    return null;
  }
}

export async function assertManagerKeySchemaReady(
  client: GraphQLClient,
  rpId: string,
  appId: string,
): Promise<boolean> {
  try {
    await getVerifySchemaSdk(client).VerifyManagerKeySchema({ rp_id: rpId });
    return true;
  } catch (error) {
    logger.error("rp_registration schema is missing is_unique_manager_key", {
      error,
      app_id: appId,
    });
    return false;
  }
}

export type ResolvedManagerKey =
  | {
      ok: true;
      managerKmsKeyId: string;
      managerAddress: string;
      isUniqueManagerKey: boolean;
    }
  | { ok: false; code: "kms_error"; detail: string };

export async function resolveManagerKeyForRegistration({
  kmsClient,
  rpIdString,
  appId,
}: {
  kmsClient: KMSClient;
  rpIdString: string;
  appId: string;
}): Promise<ResolvedManagerKey> {
  const useSharedManagerKey =
    process.env.ENABLE_SHARED_KEY_RP_REGISTRATION === "true";

  if (useSharedManagerKey) {
    const sharedKeyId = process.env.RP_REGISTRY_MANAGER_KMS_KEY_ID?.trim();
    if (!sharedKeyId) {
      return {
        ok: false,
        code: "kms_error",
        detail: "Shared manager key is not configured.",
      };
    }

    try {
      const managerAddress = await getEthAddressFromKMS(kmsClient, sharedKeyId);
      return {
        ok: true,
        managerKmsKeyId: sharedKeyId,
        managerAddress,
        isUniqueManagerKey: false,
      };
    } catch (error) {
      logger.error("Failed to derive address for shared manager key", {
        error,
        app_id: appId,
      });
      return {
        ok: false,
        code: "kms_error",
        detail: "Failed to resolve manager key.",
      };
    }
  }

  const created = await createManagerKey(kmsClient, rpIdString);
  if (!created) {
    return {
      ok: false,
      code: "kms_error",
      detail: "Failed to create manager key.",
    };
  }

  return {
    ok: true,
    managerKmsKeyId: created.keyId,
    managerAddress: created.address,
    isUniqueManagerKey: true,
  };
}
