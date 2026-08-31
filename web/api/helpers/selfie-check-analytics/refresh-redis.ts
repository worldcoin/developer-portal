import "server-only";

import {
  parseDailyTable,
  parseTotalsTable,
  type ParsedTable,
} from "./format-tables";
import {
  markDatasetChecked,
  publishAnalyticsSnapshot,
  releaseAnalyticsRefreshLock,
  tryAcquireAnalyticsRefreshLock,
  type AnalyticsDataset,
} from "./redis-store";
import { downloadCsv, listCsv } from "./s3";

type RefreshResult = "published" | "unchanged" | "busy";

type DatasetRefreshConfig<TAppData> = Readonly<{
  dataset: AnalyticsDataset;
  parseCsv: (csv: string) => ParsedTable<TAppData>;
  prefix: string;
}>;

async function refreshDataset<TAppData>({
  dataset,
  parseCsv,
  prefix,
}: DatasetRefreshConfig<TAppData>): Promise<RefreshResult> {
  const source = await listCsv(prefix);
  const lock = await tryAcquireAnalyticsRefreshLock(dataset);
  if (!lock) return "busy";

  try {
    const unchanged = await markDatasetChecked(
      dataset,
      source.identity,
      new Date().toISOString(),
    );
    if (unchanged) return "unchanged";

    const downloaded = await downloadCsv(source);
    const parsedTable = parseCsv(downloaded.csv);
    await publishAnalyticsSnapshot({
      dataset,
      lock,
      records: parsedTable.records,
      source: downloaded.object,
    });
    return "published";
  } finally {
    await releaseAnalyticsRefreshLock(lock);
  }
}

/**
 * Refreshes daily first because totals-row presence is the runtime eligibility
 * gate. A failed daily refresh must not enable an app with incomplete data.
 */
export async function refreshSelfieCheckAnalyticsRedis(): Promise<
  "complete" | "busy"
> {
  const daily = await refreshDataset({
    dataset: "daily",
    parseCsv: parseDailyTable,
    prefix: process.env.SELFIE_CHECK_ANALYTICS_DAILY_PREFIX ?? "daily/",
  });
  if (daily === "busy") return "busy";

  const totals = await refreshDataset({
    dataset: "totals",
    parseCsv: parseTotalsTable,
    prefix: process.env.SELFIE_CHECK_ANALYTICS_TOTALS_PREFIX ?? "total/",
  });
  return totals === "busy" ? "busy" : "complete";
}
