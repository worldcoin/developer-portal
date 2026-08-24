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
// Redis unavailable: the cron fails closed (503) on the global and per-RP locks.
// Handler guards also fail closed when the per-RP lock cannot be read, so a
// migration that already acquired the lock cannot race with user operations.
// The per-RP lock is acquired for USER_OP_MAX_VALIDITY_MS (+ margin). Successful
// and pre-submission failures release it early; confirmation timeouts leave it
// in place so toggle / rotate / mode-switch stay blocked while the op can land.

import "server-only";

import { getSdk as getVerifySchemaSdk } from "@/api/hasura/register-rp/graphql/verify-manager-key-schema.generated";
import { createManagerKey, getEthAddressFromKMS } from "@/api/helpers/kms-eth";
import { USER_OP_MAX_VALIDITY_MS } from "@/api/helpers/user-operation";
import { logger } from "@/lib/logger";
import type { KMSClient } from "@aws-sdk/client-kms";
import { gql, type GraphQLClient } from "graphql-request";
import { randomUUID } from "node:crypto";

const RP_LOCK_KEY_PREFIX = "rp-manager-key-migration:rp:";
const RP_MIGRATION_SETTLE_MARGIN_MS = 5 * 60 * 1000;

/**
 * The per-RP lock TTL. Matches the UserOp validity window plus clock-skew
 * margin, so a submitted migration cannot outlive its lock.
 */
export const RP_MIGRATION_LOCK_TTL_MS =
  USER_OP_MAX_VALIDITY_MS + RP_MIGRATION_SETTLE_MARGIN_MS;

const HEAL_RP_MANAGER_KEY = gql`
  mutation HealRpManagerKeyAfterMigration(
    $rp_id: String!
    $old_manager_key_id: String!
    $shared_manager_key_id: String!
  ) {
    update_rp_registration(
      where: {
        rp_id: { _eq: $rp_id }
        mode: { _eq: managed }
        manager_kms_key_id: { _eq: $old_manager_key_id }
        is_unique_manager_key: { _eq: true }
      }
      _set: {
        manager_kms_key_id: $shared_manager_key_id
        is_unique_manager_key: false
      }
    ) {
      affected_rows
    }
  }
`;

let cachedSharedManagerKeyId: string | null = null;
let cachedSharedManagerAddress: string | null = null;

function addressesEqual(left: string, right: string): boolean {
  return left.toLowerCase() === right.toLowerCase();
}

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
    ...args: Array<string | number>
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
      RP_MIGRATION_LOCK_TTL_MS,
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
 * True when a migration attempt may have left a UserOp that can still land.
 * Includes submit_transfer failures where the bundler may have accepted the op
 * before the HTTP response failed (operationHashes not yet recorded).
 */
export function migrationMayHaveInFlightOperation(
  result:
    | {
        status: string;
        operationHashes?: Record<string, string>;
        failure?: { stage: string };
      }
    | null
    | undefined,
): boolean {
  if (!result || result.status !== "failed") return false;
  if (Object.keys(result.operationHashes ?? {}).length > 0) return true;
  return (
    result.failure?.stage === "submit_transfer" ||
    result.failure?.stage === "unexpected"
  );
}

/**
 * After a handler claims the DB slot, abort if the migration cron holds the
 * per-RP Redis lock. Fail closed when Redis is missing or the lock read errors.
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
  const abortWithConflict = async (): Promise<T> => {
    await revert();
    return onConflict();
  };

  const redis = global.RedisClient as RedisLockClient | undefined;
  if (!redis) return abortWithConflict();

  try {
    const held = await redis.get(rpMigrationLockKey(rpId));
    if (!held) return null;

    return abortWithConflict();
  } catch (error) {
    logger.warn("Failed to check RP manager migration per-RP lock", {
      error,
      rp_id: rpId,
    });
    return abortWithConflict();
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
  kmsRegion,
  rpIdString,
  appId,
}: {
  kmsClient: KMSClient;
  /**
   * Region the RP registry's manager keys live in. Required whenever it differs
   * from AWS_REGION_NAME: a bare key ID is expanded to an ARN that carries its
   * own region, so omitting it derives the address from a key in the wrong
   * region — and it must agree with the address `resolveManagerAddress` derives
   * for the on-chain ownership check.
   */
  kmsRegion?: string;
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
      const managerAddress = await getEthAddressFromKMS(
        kmsClient,
        sharedKeyId,
        kmsRegion,
      );
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

export type DeactivationManagerKeys = {
  primaryManagerKmsKeyId: string;
  stagingManagerKmsKeyId: string;
};

async function getSharedManagerKeyConfig(
  kmsClient: KMSClient,
  kmsRegion?: string,
): Promise<
  | { ok: true; keyId: string; address: string }
  | { ok: false; code: "kms_error"; detail: string }
> {
  const keyId = process.env.RP_REGISTRY_MANAGER_KMS_KEY_ID?.trim();
  if (!keyId) {
    return {
      ok: false,
      code: "kms_error",
      detail: "Shared manager key is not configured.",
    };
  }

  if (cachedSharedManagerKeyId === keyId && cachedSharedManagerAddress) {
    return { ok: true, keyId, address: cachedSharedManagerAddress };
  }

  try {
    const address = await getEthAddressFromKMS(kmsClient, keyId, kmsRegion);
    cachedSharedManagerKeyId = keyId;
    cachedSharedManagerAddress = address;
    return { ok: true, keyId, address };
  } catch (error) {
    logger.error("Failed to derive address for shared manager key", { error });
    return {
      ok: false,
      code: "kms_error",
      detail: "Failed to resolve manager key.",
    };
  }
}

export async function resolveManagerKeyForDeactivation({
  client,
  kmsClient,
  kmsRegion,
  rpIdString,
  dbManagerKmsKeyId,
  primaryOnChainManager,
  stagingOnChainManager,
  primaryActive,
  stagingActive,
  stagingRegistryConfigured,
}: {
  client: GraphQLClient;
  kmsClient: KMSClient;
  /** See resolveManagerKeyForRegistration — same region requirement. */
  kmsRegion?: string;
  rpIdString: string;
  dbManagerKmsKeyId: string;
  primaryOnChainManager: string;
  stagingOnChainManager: string | null;
  primaryActive: boolean;
  stagingActive: boolean;
  stagingRegistryConfigured: boolean;
}): Promise<
  | { ok: true; keys: DeactivationManagerKeys }
  | { ok: false; code: "kms_error"; detail: string }
> {
  const sharedKeyId = process.env.RP_REGISTRY_MANAGER_KMS_KEY_ID?.trim();
  if (!sharedKeyId) {
    return {
      ok: true,
      keys: {
        primaryManagerKmsKeyId: dbManagerKmsKeyId,
        stagingManagerKmsKeyId: dbManagerKmsKeyId,
      },
    };
  }

  const shared = await getSharedManagerKeyConfig(kmsClient, kmsRegion);
  if (!shared.ok) return shared;

  const keyForRegistry = (
    onChainManager: string | null,
    active: boolean,
  ): string => {
    if (!active || !onChainManager) return dbManagerKmsKeyId;
    return addressesEqual(onChainManager, shared.address)
      ? shared.keyId
      : dbManagerKmsKeyId;
  };

  const primaryManagerKmsKeyId = keyForRegistry(
    primaryOnChainManager,
    primaryActive,
  );
  const stagingManagerKmsKeyId = keyForRegistry(
    stagingOnChainManager,
    stagingRegistryConfigured && stagingActive,
  );

  const applicableSharedOnChain: boolean[] = [];
  if (primaryActive) {
    applicableSharedOnChain.push(
      addressesEqual(primaryOnChainManager, shared.address),
    );
  }
  if (stagingRegistryConfigured && stagingActive && stagingOnChainManager) {
    applicableSharedOnChain.push(
      addressesEqual(stagingOnChainManager, shared.address),
    );
  }

  const shouldHealDb =
    dbManagerKmsKeyId !== shared.keyId &&
    applicableSharedOnChain.length > 0 &&
    applicableSharedOnChain.every(Boolean);

  if (shouldHealDb) {
    try {
      await client.request<
        { update_rp_registration: { affected_rows: number } | null },
        {
          rp_id: string;
          old_manager_key_id: string;
          shared_manager_key_id: string;
        }
      >(HEAL_RP_MANAGER_KEY, {
        rp_id: rpIdString,
        old_manager_key_id: dbManagerKmsKeyId,
        shared_manager_key_id: shared.keyId,
      });
    } catch (error) {
      logger.warn(
        "Failed to heal RP manager key in database during deactivation",
        {
          error,
          rp_id: rpIdString,
        },
      );
    }
  }

  return {
    ok: true,
    keys: { primaryManagerKmsKeyId, stagingManagerKmsKeyId },
  };
}
