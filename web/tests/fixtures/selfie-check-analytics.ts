import type { TableObjectDescriptor } from "@/api/helpers/selfie-check-analytics/s3";

export const appId = "app_0123456789abcdef0123456789abcdef";
export const otherAppId = "app_fedcba9876543210fedcba9876543210";
export const userId = "user_0123456789abcdef0123456789abcdef";
export const teamId = "team_0123456789abcdef0123456789abcdef";

export const totalsCsv = (ids = [appId], value = 0) =>
  [
    "PARTNER_APP_ID,N_USERS_STARTED_AT_LEAST_ONE_SELFIE_CHECK_FLOW,N_USERS_SHARED_AT_LEAST_ONE_PROOF,N_SELFIE_CHECK_STARTED_SESSIONS,N_FACE_CAPTURE_STARTED_SESSIONS,N_FACE_CAPTURE_COMPLETED_SESSIONS,N_PROOF_SHARED_SESSIONS,P_SELFIE_CHECK_TO_FACE_CAPTURE_STARTED_COMPLETION,P_FACE_CAPTURE_STARTED_TO_COMPLETED_COMPLETION,P_FACE_CAPTURE_COMPLETED_TO_PROOF_SHARED_COMPLETION",
    ...ids.map(
      (id) =>
        `${id},${value},${value},${value},${value},${value},${value},0,0,0`,
    ),
  ].join("\n");

const periodHeader = (periodColumn: "DAY" | "WEEK_START" | "MONTH_START") =>
  `PARTNER_APP_ID,${periodColumn},OS_NAME,N_USERS_STARTED_SELFIE_CHECK_FLOW,N_USERS_SHARED_A_PROOF,CUMULATIVE_N_USERS_SHARED_A_PROOF,P_FACE_CAPTURE_COMPLETION`;

export const dailyCsv = (ids = [appId]) =>
  [
    periodHeader("DAY"),
    ...ids.map((id) => `${id},2026-08-26,iOS,10,8,20,0.8`),
  ].join("\n");

export const weeklyCsv = (ids = [appId]) =>
  [
    periodHeader("WEEK_START"),
    ...ids.map((id) => `${id},2026-08-24,iOS,10,8,20,0.8`),
  ].join("\n");

export const monthlyCsv = (ids = [appId]) =>
  [
    periodHeader("MONTH_START"),
    ...ids.map((id) => `${id},2026-08-01,iOS,10,8,20,0.8`),
  ].join("\n");

/** Prefixes each table is listed under when no env override is set. */
export const totalsPrefix = "total/selfie_check_metrics_total/";
export const periodPrefix = {
  daily: "daily/selfie_check_metrics_daily/",
  weekly: "weekly/selfie_check_metrics_weekly/",
  monthly: "monthly/selfie_check_metrics_monthly/",
} as const;

export const source = (
  prefix: string = totalsPrefix,
  revision = 1,
): TableObjectDescriptor => ({
  bucket: "analytics-bucket",
  region: "eu-west-1",
  key: `${prefix}data_20260826_210000.csv`,
  etag: `"revision-${revision}"`,
  identity: `${prefix}:${revision}`,
  dataAsOf: new Date("2026-08-26T21:00:00.000Z"),
  lastModified: new Date("2026-08-26T21:00:00.000Z"),
  sizeBytes: 100,
});
