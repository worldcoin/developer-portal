import "server-only";

/**
 * Parses selfie-check analytics CSVs into app-indexed, typed tables.
 * Totals contain one row per app; daily tables contain ordered row arrays per app.
 */

import {
  pickDailyRow,
  pickTotalsRow,
  type DailyRow,
  type TotalsRow,
} from "@/lib/selfie-check-analytics";
import { parse, type Info } from "csv-parse/sync";

const APP_ID_COLUMNS = ["PARTNER_APP_ID", "APP_ID"] as const;
const DAY_COLUMN = "DAY";
const OS_NAME_COLUMN = "OS_NAME";
const HEADER_PATTERN = /^[A-Z][A-Z0-9_]*$/;
const NON_NEGATIVE_NUMBER_PATTERN =
  /^(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/;
const MAX_COLUMNS = 100;
const MAX_FIELD_CHARACTERS = 4_096;
const MAX_ROWS = 250_000;
const MAX_RECORD_BYTES = 1024 * 1024;

// ============================================================================
// Types
// ============================================================================

type AppIdColumn = (typeof APP_ID_COLUMNS)[number];

type CsvRecord = Readonly<{
  info: Info;
  record: Readonly<Record<string, string>>;
}>;

type ParsedCsv = Readonly<{
  appIdColumn: AppIdColumn;
  headers: readonly string[];
  records: readonly CsvRecord[];
}>;

export type ParsedTable<TRecord> = Readonly<{
  headers: readonly string[];
  records: ReadonlyMap<string, TRecord>;
}>;

export type ParsedTotalsTable = ParsedTable<TotalsRow>;
export type ParsedDailyTable = ParsedTable<readonly DailyRow[]>;

export class TableValidationError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "TableValidationError";
  }
}

// ============================================================================
// Shared CSV Parsing
// ============================================================================

function normalizeHeader(header: string): string {
  return header.trim().toUpperCase();
}

function normalizeMetricName(header: string): string {
  return header.toLowerCase();
}

function parseMetricValue({
  column,
  rowNumber,
  value,
}: {
  column: string;
  rowNumber: number;
  value: string;
}): number | null {
  if (value === "") return null;
  // Snowflake writes NULL as \N; some exports double-escape it to \\N.
  // NULL means "no value", never zero — 0/0 rates must render as absent.
  if (value === "\\N" || value === "\\\\N") return null;

  if (!NON_NEGATIVE_NUMBER_PATTERN.test(value)) {
    throw new TableValidationError(
      `Table row ${rowNumber}, column ${column} is not a non-negative number.`,
    );
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new TableValidationError(
      `Table row ${rowNumber}, column ${column} is not finite.`,
    );
  }

  if (Number.isInteger(parsed) && !Number.isSafeInteger(parsed)) {
    throw new TableValidationError(
      `Table row ${rowNumber}, column ${column} exceeds JavaScript's safe integer range.`,
    );
  }

  return parsed;
}

function validateHeaders(rawHeaders: string[]): {
  appIdColumn: AppIdColumn;
  headers: string[];
} {
  if (rawHeaders.length === 0) {
    throw new TableValidationError("Table has no header row.");
  }

  if (rawHeaders.length > MAX_COLUMNS) {
    throw new TableValidationError(
      `Table has ${rawHeaders.length} columns; maximum is ${MAX_COLUMNS}.`,
    );
  }

  const headers = rawHeaders.map(normalizeHeader);
  const seen = new Set<string>();

  for (const header of headers) {
    if (!HEADER_PATTERN.test(header)) {
      throw new TableValidationError(
        `Table contains an invalid header: ${JSON.stringify(header)}.`,
      );
    }

    if (seen.has(header)) {
      throw new TableValidationError(
        `Table contains a duplicate header: ${header}.`,
      );
    }
    seen.add(header);
  }

  const appIdColumn = APP_ID_COLUMNS.find((column) => seen.has(column));
  if (!appIdColumn) {
    throw new TableValidationError(
      `Table must contain one of: ${APP_ID_COLUMNS.join(", ")}.`,
    );
  }

  return { appIdColumn, headers };
}

function parseCsv(csv: string): ParsedCsv {
  let headers: string[] | undefined;
  let appIdColumn: AppIdColumn | undefined;
  let records: CsvRecord[];

  try {
    records = parse<CsvRecord>(csv, {
      bom: true,
      columns: (rawHeaders) => {
        const validated = validateHeaders(rawHeaders);
        headers = validated.headers;
        appIdColumn = validated.appIdColumn;
        return headers;
      },
      info: true,
      max_record_size: MAX_RECORD_BYTES,
      relax_column_count: false,
      skip_empty_lines: true,
      trim: true,
    });
  } catch (error) {
    if (error instanceof TableValidationError) throw error;
    throw new TableValidationError("Unable to parse table CSV.", {
      cause: error,
    });
  }

  if (!headers || !appIdColumn) {
    throw new TableValidationError("Table has no header row.");
  }

  if (records.length > MAX_ROWS) {
    throw new TableValidationError(
      `Table has ${records.length} rows; maximum is ${MAX_ROWS}.`,
    );
  }

  return {
    appIdColumn,
    headers: Object.freeze(headers),
    records,
  };
}

function validateFieldLengths(
  headers: readonly string[],
  record: Readonly<Record<string, string>>,
  rowNumber: number,
): void {
  for (const header of headers) {
    const value = record[header] ?? "";
    if (value.length > MAX_FIELD_CHARACTERS) {
      throw new TableValidationError(
        `Table row ${rowNumber}, column ${header} exceeds ` +
          `${MAX_FIELD_CHARACTERS} characters.`,
      );
    }
  }
}

function parseMetricFields({
  excludedColumns,
  headers,
  record,
  rowNumber,
}: {
  excludedColumns: ReadonlySet<string>;
  headers: readonly string[];
  record: Readonly<Record<string, string>>;
  rowNumber: number;
}): Record<string, number | null> {
  const fields: Record<string, number | null> = {};

  for (const header of headers) {
    if (excludedColumns.has(header)) continue;
    fields[normalizeMetricName(header)] = parseMetricValue({
      column: header,
      rowNumber,
      value: record[header] ?? "",
    });
  }

  return fields;
}

// ============================================================================
// Totals Table
// ============================================================================

const TOTALS_NON_METRIC_COLUMNS = new Set<string>(APP_ID_COLUMNS);

/** Parses a totals CSV into exactly one typed row per app ID. */
export function parseTotalsTable(csv: string): ParsedTotalsTable {
  const parsedCsv = parseCsv(csv);
  const records = new Map<string, TotalsRow>();

  for (const { info, record } of parsedCsv.records) {
    validateFieldLengths(parsedCsv.headers, record, info.lines);
    const appId = record[parsedCsv.appIdColumn] ?? "";

    if (records.has(appId)) {
      throw new TableValidationError(
        `Totals table contains a duplicate app ID: ${appId}.`,
      );
    }

    const fields = parseMetricFields({
      excludedColumns: TOTALS_NON_METRIC_COLUMNS,
      headers: parsedCsv.headers,
      record,
      rowNumber: info.lines,
    });
    const row = pickTotalsRow({ appId, ...fields });

    if (!row) {
      throw new TableValidationError(
        `Table row ${info.lines} is missing or has an invalid required totals column.`,
      );
    }

    records.set(appId, Object.freeze(row));
  }

  return { headers: parsedCsv.headers, records };
}

// ============================================================================
// Daily Table
// ============================================================================

const DAILY_NON_METRIC_COLUMNS = new Set<string>([
  ...APP_ID_COLUMNS,
  DAY_COLUMN,
  OS_NAME_COLUMN,
]);

/**
 * Parses a daily CSV into ordered row arrays per app ID.
 * Every source row is preserved, and `(appId, day, os_name)` must be unique.
 */
export function parseDailyTable(csv: string): ParsedDailyTable {
  const parsedCsv = parseCsv(csv);
  const mutableRecords = new Map<string, DailyRow[]>();
  const rowKeysByApp = new Map<string, Set<string>>();

  for (const { info, record } of parsedCsv.records) {
    validateFieldLengths(parsedCsv.headers, record, info.lines);
    const appId = record[parsedCsv.appIdColumn] ?? "";
    const fields = parseMetricFields({
      excludedColumns: DAILY_NON_METRIC_COLUMNS,
      headers: parsedCsv.headers,
      record,
      rowNumber: info.lines,
    });
    const row = pickDailyRow({
      appId,
      day: record[DAY_COLUMN] ?? "",
      os_name: record[OS_NAME_COLUMN] ?? "",
      ...fields,
    });

    if (!row) {
      throw new TableValidationError(
        `Table row ${info.lines} is missing or has an invalid required daily column.`,
      );
    }

    const rowKey = JSON.stringify([row.day, row.os_name]);
    const appRowKeys = rowKeysByApp.get(appId) ?? new Set<string>();
    if (appRowKeys.has(rowKey)) {
      throw new TableValidationError(
        `Daily table contains a duplicate app/day/OS row: ` +
          `${appId}, ${row.day}, ${row.os_name}.`,
      );
    }
    appRowKeys.add(rowKey);
    rowKeysByApp.set(appId, appRowKeys);

    const appRows = mutableRecords.get(appId);
    if (appRows) {
      appRows.push(Object.freeze(row));
    } else {
      mutableRecords.set(appId, [Object.freeze(row)]);
    }
  }

  const records = new Map<string, readonly DailyRow[]>();
  for (const [appId, rows] of mutableRecords) {
    records.set(appId, Object.freeze(rows));
  }

  return { headers: parsedCsv.headers, records };
}
