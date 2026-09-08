/**
 * Live S3 smoke test: lists, downloads, and parses the newest totals CSV from
 * the real bucket — the exact pipeline production runs, allowlist not
 * involved. Runs only when the bucket env vars (and AWS credentials) are
 * present; skipped everywhere else, including CI.
 *
 * Run against staging:
 *   AWS_PROFILE=devportalstaging \
 *   SELFIE_CHECK_ANALYTICS_S3_BUCKET_NAME=544885083450-eu-west-1-devportal-selfie-check-analytics-staging \
 *   SELFIE_CHECK_ANALYTICS_S3_REGION=eu-west-1 \
 *   SELFIE_CHECK_ANALYTICS_TOTALS_PREFIX=staging/ \
 *   npx jest tests/api/helpers/selfie-check-analytics-live-s3.test.ts
 */
import { parseTotalsTable } from "@/api/helpers/selfie-check-analytics/format-tables";
import { downloadCsv, listCsv } from "@/api/helpers/selfie-check-analytics/s3";

const hasLiveBucketConfig = Boolean(
  process.env.SELFIE_CHECK_ANALYTICS_S3_BUCKET_NAME &&
    process.env.SELFIE_CHECK_ANALYTICS_S3_REGION,
);

const describeLive = hasLiveBucketConfig ? describe : describe.skip;

describeLive("selfie-check analytics live S3 pipeline", () => {
  jest.setTimeout(30_000);

  it("downloads and parses the newest totals CSV end to end", async () => {
    const prefix = process.env.SELFIE_CHECK_ANALYTICS_TOTALS_PREFIX ?? "total/";

    const newest = await listCsv(prefix);
    const { csv, object } = await downloadCsv(newest);
    const table = parseTotalsTable(csv);

    expect(table.records.size).toBeGreaterThan(0);

    const [firstAppId, firstRow] = [...table.records.entries()][0]!;
    console.info(
      `newest object: ${object.key} (${object.sizeBytes} bytes, ` +
        `data as of ${object.dataAsOf.toISOString()})`,
    );
    console.info(`apps in table: ${table.records.size}`);
    console.info(`first row (${firstAppId}):`, firstRow);
  });
});
