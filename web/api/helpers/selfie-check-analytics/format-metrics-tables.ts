import "server-only";

import { appIdRegex } from "@/lib/schema";
import { logger } from "@/lib/logger";
import { parse } from "csv-parse/sync";
import {
  downloadTotalsCsv,
  findLatestTotalsObject,
  type TableObjectDescriptor,
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

export type TableRow = Readonly<{
  appId: string;
  metrics: Readonly<Record<string, number | null>>;
}>;

export type ParsedTable = Readonly<{
  headers: readonly string[];
  records: ReadonlyMap<string, TableRow>;
}>;

export type TableSnapshot = ParsedTable &
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

type CachedTable = ParsedTable & {
  loadedAtMs: number;
  source: TableObjectDescriptor;
};

export class TableCsvValidationError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "TableCsvValidationError";
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
    throw new TableCsvValidationError(
      `Totals CSV row ${rowNumber}, column ${column} is not a non-negative number.`,
    );
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new TableCsvValidationError(
      `Totals CSV row ${rowNumber}, column ${column} is not finite.`,
    );
  }

  if (Number.isInteger(parsed) && !Number.isSafeInteger(parsed)) {
    throw new TableCsvValidationError(
      `Totals CSV row ${rowNumber}, column ${column} exceeds JavaScript's safe integer range.`,
    );
  }

  return parsed;
};

const validateHeaders = (rawHeaders: string[]) => {
  if (rawHeaders.length === 0) {
    throw new TableCsvValidationError("Totals CSV has no header row.");
  }

  if (rawHeaders.length > MAX_COLUMNS) {
    throw new TableCsvValidationError(
      `Totals CSV has ${rawHeaders.length} columns; maximum is ${MAX_COLUMNS}.`,
    );
  }

  const headers = rawHeaders.map(normalizeHeader);
  const seen = new Set<string>();

  for (const header of headers) {
    if (!HEADER_PATTERN.test(header)) {
      throw new TableCsvValidationError(
        `Totals CSV contains an invalid header: ${JSON.stringify(header)}.`,
      );
    }

    if (seen.has(header)) {
      throw new TableCsvValidationError(
        `Totals CSV contains a duplicate header: ${header}.`,
      );
    }
    seen.add(header);
  }

  const appIdColumn = APP_ID_COLUMNS.find((column) => seen.has(column));
  if (!appIdColumn) {
    throw new TableCsvValidationError(
      `Totals CSV must contain one of: ${APP_ID_COLUMNS.join(", ")}.`,
    );
  }

  return { appIdColumn, headers };
};

/** Parses a metrics table CSV and indexes unique rows by app ID. */
export const parseMetricsTable = (csv: string): ParsedTable => {
  let csvRecords: string[][];

  try {
    csvRecords = parse(csv, {
      bom: true,
      max_record_size: MAX_RECORD_BYTES,
      relax_column_count: false,
      skip_empty_lines: true,
      trim: true,
    }) as string[][];
  } catch (error) {
    throw new TableCsvValidationError("Unable to parse totals CSV.", {
      cause: error,
    });
  }

  const [rawHeaders, ...dataRows] = csvRecords;
  if (!rawHeaders) {
    throw new TableCsvValidationError("Totals CSV has no header row.");
  }

  const { appIdColumn, headers } = validateHeaders(rawHeaders);
  if (dataRows.length > MAX_TOTAL_ROWS) {
    throw new TableCsvValidationError(
      `Totals CSV has ${dataRows.length} rows; maximum is ${MAX_TOTAL_ROWS}.`,
    );
  }

  const appIdIndex = headers.indexOf(appIdColumn);
  const records = new Map<string, TableRow>();

  dataRows.forEach((record, rowIndex) => {
    if (record.length !== headers.length) {
      throw new TableCsvValidationError(
        `Totals CSV row ${rowIndex + 2} has ${record.length} fields; expected ${headers.length}.`,
      );
    }

    const metrics: Record<string, number | null> = {};
    headers.forEach((header, columnIndex) => {
      const value = record[columnIndex] ?? "";
      if (value.length > MAX_FIELD_CHARACTERS) {
        throw new TableCsvValidationError(
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
      throw new TableCsvValidationError(
        `Totals CSV row ${rowIndex + 2} has an invalid app ID.`,
      );
    }

    if (records.has(appId)) {
      throw new TableCsvValidationError(
        `Totals CSV contains a duplicate app ID: ${appId}.`,
      );
    }

    records.set(
      appId,
      Object.freeze({
        appId,
        metrics: Object.freeze(metrics),
      }),
    );
  });

  return {
    headers: Object.freeze(headers),
    records,
  };
};

let cachedTable: CachedTable | null = null;
let pendingRefresh: Promise<TableSnapshot> | null = null;
let nextSnapshotCheckAt = 0;
let lastSnapshotCheckAt = 0;
let lastRefreshFailed = false;
let lastRefreshError: unknown = null;

const toPublicTableSnapshot = (table: CachedTable): TableSnapshot => ({
  headers: table.headers,
  records: table.records,
  isFallback: lastRefreshFailed,
  loadedAt: new Date(table.loadedAtMs).toISOString(),
  lastCheckedAt: new Date(lastSnapshotCheckAt).toISOString(),
  source: {
    etag: table.source.etag,
    identity: table.source.identity,
    key: table.source.key,
    lastModified: table.source.lastModified.toISOString(),
    sizeBytes: table.source.sizeBytes,
  },
});

const refreshTableSnapshot = async (): Promise<TableSnapshot> => {
  const checkStartedAt = Date.now();

  try {
    const latestObject = await findLatestTotalsObject();

    if (cachedTable?.source.identity === latestObject.identity) {
      cachedTable = { ...cachedTable, source: latestObject };
      lastSnapshotCheckAt = Date.now();
      nextSnapshotCheckAt = lastSnapshotCheckAt + SNAPSHOT_CHECK_INTERVAL_MS;
      lastRefreshFailed = false;
      lastRefreshError = null;
      return toPublicTableSnapshot(cachedTable);
    }

    const downloaded = await downloadTotalsCsv(latestObject);
    const parsed = parseMetricsTable(downloaded.csv);
    const loadedAtMs = Date.now();

    // Replace the cache only after the complete new table has downloaded and
    // passed validation. Concurrent readers keep the previous verified map.
    cachedTable = {
      ...parsed,
      loadedAtMs,
      source: downloaded.object,
    };
    lastSnapshotCheckAt = loadedAtMs;
    nextSnapshotCheckAt = loadedAtMs + SNAPSHOT_CHECK_INTERVAL_MS;
    lastRefreshFailed = false;
    lastRefreshError = null;
    return toPublicTableSnapshot(cachedTable);
  } catch (error) {
    lastSnapshotCheckAt = Date.now();
    nextSnapshotCheckAt = lastSnapshotCheckAt + REFRESH_FAILURE_RETRY_MS;
    lastRefreshFailed = true;
    lastRefreshError = error;

    if (!cachedTable) throw error;

    logger.warn(
      "Failed to refresh selfie-check analytics totals; serving the last verified snapshot",
      {
        dependency: "s3",
        dataset: "selfie_check_totals",
        failureClass:
          error instanceof Error ? error.name : "UnknownRefreshError",
        refreshDurationMs: Date.now() - checkStartedAt,
        sourceKey: cachedTable.source.key,
        error,
      },
    );

    return toPublicTableSnapshot(cachedTable);
  }
};

/**
 * Returns the latest verified metrics table.
 *
 * An hourly discovery TTL avoids listing S3 on every request, while pendingRefresh
 * deduplicates concurrent refreshes within an ECS process. A failed refresh
 * never replaces valid cached data.
 */
export const loadLatestTableSnapshot = async ({
  forceRefresh = false,
}: {
  forceRefresh?: boolean;
} = {}): Promise<TableSnapshot> => {
  if (
    !cachedTable &&
    !forceRefresh &&
    lastRefreshError &&
    Date.now() < nextSnapshotCheckAt
  ) {
    throw lastRefreshError;
  }

  if (cachedTable && !forceRefresh && Date.now() < nextSnapshotCheckAt) {
    return toPublicTableSnapshot(cachedTable);
  }

  if (pendingRefresh) return pendingRefresh;

  pendingRefresh = refreshTableSnapshot().finally(() => {
    pendingRefresh = null;
  });

  return pendingRefresh;
};

/** Clears process-local state, primarily for tests and explicit invalidation. */
export const clearTableCache = () => {
  cachedTable = null;
  pendingRefresh = null;
  nextSnapshotCheckAt = 0;
  lastSnapshotCheckAt = 0;
  lastRefreshFailed = false;
  lastRefreshError = null;
};
