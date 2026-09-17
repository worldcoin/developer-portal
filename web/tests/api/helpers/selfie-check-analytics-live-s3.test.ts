/**
 * Live S3 smoke test: lists, downloads, and parses the newest CSV of every
 * analytics table through the real snapshot loaders. Opt-in only, so a local
 * .env with bucket settings never turns a unit run into a network run:
 *
 *   SELFIE_CHECK_ANALYTICS_LIVE_TEST=true \
 *   SELFIE_CHECK_ANALYTICS_S3_BUCKET_NAME=… SELFIE_CHECK_ANALYTICS_S3_REGION=… \
 *   npx jest --runTestsByPath tests/api/helpers/selfie-check-analytics-live-s3.test.ts
 */

import {
  loadLatestPeriodTableSnapshot,
  loadLatestTotalsTableSnapshot,
} from "@/api/helpers/selfie-check-analytics/snapshots";
import { PERIOD_TABLES } from "@/lib/analytics-time-interval";

const hasLiveBucketConfig = Boolean(
  process.env.SELFIE_CHECK_ANALYTICS_LIVE_TEST === "true" &&
    process.env.SELFIE_CHECK_ANALYTICS_S3_BUCKET_NAME &&
    process.env.SELFIE_CHECK_ANALYTICS_S3_REGION,
);

const describeLive = hasLiveBucketConfig ? describe : describe.skip;

describeLive("selfie-check analytics live S3 pipeline", () => {
  jest.setTimeout(30_000);

  it("downloads and parses the newest totals CSV end to end", async () => {
    const snapshot = await loadLatestTotalsTableSnapshot();

    expect(snapshot.isFallback).toBe(false);
    expect(snapshot.records.size).toBeGreaterThan(0);
  });

  it.each(PERIOD_TABLES)(
    "downloads and parses the newest %s CSV end to end",
    async (table) => {
      const snapshot = await loadLatestPeriodTableSnapshot(table);

      expect(snapshot.isFallback).toBe(false);
      expect(snapshot.records.size).toBeGreaterThan(0);
      for (const rows of snapshot.records.values()) {
        expect(rows.length).toBeGreaterThan(0);
      }
    },
  );
});
