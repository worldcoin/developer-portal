import "server-only";

/**
 * Shared Redis storage for analytics tables. S3 is only the CSV exporter;
 * runtime eligibility is presence in the snapshot referenced by `meta`.
 *
 *   selfie-check-analytics:v2:{<dataset>}:meta
 *   selfie-check-analytics:v2:{<dataset>}:refresh-lock
 *   selfie-check-analytics:v2:<dataset>:<snapshotUID>:<appId>
 */

import { logger } from "@/lib/logger";
import { createHash, randomUUID } from "node:crypto";
import type { TableObjectDescriptor } from "./s3";

const KEY_PREFIX = "selfie-check-analytics:v2";

const LOCK_TTL_MS = 60_000;
const META_TTL_SECONDS = 24 * 60 * 60;
// Rows must outlive meta so a live pointer never references expired keys.
const ROW_TTL_SECONDS = 25 * 60 * 60;
const MAX_CONCURRENT_PUBLISH_WRITES = 32;

export type AnalyticsDataset = "totals" | "daily";

/** Redis itself failed or the publisher lost its lock mid-publication. */
export class AnalyticsRedisUnavailableError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "AnalyticsRedisUnavailableError";
  }
}

/** Redis answered, but with data that must not be trusted or published. */
export class AnalyticsRedisDataError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "AnalyticsRedisDataError";
  }
}

export type AnalyticsRefreshLock = Readonly<{
  dataset: AnalyticsDataset;
  owner: string;
}>;

export type AnalyticsDatasetMetadata = Readonly<{
  dataset: AnalyticsDataset;
  snapshotUID: string;
  appCount: number;
  publishedAt: string;
  lastCheckedAt: string;
  source: Readonly<{
    etag?: string;
    identity: string;
    key: string;
    dataAsOf: string;
    lastModified: string;
    sizeBytes: number;
  }>;
}>;

const metadataKey = (dataset: AnalyticsDataset) =>
  `${KEY_PREFIX}:{${dataset}}:metadata`;

const lockKey = (dataset: AnalyticsDataset) =>
  `${KEY_PREFIX}:{${dataset}}:refresh-lock`;

const rowKey = (
  dataset: AnalyticsDataset,
  snapshotUID: string,
  appId: string,
) => `${KEY_PREFIX}:${dataset}:${snapshotUID}:${appId}`;

export const createSnapshotUID = (sourceIdentity: string): string =>
  createHash("sha256").update(sourceIdentity).digest("hex");

const requireRedis = () => {
  const redis = global.RedisClient;
  if (!redis) {
    throw new AnalyticsRedisUnavailableError("Redis client is not configured");
  }
  return redis;
};

const parseDatasetMetadata = (raw: string): AnalyticsDatasetMetadata | null => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  const candidate = parsed as AnalyticsDatasetMetadata;
  const looksValid =
    candidate !== null &&
    typeof candidate === "object" &&
    typeof candidate.snapshotUID === "string" &&
    candidate.snapshotUID.length > 0 &&
    typeof candidate.appCount === "number" &&
    typeof candidate.lastCheckedAt === "string" &&
    typeof candidate.source === "object" &&
    candidate.source !== null &&
    typeof candidate.source.identity === "string";

  return looksValid ? candidate : null;
};

const mapInBatches = async <T>(
  items: readonly T[],
  batchSize: number,
  write: (item: T) => Promise<void>,
): Promise<void> => {
  for (let index = 0; index < items.length; index += batchSize) {
    await Promise.all(items.slice(index, index + batchSize).map(write));
  }
};

// #region Refresh lock

export const tryAcquireAnalyticsRefreshLock = async (
  dataset: AnalyticsDataset,
): Promise<AnalyticsRefreshLock | null> => {
  const redis = global.RedisClient;
  if (!redis) return null;

  const owner = randomUUID();
  try {
    const result = await redis.set(
      lockKey(dataset),
      owner,
      "PX",
      LOCK_TTL_MS,
      "NX",
    );
    return result === "OK" ? { dataset, owner } : null;
  } catch (error) {
    logger.warn("Failed to acquire the analytics refresh lock", {
      dependency: "redis",
      dataset,
      failureClass: error instanceof Error ? error.name : "UnknownRedisError",
      error,
    });
    return null;
  }
};

export const releaseAnalyticsRefreshLock = async (
  lock: AnalyticsRefreshLock,
): Promise<void> => {
  const redis = global.RedisClient;
  if (!redis) return;

  try {
    await redis.eval(
      `if redis.call("get", KEYS[1]) == ARGV[1] then
         return redis.call("del", KEYS[1])
       end
       return 0`,
      1,
      lockKey(lock.dataset),
      lock.owner,
    );
  } catch (error) {
    logger.warn("Failed to release the analytics refresh lock", {
      dependency: "redis",
      dataset: lock.dataset,
      failureClass: error instanceof Error ? error.name : "UnknownRedisError",
      error,
    });
  }
};

// #endregion

// #region Reads

export const getDatasetMetadata = async (
  dataset: AnalyticsDataset,
): Promise<AnalyticsDatasetMetadata | null> => {
  const redis = requireRedis();

  let raw: string | null;
  try {
    raw = await redis.get(metadataKey(dataset));
  } catch (error) {
    throw new AnalyticsRedisUnavailableError(
      "Failed to read the analytics dataset metadata",
      { cause: error },
    );
  }
  if (raw === null) return null;

  const meta = parseDatasetMetadata(raw);
  if (!meta) {
    throw new AnalyticsRedisDataError("Analytics dataset metadata is corrupt");
  }
  return meta;
};

export const getAppFromRedis = async <TRecord>(
  dataset: AnalyticsDataset,
  snapshotUID: string,
  appId: string,
): Promise<TRecord | null> => {
  const redis = requireRedis();

  let raw: string | null;
  try {
    raw = await redis.get(rowKey(dataset, snapshotUID, appId));
  } catch (error) {
    throw new AnalyticsRedisUnavailableError(
      "Failed to read an analytics record",
      { cause: error },
    );
  }
  if (raw === null) return null;

  try {
    return JSON.parse(raw) as TRecord;
  } catch (error) {
    throw new AnalyticsRedisDataError("Analytics record is corrupt", {
      cause: error,
    });
  }
};

export const getTotalsRow = async <TRecord>(
  appId: string,
): Promise<TRecord | null> => {
  const meta = await getDatasetMetadata("totals");
  if (!meta) return null;
  return getAppFromRedis<TRecord>("totals", meta.snapshotUID, appId);
};

export const appExistsInRedis = async (
  dataset: AnalyticsDataset,
  snapshotUID: string,
  appId: string,
): Promise<boolean> => {
  const redis = requireRedis();

  try {
    return (await redis.exists(rowKey(dataset, snapshotUID, appId))) === 1;
  } catch (error) {
    throw new AnalyticsRedisUnavailableError(
      "Failed to check an analytics record",
      { cause: error },
    );
  }
};

// #endregion

// #region Publication

/**
 * Writes every record under a content-addressed snapshot UID, then atomically
 * points `meta` at that snapshot. Callers must hold the refresh lock.
 * Old snapshot keys are left to expire; they are unreachable once `meta`
 * moves, so they cannot grant eligibility.
 */
export const publishAnalyticsSnapshot = async (params: {
  dataset: AnalyticsDataset;
  lock: AnalyticsRefreshLock;
  records: ReadonlyMap<string, unknown>;
  source: TableObjectDescriptor;
}): Promise<void> => {
  const { dataset, lock, records, source } = params;

  if (records.size === 0) {
    throw new AnalyticsRedisDataError(
      "Refusing to publish an empty analytics snapshot",
    );
  }

  const redis = requireRedis();
  const snapshotUID = createSnapshotUID(source.identity);

  const existingRaw = await redis.get(metadataKey(dataset));
  const existing = existingRaw ? parseDatasetMetadata(existingRaw) : null;
  if (existing && existing.snapshotUID !== snapshotUID) {
    const incomingIsNewer =
      source.dataAsOf.toISOString() > existing.source.dataAsOf ||
      (source.dataAsOf.toISOString() === existing.source.dataAsOf &&
        source.lastModified.toISOString() > existing.source.lastModified);
    if (!incomingIsNewer) {
      logger.warn("Skipped publishing a stale analytics snapshot", {
        dependency: "redis",
        dataset,
        incomingIdentity: source.identity,
        currentIdentity: existing.source.identity,
      });
      return;
    }
  }

  await mapInBatches(
    Array.from(records.entries()),
    MAX_CONCURRENT_PUBLISH_WRITES,
    async ([appId, record]) => {
      const result = await redis.set(
        rowKey(dataset, snapshotUID, appId),
        JSON.stringify(record),
        "EX",
        ROW_TTL_SECONDS,
      );
      if (result !== "OK") {
        throw new AnalyticsRedisUnavailableError(
          "Failed to write an analytics record",
        );
      }
    },
  );

  const nowIso = new Date().toISOString();
  const meta: AnalyticsDatasetMetadata = {
    dataset,
    snapshotUID,
    appCount: records.size,
    publishedAt: nowIso,
    lastCheckedAt: nowIso,
    source: {
      etag: source.etag,
      identity: source.identity,
      key: source.key,
      dataAsOf: source.dataAsOf.toISOString(),
      lastModified: source.lastModified.toISOString(),
      sizeBytes: source.sizeBytes,
    },
  };

  // Same-slot EVAL: do not expose this snapshot unless we still own the lock.
  const committed = await redis.eval(
    `if redis.call("get", KEYS[1]) ~= ARGV[1] then
       return 0
     end
     redis.call("set", KEYS[2], ARGV[2], "EX", ARGV[3])
     return 1`,
    2,
    lockKey(dataset),
    metadataKey(dataset),
    lock.owner,
    JSON.stringify(meta),
    String(META_TTL_SECONDS),
  );
  if (committed !== 1) {
    throw new AnalyticsRedisUnavailableError(
      "Lost the analytics refresh lock before publishing the snapshot",
    );
  }
};

/**
 * Updates lastCheckedAt on the live dataset metadata without rewriting app
 * keys. Returns false when metadata is absent, corrupt, expired, or for a
 * different S3 object — callers republish instead.
 */
export const markDatasetChecked = async (
  dataset: AnalyticsDataset,
  sourceIdentity: string,
  lastCheckedAt: string,
): Promise<boolean> => {
  const redis = requireRedis();

  const raw = await redis.get(metadataKey(dataset));
  const meta = raw ? parseDatasetMetadata(raw) : null;
  if (!meta || meta.source.identity !== sourceIdentity) return false;

  const remainingTtlMs = await redis.pttl(metadataKey(dataset));
  if (remainingTtlMs <= 0) return false;

  await redis.set(
    metadataKey(dataset),
    JSON.stringify({ ...meta, lastCheckedAt }),
    "PX",
    remainingTtlMs,
  );
  return true;
};

// #endregion
