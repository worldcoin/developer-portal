import "server-only";

import { parseDailyTable, parseTotalsTable } from "./format-tables";
import {
  publishAnalyticsSnapshots,
  releaseAnalyticsRefreshLock,
  tryAcquireAnalyticsRefreshLock,
} from "./redis-store";
import { downloadCsv, listCsv } from "./s3";

/** Downloads, validates, and atomically publishes one matching table pair. */
export async function refreshSelfieCheckAnalyticsRedis(): Promise<
  "complete" | "busy"
> {
  const lock = await tryAcquireAnalyticsRefreshLock();
  if (!lock) return "busy";

  try {
    const [dailySource, totalsSource] = await Promise.all([
      listCsv(process.env.SELFIE_CHECK_ANALYTICS_DAILY_PREFIX ?? "daily/"),
      listCsv(process.env.SELFIE_CHECK_ANALYTICS_TOTALS_PREFIX ?? "total/"),
    ]);

    if (dailySource.dataAsOf.getTime() !== totalsSource.dataAsOf.getTime()) {
      throw new Error(
        "Daily and totals analytics exports have different timestamps",
      );
    }

    const [dailyDownload, totalsDownload] = await Promise.all([
      downloadCsv(dailySource),
      downloadCsv(totalsSource),
    ]);
    const daily = parseDailyTable(dailyDownload.csv);
    const totals = parseTotalsTable(totalsDownload.csv);

    await publishAnalyticsSnapshots({
      lock,
      daily: { records: daily.records, source: dailyDownload.object },
      totals: { records: totals.records, source: totalsDownload.object },
    });
    return "complete";
  } finally {
    await releaseAnalyticsRefreshLock(lock);
  }
}
