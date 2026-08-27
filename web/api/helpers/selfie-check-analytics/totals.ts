import "server-only";

import { appIdRegex } from "@/lib/schema";
import { logger } from "@/lib/logger";
import { parse } from "csv-parse/sync";
import {
  downloadTotalsCsv,
  findLatestTotalsObject,
  type TotalsObjectDescriptor,
} from "./s3";

const APP_ID_COLUMNS = ["PARTNER_APP_ID", "APP_ID"] as const;
const HEADER_PATTERN = /^[A-Z][A-Z0-9_]*$/;
const NON_NEGATIVE_NUMBER_PATTERN =
  /^(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/;
const MAX_COLUMNS = 100;
const MAX_FIELD_CHARACTERS = 4_096;
const MAX_TOTAL_ROWS = 250_000;
const MAX_RECORD_BYTES = 1024 * 1024;
const SNAPSHOT_CHECK_INTERVAL_MS = 60 * 60 * 1000;
const REFRESH_FAILURE_RETRY_MS = 60_000;

export type TotalsRow = Readonly<{
  appId: string;
  metrics: Readonly<Record<string, number | null>>;
}>;

export type ParsedTotalsCsv = Readonly<{
  headers: readonly string[];
  rowsByAppId: ReadonlyMap<string, TotalsRow>;
}>;

export type TotalsSnapshot = ParsedTotalsCsv &
  Readonly<{
    isFallback: boolean;
    loadedAt: string;
    lastCheckedAt: string;
    source: Readonly<{
      etag?: string;
      identity: string;
      key: string;
      lastModified: string;
      sizeBytes: number;
    }>;
  }>;

type CachedTotalsSnapshot = ParsedTotalsCsv & {
  loadedAtMs: number;
  source: TotalsObjectDescriptor;
};

export class TotalsCsvValidationError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "TotalsCsvValidationError";
  }
}

const normalizeHeader = (header: string) => header.trim().toUpperCase();
const normalizeMetricName = (header: string) => header.toLowerCase();

const parseMetricValue = ({
  column,
  rowNumber,
  value,
}: {
  column: string;
  rowNumber: number;
  value: string;
}): number | null => {
  if (value === "") return null;

  if (!NON_NEGATIVE_NUMBER_PATTERN.test(value)) {
    throw new TotalsCsvValidationError(
      `Totals CSV row ${rowNumber}, column ${column} is not a non-negative number.`,
    );
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new TotalsCsvValidationError(
      `Totals CSV row ${rowNumber}, column ${column} is not finite.`,
    );
  }

  if (Number.isInteger(parsed) && !Number.isSafeInteger(parsed)) {
    throw new TotalsCsvValidationError(
      `Totals CSV row ${rowNumber}, column ${column} exceeds JavaScript's safe integer range.`,
    );
  }

  return parsed;
};

const validateHeaders = (rawHeaders: string[]) => {
  if (rawHeaders.length === 0) {
    throw new TotalsCsvValidationError("Totals CSV has no header row.");
  }

  if (rawHeaders.length > MAX_COLUMNS) {
    throw new TotalsCsvValidationError(
      `Totals CSV has ${rawHeaders.length} columns; maximum is ${MAX_COLUMNS}.`,
    );
  }

  const headers = rawHeaders.map(normalizeHeader);
  const seen = new Set<string>();

  for (const header of headers) {
    if (!HEADER_PATTERN.test(header)) {
      throw new TotalsCsvValidationError(
        `Totals CSV contains an invalid header: ${JSON.stringify(header)}.`,
      );
    }

    if (seen.has(header)) {
      throw new TotalsCsvValidationError(
        `Totals CSV contains a duplicate header: ${header}.`,
      );
    }
    seen.add(header);
  }

  const appIdColumn = APP_ID_COLUMNS.find((column) => seen.has(column));
  if (!appIdColumn) {
    throw new TotalsCsvValidationError(
      `Totals CSV must contain one of: ${APP_ID_COLUMNS.join(", ")}.`,
    );
  }

  return { appIdColumn, headers };
};

/** Parses the complete totals snapshot and indexes its unique app rows. */
export const parseTotalsCsv = (csv: string): ParsedTotalsCsv => {
  let records: string[][];

  try {
    records = parse(csv, {
      bom: true,
      max_record_size: MAX_RECORD_BYTES,
      relax_column_count: false,
      skip_empty_lines: true,
      trim: true,
    }) as string[][];
  } catch (error) {
    throw new TotalsCsvValidationError("Unable to parse totals CSV.", {
      cause: error,
    });
  }

  const [rawHeaders, ...dataRows] = records;
  if (!rawHeaders) {
    throw new TotalsCsvValidationError("Totals CSV has no header row.");
  }

  const { appIdColumn, headers } = validateHeaders(rawHeaders);
  if (dataRows.length > MAX_TOTAL_ROWS) {
    throw new TotalsCsvValidationError(
      `Totals CSV has ${dataRows.length} rows; maximum is ${MAX_TOTAL_ROWS}.`,
    );
  }

  const appIdIndex = headers.indexOf(appIdColumn);
  const rowsByAppId = new Map<string, TotalsRow>();

  dataRows.forEach((record, rowIndex) => {
    if (record.length !== headers.length) {
      throw new TotalsCsvValidationError(
        `Totals CSV row ${rowIndex + 2} has ${record.length} fields; expected ${headers.length}.`,
      );
    }

    const metrics: Record<string, number | null> = {};
    headers.forEach((header, columnIndex) => {
      const value = record[columnIndex] ?? "";
      if (value.length > MAX_FIELD_CHARACTERS) {
        throw new TotalsCsvValidationError(
          `Totals CSV row ${rowIndex + 2}, column ${header} exceeds ` +
            `${MAX_FIELD_CHARACTERS} characters.`,
        );
      }
      if (header !== appIdColumn) {
        metrics[normalizeMetricName(header)] = parseMetricValue({
          column: header,
          rowNumber: rowIndex + 2,
          value,
        });
      }
    });

    const appId = record[appIdIndex] ?? "";
    if (!appIdRegex.test(appId)) {
      throw new TotalsCsvValidationError(
        `Totals CSV row ${rowIndex + 2} has an invalid app ID.`,
      );
    }

    if (rowsByAppId.has(appId)) {
      throw new TotalsCsvValidationError(
        `Totals CSV contains a duplicate app ID: ${appId}.`,
      );
    }

    rowsByAppId.set(
      appId,
      Object.freeze({
        appId,
        metrics: Object.freeze(metrics),
      }),
    );
  });

  return {
    headers: Object.freeze(headers),
    rowsByAppId,
  };
};

let cachedSnapshot: CachedTotalsSnapshot | null = null;
let pendingRefresh: Promise<TotalsSnapshot> | null = null;
let nextSnapshotCheckAt = 0;
let lastSnapshotCheckAt = 0;
let lastRefreshFailed = false;
let lastRefreshError: unknown = null;

const toPublicSnapshot = (snapshot: CachedTotalsSnapshot): TotalsSnapshot => ({
  headers: snapshot.headers,
  rowsByAppId: snapshot.rowsByAppId,
  isFallback: lastRefreshFailed,
  loadedAt: new Date(snapshot.loadedAtMs).toISOString(),
  lastCheckedAt: new Date(lastSnapshotCheckAt).toISOString(),
  source: {
    etag: snapshot.source.etag,
    identity: snapshot.source.identity,
    key: snapshot.source.key,
    lastModified: snapshot.source.lastModified.toISOString(),
    sizeBytes: snapshot.source.sizeBytes,
  },
});

const refreshTotalsSnapshot = async (): Promise<TotalsSnapshot> => {
  const checkStartedAt = Date.now();

  try {
    const latestObject = await findLatestTotalsObject();

    if (cachedSnapshot?.source.identity === latestObject.identity) {
      cachedSnapshot = { ...cachedSnapshot, source: latestObject };
      lastSnapshotCheckAt = Date.now();
      nextSnapshotCheckAt = lastSnapshotCheckAt + SNAPSHOT_CHECK_INTERVAL_MS;
      lastRefreshFailed = false;
      lastRefreshError = null;
      return toPublicSnapshot(cachedSnapshot);
    }

    const downloaded = await downloadTotalsCsv(latestObject);
    const parsed = parseTotalsCsv(downloaded.csv);
    const loadedAtMs = Date.now();

    // Replace the cache only after the complete new snapshot has downloaded and
    // passed validation. Concurrent readers keep the previous verified map.
    cachedSnapshot = {
      ...parsed,
      loadedAtMs,
      source: downloaded.object,
    };
    lastSnapshotCheckAt = loadedAtMs;
    nextSnapshotCheckAt = loadedAtMs + SNAPSHOT_CHECK_INTERVAL_MS;
    lastRefreshFailed = false;
    lastRefreshError = null;
    return toPublicSnapshot(cachedSnapshot);
  } catch (error) {
    lastSnapshotCheckAt = Date.now();
    nextSnapshotCheckAt = lastSnapshotCheckAt + REFRESH_FAILURE_RETRY_MS;
    lastRefreshFailed = true;
    lastRefreshError = error;

    if (!cachedSnapshot) throw error;

    logger.warn(
      "Failed to refresh selfie-check analytics totals; serving the last verified snapshot",
      {
        dependency: "s3",
        dataset: "selfie_check_totals",
        failureClass:
          error instanceof Error ? error.name : "UnknownRefreshError",
        refreshDurationMs: Date.now() - checkStartedAt,
        sourceKey: cachedSnapshot.source.key,
        error,
      },
    );

    return toPublicSnapshot(cachedSnapshot);
  }
};

/**
 * Returns the latest verified totals map.
 *
 * An hourly discovery TTL avoids listing S3 on every request, while pendingRefresh
 * deduplicates concurrent refreshes within an ECS process. A failed refresh
 * never replaces valid cached data.
 */
export const loadLatestTotalsSnapshot = async ({
  forceRefresh = false,
}: {
  forceRefresh?: boolean;
} = {}): Promise<TotalsSnapshot> => {
  if (
    !cachedSnapshot &&
    !forceRefresh &&
    lastRefreshError &&
    Date.now() < nextSnapshotCheckAt
  ) {
    throw lastRefreshError;
  }

  if (cachedSnapshot && !forceRefresh && Date.now() < nextSnapshotCheckAt) {
    return toPublicSnapshot(cachedSnapshot);
  }

  if (pendingRefresh) return pendingRefresh;

  pendingRefresh = refreshTotalsSnapshot().finally(() => {
    pendingRefresh = null;
  });

  return pendingRefresh;
};

/** Clears process-local state, primarily for tests and explicit invalidation. */
export const clearTotalsSnapshotCache = () => {
  cachedSnapshot = null;
  pendingRefresh = null;
  nextSnapshotCheckAt = 0;
  lastSnapshotCheckAt = 0;
  lastRefreshFailed = false;
  lastRefreshError = null;
};
