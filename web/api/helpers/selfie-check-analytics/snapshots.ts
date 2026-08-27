import "server-only";

/**
 * Maintains last-known-good, process-local snapshots for analytics tables.
 * Each table loader owns independent cache, refresh, backoff, and single-flight state.
 */

import { logger } from "@/lib/logger";
import type { DailyRow, TotalsRow } from "@/lib/selfie-check-analytics";
import {
  parseDailyTable,
  parseTotalsTable,
  type ParsedTable,
} from "./format-tables";
import {
  downloadCsv,
  listCsv,
  type TableObjectDescriptor,
  type TablePrefix,
} from "./s3";

const SNAPSHOT_CHECK_INTERVAL_MS = 60_000;
const REFRESH_FAILURE_RETRY_MS = 60_000;

// ============================================================================
// Types
// ============================================================================

export type TableSnapshot<TRecord> = ParsedTable<TRecord> &
  Readonly<{
    isFallback: boolean;
    loadedAt: string;
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

type CachedTable<TRecord> = ParsedTable<TRecord> & {
  loadedAtMs: number;
  source: TableObjectDescriptor;
};

type SnapshotLoadOptions = Readonly<{
  forceRefresh?: boolean;
}>;

type SnapshotLoader<TRecord> = Readonly<{
  clear: () => void;
  load: (options?: SnapshotLoadOptions) => Promise<TableSnapshot<TRecord>>;
}>;

type SnapshotLoaderConfig<TRecord> = Readonly<{
  dataset: string;
  label: string;
  parseCsv: (csv: string) => ParsedTable<TRecord>;
  prefix: TablePrefix;
}>;

export type TotalsTableSnapshot = TableSnapshot<TotalsRow>;
export type DailyTableSnapshot = TableSnapshot<readonly DailyRow[]>;

// ============================================================================
// Snapshot Loader
// ============================================================================

function createSnapshotLoader<TRecord>({
  dataset,
  label,
  parseCsv,
  prefix,
}: SnapshotLoaderConfig<TRecord>): SnapshotLoader<TRecord> {
  let cachedTable: CachedTable<TRecord> | null = null;
  let pendingRefresh: Promise<TableSnapshot<TRecord>> | null = null;
  let nextSnapshotCheckAt = 0;
  let lastSnapshotCheckAt = 0;
  let lastRefreshFailed = false;
  let lastRefreshError: unknown = null;

  function toPublicSnapshot(
    table: CachedTable<TRecord>,
  ): TableSnapshot<TRecord> {
    return {
      headers: table.headers,
      records: table.records,
      isFallback: lastRefreshFailed,
      loadedAt: new Date(table.loadedAtMs).toISOString(),
      lastCheckedAt: new Date(lastSnapshotCheckAt).toISOString(),
      source: {
        etag: table.source.etag,
        identity: table.source.identity,
        key: table.source.key,
        dataAsOf: table.source.dataAsOf.toISOString(),
        lastModified: table.source.lastModified.toISOString(),
        sizeBytes: table.source.sizeBytes,
      },
    };
  }

  async function refresh(): Promise<TableSnapshot<TRecord>> {
    const checkStartedAt = Date.now();

    try {
      const latestObject = await listCsv(prefix);

      if (cachedTable?.source.identity === latestObject.identity) {
        cachedTable = { ...cachedTable, source: latestObject };
        lastSnapshotCheckAt = Date.now();
        nextSnapshotCheckAt = lastSnapshotCheckAt + SNAPSHOT_CHECK_INTERVAL_MS;
        lastRefreshFailed = false;
        lastRefreshError = null;
        return toPublicSnapshot(cachedTable);
      }

      const downloaded = await downloadCsv(latestObject);
      const parsed = parseCsv(downloaded.csv);
      const loadedAtMs = Date.now();

      // Swap only after the entire new table has downloaded and validated.
      // Concurrent readers continue using the previous verified map.
      cachedTable = {
        ...parsed,
        loadedAtMs,
        source: downloaded.object,
      };
      lastSnapshotCheckAt = loadedAtMs;
      nextSnapshotCheckAt = loadedAtMs + SNAPSHOT_CHECK_INTERVAL_MS;
      lastRefreshFailed = false;
      lastRefreshError = null;
      return toPublicSnapshot(cachedTable);
    } catch (error) {
      lastSnapshotCheckAt = Date.now();
      nextSnapshotCheckAt = lastSnapshotCheckAt + REFRESH_FAILURE_RETRY_MS;
      lastRefreshFailed = true;
      lastRefreshError = error;

      if (!cachedTable) throw error;

      logger.warn(
        `Failed to refresh selfie-check analytics ${label}; ` +
          "serving the last verified snapshot",
        {
          dependency: "s3",
          dataset,
          failureClass:
            error instanceof Error ? error.name : "UnknownRefreshError",
          refreshDurationMs: Date.now() - checkStartedAt,
          sourceKey: cachedTable.source.key,
          error,
        },
      );

      return toPublicSnapshot(cachedTable);
    }
  }

  async function load({
    forceRefresh = false,
  }: SnapshotLoadOptions = {}): Promise<TableSnapshot<TRecord>> {
    if (
      !cachedTable &&
      !forceRefresh &&
      lastRefreshError &&
      Date.now() < nextSnapshotCheckAt
    ) {
      throw lastRefreshError;
    }

    if (cachedTable && !forceRefresh && Date.now() < nextSnapshotCheckAt) {
      return toPublicSnapshot(cachedTable);
    }

    if (pendingRefresh) return pendingRefresh;

    pendingRefresh = refresh().finally(() => {
      pendingRefresh = null;
    });

    return pendingRefresh;
  }

  function clear(): void {
    cachedTable = null;
    pendingRefresh = null;
    nextSnapshotCheckAt = 0;
    lastSnapshotCheckAt = 0;
    lastRefreshFailed = false;
    lastRefreshError = null;
  }

  return { clear, load };
}

// ============================================================================
// Table-Specific Loaders
// ============================================================================

const totalsSnapshotLoader = createSnapshotLoader({
  dataset: "selfie_check_totals",
  label: "totals",
  parseCsv: parseTotalsTable,
  prefix: "total/",
});

const dailySnapshotLoader = createSnapshotLoader({
  dataset: "selfie_check_daily",
  label: "daily table",
  parseCsv: parseDailyTable,
  prefix: "daily/",
});

// ============================================================================
// Public API
// ============================================================================

/** Returns the latest verified totals table. */
export function loadLatestTotalsTableSnapshot(
  options?: SnapshotLoadOptions,
): Promise<TotalsTableSnapshot> {
  return totalsSnapshotLoader.load(options);
}

/** Returns the latest verified daily table. */
export function loadLatestDailyTableSnapshot(
  options?: SnapshotLoadOptions,
): Promise<DailyTableSnapshot> {
  return dailySnapshotLoader.load(options);
}

/** Clears both process-local caches, primarily for tests. */
export function clearTableCaches(): void {
  totalsSnapshotLoader.clear();
  dailySnapshotLoader.clear();
}
