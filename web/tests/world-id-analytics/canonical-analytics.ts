import type { Pool } from "pg";

export type SourceDailyRow = {
  action_id: string;
  app_id: string;
  count: string;
  date_utc: string;
  environment: "production" | "staging";
  source: "legacy" | "v4";
};

export type LifetimeRow = Omit<SourceDailyRow, "count" | "date_utc"> & {
  count: string;
};

export type AppDailyRow = Pick<
  SourceDailyRow,
  "app_id" | "count" | "date_utc" | "environment"
>;

export type AppSourceLifetimeRow = Pick<
  SourceDailyRow,
  "app_id" | "count" | "environment" | "source"
>;

const sourceOrder = (left: SourceDailyRow, right: SourceDailyRow) =>
  [
    left.source.localeCompare(right.source),
    left.app_id.localeCompare(right.app_id),
    left.environment.localeCompare(right.environment),
    left.action_id.localeCompare(right.action_id),
    left.date_utc.localeCompare(right.date_utc),
  ].find((comparison) => comparison !== 0) ?? 0;

export const readCanonicalSourceDaily = async (pool: Pool, teamId: string) => {
  const result = await pool.query<SourceDailyRow>(
    `SELECT
       'legacy'::text AS source,
       app.id AS app_id,
       CASE WHEN app.is_staging THEN 'staging' ELSE 'production' END AS environment,
       action.id AS action_id,
       (nullifier.created_at AT TIME ZONE 'UTC')::date::text AS date_utc,
       count(*)::text AS count
     FROM public.nullifier
     JOIN public.action ON action.id = nullifier.action_id
     JOIN public.app ON app.id = action.app_id
     WHERE app.team_id = $1
     GROUP BY app.id, app.is_staging, action.id,
              (nullifier.created_at AT TIME ZONE 'UTC')::date
     UNION ALL
     SELECT
       'v4',
       app.id,
       action_v4.environment::text,
       action_v4.id,
       (nullifier_v4.created_at AT TIME ZONE 'UTC')::date::text,
       count(*)::text
     FROM public.nullifier_v4
     JOIN public.action_v4 ON action_v4.id = nullifier_v4.action_v4_id
     JOIN public.rp_registration ON rp_registration.rp_id = action_v4.rp_id
     JOIN public.app ON app.id = rp_registration.app_id
     WHERE app.team_id = $1
     GROUP BY app.id, action_v4.environment, action_v4.id,
              (nullifier_v4.created_at AT TIME ZONE 'UTC')::date`,
    [teamId],
  );
  return result.rows.sort(sourceOrder);
};

export const readRolledSourceDaily = async (pool: Pool, teamId: string) => {
  const result = await pool.query<SourceDailyRow>(
    `SELECT
       'legacy'::text AS source,
       app.id AS app_id,
       CASE WHEN app.is_staging THEN 'staging' ELSE 'production' END AS environment,
       action.id AS action_id,
       daily.date_utc::text,
       daily.unique_count::text AS count
     FROM public.action_legacy_stats_daily AS daily
     JOIN public.action ON action.id = daily.action_id
     JOIN public.app ON app.id = action.app_id
     WHERE app.team_id = $1
     UNION ALL
     SELECT
       'v4',
       app.id,
       action_v4.environment::text,
       action_v4.id,
       daily.date_utc::text,
       daily.unique_count::text
     FROM public.action_v4_stats_daily AS daily
     JOIN public.action_v4 ON action_v4.id = daily.action_v4_id
     JOIN public.rp_registration ON rp_registration.rp_id = action_v4.rp_id
     JOIN public.app ON app.id = rp_registration.app_id
     WHERE app.team_id = $1`,
    [teamId],
  );
  return result.rows.sort(sourceOrder);
};

export const toLifetimeRows = (rows: SourceDailyRow[]): LifetimeRow[] => {
  const totals = new Map<string, LifetimeRow>();
  for (const row of rows) {
    const key = [row.source, row.app_id, row.environment, row.action_id].join(
      "\u0000",
    );
    const previous = totals.get(key);
    totals.set(key, {
      source: row.source,
      app_id: row.app_id,
      environment: row.environment,
      action_id: row.action_id,
      count: (BigInt(previous?.count ?? "0") + BigInt(row.count)).toString(),
    });
  }
  return [...totals.values()].sort(
    (left, right) =>
      [
        left.source.localeCompare(right.source),
        left.app_id.localeCompare(right.app_id),
        left.environment.localeCompare(right.environment),
        left.action_id.localeCompare(right.action_id),
      ].find((comparison) => comparison !== 0) ?? 0,
  );
};

export const toAppDailyRows = (rows: SourceDailyRow[]): AppDailyRow[] => {
  const totals = new Map<string, AppDailyRow>();
  for (const row of rows) {
    const key = [row.app_id, row.environment, row.date_utc].join("\u0000");
    const previous = totals.get(key);
    totals.set(key, {
      app_id: row.app_id,
      environment: row.environment,
      date_utc: row.date_utc,
      count: (BigInt(previous?.count ?? "0") + BigInt(row.count)).toString(),
    });
  }
  return [...totals.values()].sort(
    (left, right) =>
      [
        left.app_id.localeCompare(right.app_id),
        left.environment.localeCompare(right.environment),
        left.date_utc.localeCompare(right.date_utc),
      ].find((comparison) => comparison !== 0) ?? 0,
  );
};

export const toAppSourceLifetimeRows = (
  rows: SourceDailyRow[],
): AppSourceLifetimeRow[] => {
  const totals = new Map<string, AppSourceLifetimeRow>();
  for (const row of rows) {
    const key = [row.source, row.app_id, row.environment].join("\u0000");
    const previous = totals.get(key);
    totals.set(key, {
      source: row.source,
      app_id: row.app_id,
      environment: row.environment,
      count: (BigInt(previous?.count ?? "0") + BigInt(row.count)).toString(),
    });
  }
  return [...totals.values()].sort(
    (left, right) =>
      [
        left.source.localeCompare(right.source),
        left.app_id.localeCompare(right.app_id),
        left.environment.localeCompare(right.environment),
      ].find((comparison) => comparison !== 0) ?? 0,
  );
};
