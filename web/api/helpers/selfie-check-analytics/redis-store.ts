import "server-only";

/**
 * Shared Redis storage for analytics tables. S3 is only the CSV exporter;
 * runtime eligibility is presence in the snapshot referenced by `metadata`.
 *
 *   selfie-check-analytics:{analytics}:metadata:<dataset>
 *   selfie-check-analytics:{analytics}:refresh-lock
 *   selfie-check-analytics:<dataset>:<snapshotUID>:<appId>
 */

import { logger } from "@/lib/logger";
import {
  pickDailyRow,
  pickTotalsRow,
  type DailyRow,
  type TotalsRow,
} from "@/lib/selfie-check-analytics";
import { createHash, randomUUID } from "node:crypto";
import type { TableObjectDescriptor } from "./s3";

const KEY_PREFIX = "selfie-check-analytics";

// Outlive the cron trigger's 120-second request deadline so a timed-out worker
// cannot overlap another publisher while it is still finishing Redis writes.
const REFRESH_LOCK_TTL_MS = 3 * 60_000;
// The hourly refresh renews the live snapshot while superseded snapshots expire.
const SNAPSHOT_TTL_SECONDS = 7 * 24 * 60 * 60;
const REDIS_CONCURRENCY = 32;

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

export type AnalyticsAppSnapshot<TAppData> = Readonly<{
  data: TAppData;
  metadata: AnalyticsDatasetMetadata;
}>;

const metadataKey = (dataset: AnalyticsDataset) =>
  `${KEY_PREFIX}:{analytics}:metadata:${dataset}`;

const lockKey = () => `${KEY_PREFIX}:{analytics}:refresh-lock`;

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

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0;

const isIsoDate = (value: unknown): value is string => {
  if (typeof value !== "string") return false;
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString() === value;
};

const parseDatasetMetadata = (
  raw: string,
  dataset: AnalyticsDataset,
): AnalyticsDatasetMetadata | null => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  if (!isRecord(parsed) || !isRecord(parsed.source)) return null;

  const validMetadata =
    parsed.dataset === dataset &&
    isNonEmptyString(parsed.snapshotUID) &&
    typeof parsed.appCount === "number" &&
    Number.isSafeInteger(parsed.appCount) &&
    parsed.appCount > 0 &&
    isIsoDate(parsed.publishedAt) &&
    isIsoDate(parsed.lastCheckedAt) &&
    (parsed.source.etag === undefined ||
      typeof parsed.source.etag === "string") &&
    isNonEmptyString(parsed.source.identity) &&
    isNonEmptyString(parsed.source.key) &&
    isIsoDate(parsed.source.dataAsOf) &&
    isIsoDate(parsed.source.lastModified) &&
    typeof parsed.source.sizeBytes === "number" &&
    Number.isSafeInteger(parsed.source.sizeBytes) &&
    parsed.source.sizeBytes >= 0;

  return validMetadata ? (parsed as AnalyticsDatasetMetadata) : null;
};

const parseStoredJson = (
  raw: string,
  dataset: AnalyticsDataset,
  appId: string,
): unknown => {
  try {
    return JSON.parse(raw) as unknown;
  } catch (error) {
    throw new AnalyticsRedisDataError(
      `Stored ${dataset} analytics data is invalid for app ${appId}`,
      { cause: error },
    );
  }
};

const pickStoredTotalsRow = (raw: string, appId: string): TotalsRow => {
  const row = pickTotalsRow(parseStoredJson(raw, "totals", appId));
  if (!row || row.appId !== appId) {
    throw new AnalyticsRedisDataError(
      `Stored totals analytics data is invalid for app ${appId}`,
    );
  }
  return row;
};

const pickStoredDailyRows = (
  raw: string,
  appId: string,
): readonly DailyRow[] => {
  const value = parseStoredJson(raw, "daily", appId);
  if (!Array.isArray(value) || value.length === 0) {
    throw new AnalyticsRedisDataError(
      `Stored daily analytics data is invalid for app ${appId}`,
    );
  }

  const rows = value.map(pickDailyRow);
  if (rows.some((row) => !row || row.appId !== appId)) {
    throw new AnalyticsRedisDataError(
      `Stored daily analytics data is invalid for app ${appId}`,
    );
  }

  return rows as DailyRow[];
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

export const tryAcquireAnalyticsRefreshLock =
  async (): Promise<AnalyticsRefreshLock | null> => {
    const redis = global.RedisClient;
    if (!redis) {
      throw new AnalyticsRedisUnavailableError(
        "Redis client is not configured",
      );
    }

    const owner = randomUUID();
    try {
      const result = await redis.set(
        lockKey(),
        owner,
        "PX",
        REFRESH_LOCK_TTL_MS,
        "NX",
      );
      return result === "OK" ? { owner } : null;
    } catch (error) {
      throw new AnalyticsRedisUnavailableError(
        "Failed to acquire the analytics refresh lock",
        { cause: error },
      );
    }
  };

export const releaseAnalyticsRefreshLock = async (
  lock: AnalyticsRefreshLock,
): Promise<void> => {
  const redis = global.RedisClient;
  if (!redis) {
    logger.warn("Could not release the analytics refresh lock", {
      dependency: "redis",
      failureClass: "RedisClientNotConfigured",
    });
    return;
  }

  try {
    await redis.eval(
      `if redis.call("get", KEYS[1]) == ARGV[1] then
         return redis.call("del", KEYS[1])
      end
       return 0`,
      1,
      lockKey(),
      lock.owner,
    );
  } catch (error) {
    logger.warn("Failed to release the analytics refresh lock", {
      dependency: "redis",
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

  const meta = parseDatasetMetadata(raw, dataset);
  if (!meta) {
    throw new AnalyticsRedisDataError("Analytics dataset metadata is corrupt");
  }
  return meta;
};

const getAppFromRedis = async (
  dataset: AnalyticsDataset,
  snapshotUID: string,
  appId: string,
): Promise<string | null> => {
  const redis = requireRedis();

  try {
    return await redis.get(rowKey(dataset, snapshotUID, appId));
  } catch (error) {
    throw new AnalyticsRedisUnavailableError(
      "Failed to read an analytics record",
      { cause: error },
    );
  }
};

export const getTotalsAppSnapshot = async (
  appId: string,
): Promise<AnalyticsAppSnapshot<TotalsRow> | null> => {
  const metadata = await getDatasetMetadata("totals");
  if (!metadata) return null;

  const raw = await getAppFromRedis("totals", metadata.snapshotUID, appId);
  if (raw === null) return null;

  return { data: pickStoredTotalsRow(raw, appId), metadata };
};

export const getDailyAppSnapshot = async (
  appId: string,
): Promise<AnalyticsAppSnapshot<readonly DailyRow[]> | null> => {
  const metadata = await getDatasetMetadata("daily");
  if (!metadata) return null;

  const raw = await getAppFromRedis("daily", metadata.snapshotUID, appId);
  if (raw === null) return null;

  return { data: pickStoredDailyRows(raw, appId), metadata };
};

/** Returns the input app IDs that have valid rows in the live totals snapshot. */
export const filterAppsWithTotalsData = async (
  appIds: readonly string[],
): Promise<string[]> => {
  if (appIds.length === 0) return [];

  const metadata = await getDatasetMetadata("totals");
  if (!metadata) return [];

  const redis = requireRedis();
  const values = new Array<string | null>(appIds.length).fill(null);

  try {
    await mapInBatches(
      appIds.map((appId, index) => ({ appId, index })),
      REDIS_CONCURRENCY,
      async ({ appId, index }) => {
        values[index] = await redis.get(
          rowKey("totals", metadata.snapshotUID, appId),
        );
      },
    );
  } catch (error) {
    throw new AnalyticsRedisUnavailableError(
      "Failed to read analytics records",
      { cause: error },
    );
  }

  return appIds.filter((appId, index) => {
    const raw = values[index];
    if (raw === null) return false;
    pickStoredTotalsRow(raw, appId);
    return true;
  });
};

// #endregion

// #region Publication

type AnalyticsDatasetPublication = Readonly<{
  records: ReadonlyMap<string, unknown>;
  source: TableObjectDescriptor;
}>;

const buildMetadata = (
  dataset: AnalyticsDataset,
  publication: AnalyticsDatasetPublication,
  publishedAt: string,
): AnalyticsDatasetMetadata => ({
  dataset,
  snapshotUID: createSnapshotUID(publication.source.identity),
  appCount: publication.records.size,
  publishedAt,
  lastCheckedAt: publishedAt,
  source: {
    etag: publication.source.etag,
    identity: publication.source.identity,
    key: publication.source.key,
    dataAsOf: publication.source.dataAsOf.toISOString(),
    lastModified: publication.source.lastModified.toISOString(),
    sizeBytes: publication.source.sizeBytes,
  },
});

const isIncomingSourceOlder = (
  incoming: TableObjectDescriptor,
  existing: AnalyticsDatasetMetadata,
): boolean =>
  incoming.dataAsOf.toISOString() < existing.source.dataAsOf ||
  (incoming.dataAsOf.toISOString() === existing.source.dataAsOf &&
    incoming.lastModified.toISOString() < existing.source.lastModified);

/**
 * Stages both tables, then atomically moves both live metadata pointers. A
 * failed or partial write therefore leaves the complete previous generation
 * visible. Unreferenced rows expire automatically.
 */
export const publishAnalyticsSnapshots = async (params: {
  lock: AnalyticsRefreshLock;
  daily: AnalyticsDatasetPublication;
  totals: AnalyticsDatasetPublication;
}): Promise<void> => {
  const { lock, daily, totals } = params;
  const publications = [
    { dataset: "daily", ...daily },
    { dataset: "totals", ...totals },
  ] as const;

  for (const { dataset, records } of publications) {
    if (records.size === 0) {
      throw new AnalyticsRedisDataError(
        `Refusing to publish an empty ${dataset} analytics snapshot`,
      );
    }
  }

  const existing = await Promise.all(
    publications.map(({ dataset }) => getDatasetMetadata(dataset)),
  );
  for (const [index, publication] of publications.entries()) {
    const current = existing[index];
    if (current && isIncomingSourceOlder(publication.source, current)) {
      throw new AnalyticsRedisDataError(
        `Refusing to replace ${publication.dataset} analytics with an older snapshot`,
      );
    }
  }

  const redis = requireRedis();
  const records = publications.flatMap(({ dataset, source, records }) => {
    const snapshotUID = createSnapshotUID(source.identity);
    return Array.from(records.entries(), ([appId, record]) => ({
      appId,
      dataset,
      record,
      snapshotUID,
    }));
  });

  await mapInBatches(records, REDIS_CONCURRENCY, async (record) => {
    try {
      const result = await redis.set(
        rowKey(record.dataset, record.snapshotUID, record.appId),
        JSON.stringify(record.record),
        "EX",
        SNAPSHOT_TTL_SECONDS,
      );
      if (result !== "OK") {
        throw new AnalyticsRedisUnavailableError(
          "Redis rejected an analytics record write",
        );
      }
    } catch (error) {
      if (error instanceof AnalyticsRedisUnavailableError) throw error;
      throw new AnalyticsRedisUnavailableError(
        `Failed to write a ${record.dataset} analytics record`,
        { cause: error },
      );
    }
  });

  const publishedAt = new Date().toISOString();
  const dailyMetadata = buildMetadata("daily", daily, publishedAt);
  const totalsMetadata = buildMetadata("totals", totals, publishedAt);

  // All three keys share the {analytics} Redis Cluster hash slot.
  let committed: unknown;
  try {
    committed = await redis.eval(
      `if redis.call("get", KEYS[1]) ~= ARGV[1] then
         return 0
       end
       redis.call("set", KEYS[2], ARGV[2])
       redis.call("set", KEYS[3], ARGV[3])
       return 1`,
      3,
      lockKey(),
      metadataKey("daily"),
      metadataKey("totals"),
      lock.owner,
      JSON.stringify(dailyMetadata),
      JSON.stringify(totalsMetadata),
    );
  } catch (error) {
    throw new AnalyticsRedisUnavailableError(
      "Failed to publish analytics dataset metadata",
      { cause: error },
    );
  }
  if (committed !== 1) {
    throw new AnalyticsRedisUnavailableError(
      "Lost the analytics refresh lock before publishing the snapshots",
    );
  }
};

// #endregion
