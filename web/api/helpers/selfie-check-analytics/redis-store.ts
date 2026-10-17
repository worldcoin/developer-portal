import "server-only";

import { appIdRegex } from "@/lib/schema";
import {
  pickDailyRow,
  pickTotalsRow,
  type DailyRow,
  type TotalsRow,
} from "@/lib/selfie-check-analytics";
import { randomUUID } from "node:crypto";
import type { TableObjectDescriptor } from "./s3";

/**
 * Storage only: callers supply parsed CSV records; this module never reads S3.
 * Rows and app membership are immutable within a publication. The metadata
 * pointer becomes visible only after every write succeeds. Retention/cleanup
 * and integration with the refresh job are separate follow-up work.
 */
const KEY_PREFIX = "selfie-check-analytics";
const REFRESH_LOCK_TTL_MS = 120_000;
const WRITE_BATCH_SIZE = 32;

export type AnalyticsDataset = "total" | "daily";

export const analyticsRedisKeys = {
  data: (dataset: AnalyticsDataset, appId: string, snapshotId: string) =>
    `${KEY_PREFIX}:${appId}:${dataset}:${dataset === "total" ? "row" : "rows"}:${snapshotId}`,
  metadata: (dataset: AnalyticsDataset) => `${KEY_PREFIX}:{${dataset}}:meta`,
  refreshLock: (dataset: AnalyticsDataset) =>
    `${KEY_PREFIX}:{${dataset}}:refresh-lock`,
  // Membership distinguishes an absent app from an evicted/missing row and
  // lets a future cleanup job enumerate one snapshot without scanning Redis.
  apps: (dataset: AnalyticsDataset, snapshotId: string) =>
    `${KEY_PREFIX}:${dataset}:apps:${snapshotId}`,
};

type SnapshotSource = Omit<
  TableObjectDescriptor,
  "dataAsOf" | "lastModified"
> & {
  dataAsOf: string;
  lastModified: string;
};

export type AnalyticsSnapshotMetadata = Readonly<{
  schemaVersion: 1;
  dataset: AnalyticsDataset;
  snapshotId: string;
  appCount: number;
  loadedAt: string;
  lastCheckedAt: string;
  isFallback: boolean;
  source: Readonly<SnapshotSource>;
}>;

export type AnalyticsAppSnapshot<T> = Readonly<{
  data: T;
  metadata: AnalyticsSnapshotMetadata;
}>;

export type AnalyticsRefreshLock = Readonly<{
  dataset: AnalyticsDataset;
  owner: string;
}>;

type SnapshotPublication = {
  lock: AnalyticsRefreshLock;
  source: TableObjectDescriptor;
} & (
  | { dataset: "total"; records: ReadonlyMap<string, TotalsRow> }
  | { dataset: "daily"; records: ReadonlyMap<string, readonly DailyRow[]> }
);

export class AnalyticsRedisUnavailableError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "AnalyticsRedisUnavailableError";
  }
}

export class AnalyticsRedisDataError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "AnalyticsRedisDataError";
  }
}

export class AnalyticsSnapshotConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AnalyticsSnapshotConflictError";
  }
}

async function redisCall<T>(
  operation: (redis: NonNullable<typeof global.RedisClient>) => Promise<T>,
): Promise<T> {
  const redis = global.RedisClient;
  if (!redis) {
    throw new AnalyticsRedisUnavailableError("Redis client is not configured");
  }
  try {
    return await operation(redis);
  } catch (cause) {
    throw new AnalyticsRedisUnavailableError(
      "Analytics Redis operation failed",
      {
        cause,
      },
    );
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0;

const isIsoTimestamp = (value: unknown): value is string => {
  if (typeof value !== "string") return false;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) && date.toISOString() === value;
};

function parseJson(raw: string): unknown {
  try {
    return JSON.parse(raw) as unknown;
  } catch (cause) {
    throw new AnalyticsRedisDataError("Invalid analytics JSON", { cause });
  }
}

function parseMetadata(
  raw: string,
  dataset: AnalyticsDataset,
): AnalyticsSnapshotMetadata {
  const value = parseJson(raw);
  const source = isRecord(value) ? value.source : null;
  if (
    !isRecord(value) ||
    !isRecord(source) ||
    value.schemaVersion !== 1 ||
    value.dataset !== dataset ||
    !isNonEmptyString(value.snapshotId) ||
    !Number.isSafeInteger(value.appCount) ||
    (value.appCount as number) <= 0 ||
    !isIsoTimestamp(value.loadedAt) ||
    !isIsoTimestamp(value.lastCheckedAt) ||
    typeof value.isFallback !== "boolean" ||
    !isNonEmptyString(source.bucket) ||
    !isNonEmptyString(source.region) ||
    !isNonEmptyString(source.key) ||
    !isNonEmptyString(source.identity) ||
    (source.etag !== undefined && typeof source.etag !== "string") ||
    !isIsoTimestamp(source.dataAsOf) ||
    !isIsoTimestamp(source.lastModified) ||
    !Number.isSafeInteger(source.sizeBytes) ||
    (source.sizeBytes as number) <= 0
  ) {
    throw new AnalyticsRedisDataError(`Invalid ${dataset} snapshot metadata`);
  }
  return value as AnalyticsSnapshotMetadata;
}

function validateTotals(value: unknown, appId: string): TotalsRow {
  const row = pickTotalsRow(value);
  if (!appIdRegex.test(appId) || !row || row.appId !== appId) {
    throw new AnalyticsRedisDataError(`Invalid totals row for ${appId}`);
  }
  return row;
}

function validateDaily(value: unknown, appId: string): readonly DailyRow[] {
  if (!appIdRegex.test(appId) || !Array.isArray(value) || value.length === 0) {
    throw new AnalyticsRedisDataError(`Invalid daily rows for ${appId}`);
  }
  const seen = new Set<string>();
  return value.map((item) => {
    const row = pickDailyRow(item);
    if (!row || row.appId !== appId) {
      throw new AnalyticsRedisDataError(`Invalid daily row for ${appId}`);
    }
    const key = JSON.stringify([row.day, row.os_name]);
    if (seen.has(key)) {
      throw new AnalyticsRedisDataError(`Duplicate daily row for ${appId}`);
    }
    seen.add(key);
    return row;
  });
}

export async function getAnalyticsSnapshotMetadata(
  dataset: AnalyticsDataset,
): Promise<AnalyticsSnapshotMetadata | null> {
  const raw = await redisCall((redis) =>
    redis.get(analyticsRedisKeys.metadata(dataset)),
  );
  return raw === null ? null : parseMetadata(raw, dataset);
}

async function getAppSnapshot<T>(
  dataset: AnalyticsDataset,
  appId: string,
  validate: (value: unknown, appId: string) => T,
): Promise<AnalyticsAppSnapshot<T> | null> {
  if (!appIdRegex.test(appId)) {
    throw new AnalyticsRedisDataError("Invalid analytics app ID");
  }
  const metadata = await getAnalyticsSnapshotMetadata(dataset);
  if (!metadata) {
    throw new AnalyticsRedisUnavailableError(
      `No published ${dataset} snapshot`,
    );
  }
  const raw = await redisCall((redis) =>
    redis.get(analyticsRedisKeys.data(dataset, appId, metadata.snapshotId)),
  );
  if (raw !== null) return { data: validate(parseJson(raw), appId), metadata };

  const appsKey = analyticsRedisKeys.apps(dataset, metadata.snapshotId);
  const [isMember, appCount] = await Promise.all([
    redisCall((redis) => redis.sismember(appsKey, appId)),
    redisCall((redis) => redis.scard(appsKey)),
  ]);
  if (isMember || appCount !== metadata.appCount) {
    throw new AnalyticsRedisDataError(`Incomplete ${dataset} snapshot`);
  }
  return null;
}

export const getTotalsForApp = (
  appId: string,
): Promise<AnalyticsAppSnapshot<TotalsRow> | null> =>
  getAppSnapshot("total", appId, validateTotals);

export const getDailyForApp = (
  appId: string,
): Promise<AnalyticsAppSnapshot<readonly DailyRow[]> | null> =>
  getAppSnapshot("daily", appId, validateDaily);

/** The lease bounds a refresh; an expired owner cannot publish or release it. */
export async function tryAcquireAnalyticsRefreshLock(
  dataset: AnalyticsDataset,
): Promise<AnalyticsRefreshLock | null> {
  const owner = randomUUID();
  const result = await redisCall((redis) =>
    redis.set(
      analyticsRedisKeys.refreshLock(dataset),
      owner,
      "PX",
      REFRESH_LOCK_TTL_MS,
      "NX",
    ),
  );
  return result === "OK" ? { dataset, owner } : null;
}

export async function releaseAnalyticsRefreshLock(
  lock: AnalyticsRefreshLock,
): Promise<boolean> {
  const result = await redisCall((redis) =>
    redis.eval(
      `if redis.call('GET', KEYS[1]) == ARGV[1] then
         return redis.call('DEL', KEYS[1])
       end
       return 0`,
      1,
      analyticsRedisKeys.refreshLock(lock.dataset),
      lock.owner,
    ),
  );
  return result === 1;
}

/**
 * Publishes one dataset under the supplied lease; the caller releases the lease
 * in finally. Each attempt gets a fresh ID even when its S3 identity is unchanged,
 * so a delayed writer can never overwrite another attempt's staged/live rows.
 */
export async function publishAnalyticsSnapshot(
  publication: SnapshotPublication,
): Promise<AnalyticsSnapshotMetadata> {
  const { dataset, lock, source, records } = publication;
  if (lock.dataset !== dataset) {
    throw new AnalyticsSnapshotConflictError(
      "Refresh lock belongs to another dataset",
    );
  }
  if (records.size === 0) {
    throw new AnalyticsRedisDataError(
      "Cannot publish an empty analytics snapshot",
    );
  }

  const lockKey = analyticsRedisKeys.refreshLock(dataset);
  const metadataKey = analyticsRedisKeys.metadata(dataset);
  const owner = await redisCall((redis) => redis.get(lockKey));
  if (owner !== lock.owner) {
    throw new AnalyticsSnapshotConflictError("Analytics refresh lock was lost");
  }
  const previousRaw = await redisCall((redis) => redis.get(metadataKey));
  const previous =
    previousRaw === null ? null : parseMetadata(previousRaw, dataset);
  const now = new Date().toISOString();
  let metadata: AnalyticsSnapshotMetadata;
  try {
    metadata = parseMetadata(
      JSON.stringify({
        schemaVersion: 1,
        dataset,
        snapshotId: randomUUID(),
        appCount: records.size,
        loadedAt: now,
        lastCheckedAt: now,
        isFallback: false,
        source: {
          ...source,
          dataAsOf: source.dataAsOf.toISOString(),
          lastModified: source.lastModified.toISOString(),
        },
      }),
      dataset,
    );
  } catch (cause) {
    throw new AnalyticsRedisDataError(
      "Invalid analytics publication metadata",
      { cause },
    );
  }
  if (
    previous &&
    (metadata.source.dataAsOf < previous.source.dataAsOf ||
      (metadata.source.dataAsOf === previous.source.dataAsOf &&
        metadata.source.lastModified < previous.source.lastModified))
  ) {
    throw new AnalyticsSnapshotConflictError(
      "Cannot replace analytics with an older snapshot",
    );
  }

  // Validate and serialize the entire input before the first data write.
  const entries: Array<readonly [string, string]> = [];
  for (const [appId, data] of records) {
    entries.push([
      appId,
      JSON.stringify(
        dataset === "total"
          ? validateTotals(data, appId)
          : validateDaily(data, appId),
      ),
    ]);
  }
  for (let offset = 0; offset < entries.length; offset += WRITE_BATCH_SIZE) {
    const batch = entries.slice(offset, offset + WRITE_BATCH_SIZE);
    // Drain the batch before returning a write error; no writes continue after
    // this publisher settles. Individual commands work across cluster slots.
    const results = await Promise.allSettled(
      batch.map(([appId, json]) =>
        redisCall((redis) =>
          redis.set(
            analyticsRedisKeys.data(dataset, appId, metadata.snapshotId),
            json,
          ),
        ),
      ),
    );
    for (const result of results) {
      if (result.status === "rejected") throw result.reason;
      if (result.value !== "OK") {
        throw new AnalyticsRedisUnavailableError(
          "Analytics row write was not acknowledged",
        );
      }
    }
    await redisCall((redis) =>
      redis.sadd(
        analyticsRedisKeys.apps(dataset, metadata.snapshotId),
        ...batch.map(([appId]) => appId),
      ),
    );
  }

  // These two keys share the dataset hash tag in Redis Cluster. Checking the
  // owner and expected metadata in the same script as SET prevents a delayed
  // writer from publishing after lease expiry or an intervening publication.
  const published = await redisCall((redis) =>
    redis.eval(
      `if redis.call('GET', KEYS[1]) ~= ARGV[1] then return 0 end
     local current = redis.call('GET', KEYS[2])
     if (current or '') ~= ARGV[2] then return 0 end
     redis.call('SET', KEYS[2], ARGV[3])
     return 1`,
      2,
      lockKey,
      metadataKey,
      lock.owner,
      previousRaw ?? "",
      JSON.stringify(metadata),
    ),
  );
  if (published !== 1) {
    throw new AnalyticsSnapshotConflictError(
      "Analytics publication lost its lock or active snapshot changed",
    );
  }
  return metadata;
}
