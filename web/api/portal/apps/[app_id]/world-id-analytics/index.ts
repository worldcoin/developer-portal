import { errorResponse } from "@/api/helpers/errors";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import type { Action_Bool_Exp, Action_V4_Bool_Exp } from "@/graphql/graphql";
import { getIsUserAllowedToReadApp } from "@/lib/permissions";
import { NextRequest, NextResponse } from "next/server";
import { getSdk as getActionDailiesSdk } from "./graphql/get-action-dailies.generated";
import { getSdk as getActionTotalSdk } from "./graphql/get-action-total.generated";
import { getSdk as getAppDailiesSdk } from "./graphql/get-app-dailies.generated";
import { getSdk as getAppTotalSdk } from "./graphql/get-app-total.generated";
import { getSdk as getLegacyActionSdk } from "./graphql/get-legacy-action.generated";
import { getSdk as getLegacyActionsPageSdk } from "./graphql/get-legacy-actions-page.generated";
import { getSdk as getMetaSdk } from "./graphql/get-meta.generated";
import { getSdk as getPageActionStatsSdk } from "./graphql/get-page-action-stats.generated";
import { getSdk as getRpForAppSdk } from "./graphql/get-rp-for-app.generated";
import { getSdk as getV4ActionSdk } from "./graphql/get-v4-action.generated";
import { getSdk as getV4ActionsPageSdk } from "./graphql/get-v4-actions-page.generated";

const DAY_MS = 24 * 60 * 60 * 1000;
const STALE_AFTER_MS = 15 * 60 * 1000;
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 12;
const MAX_PAGE_SIZE = 12;
// Hasura offsets are GraphQL Int (32-bit); overflowing pages are client errors, not 500s.
const MAX_GRAPHQL_INT = 2_147_483_647;
const ALL_TIME_FROM = "0001-01-01";

type AnalyticsClient = Awaited<ReturnType<typeof getAPIServiceGraphqlClient>>;
type Source = "v4" | "legacy";
type Period = "week" | "all_time";

type DailyRow = {
  date: string;
  verifications: number;
  unique_verifications: number;
  repeated_verifications: number;
};

type TotalRow = {
  verifications: number;
  unique_verifications: number;
  repeated_verifications: number;
  latest_verification_at?: string | null;
};

type ActionStatsRow = TotalRow & {
  action_id: string;
};

type SeriesPoint = {
  date: string;
  total: number;
  unique: number;
  repeated: number;
};

type V4ActionItem = {
  action_id: string;
  action: string;
  description: string;
  created_at: string;
  verifications: number;
  unique_verifications: number;
  repeated_verifications: number;
  latest_verification_at: string | null;
};

type LegacyActionItem = {
  action_id: string;
  action: string;
  name: string;
  created_at: string;
  verifications: number;
  unique_verifications: number;
  repeated_verifications: number;
  latest_verification_at: string | null;
};

type ActionsPage = {
  items: Array<V4ActionItem | LegacyActionItem>;
  totalItems: number;
};

function parsePositiveInteger(value: string | null, defaultValue: number) {
  if (value === null) {
    return defaultValue;
  }

  if (!/^[1-9]\d*$/.test(value)) {
    return null;
  }

  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

function escapeIlike(value: string) {
  return value.replace(/[\\%_]/g, "\\$&");
}

function toUtcDay(date: string) {
  return Math.floor(Date.parse(`${date}T00:00:00.000Z`) / DAY_MS);
}

function fromUtcDay(day: number) {
  return new Date(day * DAY_MS).toISOString().slice(0, 10);
}

function emptySeriesPoint(date: string): SeriesPoint {
  return { date, total: 0, unique: 0, repeated: 0 };
}

function addRowToPoint(point: SeriesPoint, row: DailyRow) {
  point.total += row.verifications;
  point.unique += row.unique_verifications;
  point.repeated += row.repeated_verifications;
}

function buildSeries(
  rows: DailyRow[],
  period: Period,
  today: string,
): SeriesPoint[] {
  const todayDay = toUtcDay(today);

  if (period === "week") {
    const firstDay = todayDay - 6;
    const series = Array.from({ length: 7 }, (_, index) =>
      emptySeriesPoint(fromUtcDay(firstDay + index)),
    );

    for (const row of rows) {
      const index = toUtcDay(row.date) - firstDay;
      if (index >= 0 && index < series.length) {
        addRowToPoint(series[index], row);
      }
    }

    return series;
  }

  const rowsThroughToday = rows.filter((row) => toUtcDay(row.date) <= todayDay);
  const firstDataDay =
    rowsThroughToday.length > 0
      ? Math.min(...rowsThroughToday.map((row) => toUtcDay(row.date)))
      : todayDay - 6;
  const totalDays = todayDay - firstDataDay + 1;
  const bucketWidth = rowsThroughToday.length ? Math.ceil(totalDays / 7) : 1;
  const firstBucketDay = todayDay - bucketWidth * 7 + 1;
  const series = Array.from({ length: 7 }, (_, index) =>
    emptySeriesPoint(fromUtcDay(firstBucketDay + index * bucketWidth)),
  );

  for (const row of rowsThroughToday) {
    const index = Math.floor(
      (toUtcDay(row.date) - firstBucketDay) / bucketWidth,
    );
    if (index >= 0 && index < series.length) {
      addRowToPoint(series[index], row);
    }
  }

  return series;
}

function getMetaState(
  rows: Array<{ key: string; timestamp_value?: string | null }>,
) {
  const metadata = new Map(
    rows.map((row) => [row.key, row.timestamp_value ?? null]),
  );
  const watermarkLastSuccessAt =
    metadata.get("watermark_last_success_at") ?? null;
  const watermarkTime = watermarkLastSuccessAt
    ? Date.parse(watermarkLastSuccessAt)
    : Number.NaN;

  return {
    metadata,
    asOf: metadata.get("watermark_last_until") ?? null,
    stale:
      !watermarkLastSuccessAt ||
      !Number.isFinite(watermarkTime) ||
      Date.now() - watermarkTime > STALE_AFTER_MS,
  };
}

function serializeSummary(row: TotalRow | null | undefined) {
  return {
    total: row?.verifications ?? 0,
    unique: row?.unique_verifications ?? 0,
    repeated: row?.repeated_verifications ?? 0,
    latest_verification_at: row?.latest_verification_at ?? null,
  };
}

function getStatsByActionId(rows: ActionStatsRow[]) {
  return new Map(rows.map((row) => [row.action_id, row]));
}

async function validateAction(
  client: AnalyticsClient,
  actionId: string,
  appId: string,
  source: Source,
) {
  if (source === "v4") {
    const { action_v4_by_pk: action } = await getV4ActionSdk(
      client,
    ).GetWorldIdAnalyticsV4Action({
      action_id: actionId,
    });

    return (
      action?.environment === "production" &&
      action.rp_registration.app_id === appId
    );
  }

  const { action_by_pk: action } = await getLegacyActionSdk(
    client,
  ).GetWorldIdAnalyticsLegacyAction({
    action_id: actionId,
  });
  return action?.app_id === appId;
}

async function getV4ActionsPage(params: {
  client: AnalyticsClient;
  appId: string;
  page: number;
  pageSize: number;
  search?: string;
}): Promise<ActionsPage> {
  const { client, appId, page, pageSize, search } = params;
  const { rp_registration: registrations } = await getRpForAppSdk(
    client,
  ).GetWorldIdAnalyticsRpForApp({
    app_id: appId,
  });
  const rpId = registrations[0]?.rp_id;

  if (!rpId) {
    return { items: [], totalItems: 0 };
  }

  const pattern = search ? `%${escapeIlike(search)}%` : null;
  const where: Action_V4_Bool_Exp = {
    rp_id: { _eq: rpId },
    environment: { _eq: "production" },
    ...(pattern
      ? {
          _or: [
            { action: { _ilike: pattern } },
            { description: { _ilike: pattern } },
          ],
        }
      : {}),
  };
  const pageResult = await getV4ActionsPageSdk(
    client,
  ).GetWorldIdAnalyticsV4ActionsPage({
    where,
    limit: pageSize,
    offset: (page - 1) * pageSize,
  });
  const actionIds = pageResult.action_v4.map((action) => action.id);
  const { action_verification_stats_total: statsRows } =
    await getPageActionStatsSdk(client).GetWorldIdAnalyticsPageActionStats({
      action_ids: actionIds,
      source: "v4",
    });
  const statsByActionId = getStatsByActionId(statsRows);

  return {
    items: pageResult.action_v4.map((action) => {
      const stats = statsByActionId.get(action.id);
      return {
        action_id: action.id,
        action: action.action,
        description: action.description,
        created_at: action.created_at,
        verifications: stats?.verifications ?? 0,
        unique_verifications: stats?.unique_verifications ?? 0,
        repeated_verifications: stats?.repeated_verifications ?? 0,
        latest_verification_at: stats?.latest_verification_at ?? null,
      };
    }),
    totalItems: pageResult.action_v4_aggregate.aggregate?.count ?? 0,
  };
}

async function getLegacyActionsPage(params: {
  client: AnalyticsClient;
  appId: string;
  page: number;
  pageSize: number;
  search?: string;
}): Promise<ActionsPage> {
  const { client, appId, page, pageSize, search } = params;
  const pattern = search ? `%${escapeIlike(search)}%` : null;
  const where: Action_Bool_Exp = {
    app_id: { _eq: appId },
    ...(pattern
      ? {
          _or: [{ action: { _ilike: pattern } }, { name: { _ilike: pattern } }],
        }
      : {}),
  };
  const pageResult = await getLegacyActionsPageSdk(
    client,
  ).GetWorldIdAnalyticsLegacyActionsPage({
    where,
    limit: pageSize,
    offset: (page - 1) * pageSize,
  });
  const actionIds = pageResult.action.map((action) => action.id);
  const { action_verification_stats_total: statsRows } =
    await getPageActionStatsSdk(client).GetWorldIdAnalyticsPageActionStats({
      action_ids: actionIds,
      source: "legacy",
    });
  const statsByActionId = getStatsByActionId(statsRows);

  return {
    items: pageResult.action.map((action) => {
      const stats = statsByActionId.get(action.id);
      return {
        action_id: action.id,
        action: action.action,
        name: action.name,
        created_at: action.created_at,
        verifications: stats?.verifications ?? 0,
        unique_verifications: stats?.unique_verifications ?? 0,
        repeated_verifications: stats?.repeated_verifications ?? 0,
        latest_verification_at: stats?.latest_verification_at ?? null,
      };
    }),
    totalItems: pageResult.action_aggregate.aggregate?.count ?? 0,
  };
}

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ app_id: string }> },
) {
  const { app_id: appId } = await props.params;

  try {
    if (!(await getIsUserAllowedToReadApp(appId))) {
      return errorResponse({
        statusCode: 404,
        code: "not_found",
        detail: "App not found.",
        attribute: "app_id",
        app_id: appId,
        req,
      });
    }

    const sourceParam = req.nextUrl.searchParams.get("source") ?? "v4";
    if (sourceParam !== "v4" && sourceParam !== "legacy") {
      return errorResponse({
        statusCode: 400,
        code: "invalid_source",
        detail: "Source must be 'v4' or 'legacy'.",
        attribute: "source",
        app_id: appId,
        req,
      });
    }
    const source: Source = sourceParam;

    const periodParam = req.nextUrl.searchParams.get("period") ?? "week";
    if (periodParam !== "week" && periodParam !== "all_time") {
      return errorResponse({
        statusCode: 400,
        code: "invalid_period",
        detail: "Period must be 'week' or 'all_time'.",
        attribute: "period",
        app_id: appId,
        req,
      });
    }
    const period: Period = periodParam;

    const page = parsePositiveInteger(
      req.nextUrl.searchParams.get("page"),
      DEFAULT_PAGE,
    );
    if (page === null) {
      return errorResponse({
        statusCode: 400,
        code: "invalid_page",
        detail: "Page must be an integer greater than or equal to 1.",
        attribute: "page",
        app_id: appId,
        req,
      });
    }

    const pageSize = parsePositiveInteger(
      req.nextUrl.searchParams.get("page_size"),
      DEFAULT_PAGE_SIZE,
    );
    if (pageSize === null || pageSize > MAX_PAGE_SIZE) {
      return errorResponse({
        statusCode: 400,
        code: "invalid_page_size",
        detail: "Page size must be an integer from 1 to 12.",
        attribute: "page_size",
        app_id: appId,
        req,
      });
    }

    if ((page - 1) * pageSize > MAX_GRAPHQL_INT) {
      return errorResponse({
        statusCode: 400,
        code: "invalid_page",
        detail: "Page is out of range.",
        attribute: "page",
        app_id: appId,
        req,
      });
    }

    const searchParam = req.nextUrl.searchParams.get("search");
    const search = searchParam?.trim();
    if (search && search.length > 64) {
      return errorResponse({
        statusCode: 400,
        code: "invalid_search",
        detail: "Search must not exceed 64 characters.",
        attribute: "search",
        app_id: appId,
        req,
      });
    }

    const actionId = req.nextUrl.searchParams.get("action_id");
    const client = await getAPIServiceGraphqlClient();
    if (
      actionId !== null &&
      !(await validateAction(client, actionId, appId, source))
    ) {
      return errorResponse({
        statusCode: 404,
        code: "action_not_found",
        detail: "Action not found.",
        attribute: "action_id",
        app_id: appId,
        req,
      });
    }

    const today = new Date().toISOString().slice(0, 10);
    const from =
      period === "week" ? fromUtcDay(toUtcDay(today) - 6) : ALL_TIME_FROM;
    const metaPromise = getMetaSdk(client).GetWorldIdAnalyticsMeta();
    const actionsPromise =
      source === "v4"
        ? getV4ActionsPage({
            client,
            appId,
            page,
            pageSize,
            search: search || undefined,
          })
        : getLegacyActionsPage({
            client,
            appId,
            page,
            pageSize,
            search: search || undefined,
          });

    const [metaResult, totalRow, dailyRows, actionsPage] = actionId
      ? await Promise.all([
          metaPromise,
          getActionTotalSdk(client)
            .GetWorldIdAnalyticsActionTotal({
              action_id: actionId,
              source,
            })
            .then((result) => result.action_verification_stats_total_by_pk),
          getActionDailiesSdk(client)
            .GetWorldIdAnalyticsActionDailies({
              action_id: actionId,
              source,
              from,
            })
            .then((result) => result.action_verification_stats_daily),
          actionsPromise,
        ])
      : await Promise.all([
          metaPromise,
          getAppTotalSdk(client)
            .GetWorldIdAnalyticsAppTotal({
              app_id: appId,
              source,
            })
            .then((result) => result.app_verification_stats_total_by_pk),
          getAppDailiesSdk(client)
            .GetWorldIdAnalyticsAppDailies({
              app_id: appId,
              source,
              from,
            })
            .then((result) => result.app_verification_stats_daily),
          actionsPromise,
        ]);
    const meta = getMetaState(metaResult.verification_analytics_meta);
    const reuseIncludedSince =
      source === "v4"
        ? meta.metadata.get("v4_reuse_tracking_started_at") ?? null
        : null;
    const dailyRepeatsIncludedSince =
      source === "v4"
        ? reuseIncludedSince
        : meta.metadata.get("legacy_daily_delta_started_at") ?? null;

    return NextResponse.json(
      {
        scope: actionId === null ? "app" : "action",
        source,
        period,
        as_of: meta.asOf,
        stale: meta.stale,
        coverage: {
          lifetime_total: source === "legacy" ? "exact" : "lower_bound",
          reuse_included_since: reuseIncludedSince,
          daily_repeats_included_since: dailyRepeatsIncludedSince,
          historical_daily_mode: "first_use_only",
          daily_precision: "rollup_attributed",
          timezone: "UTC",
        },
        summary: serializeSummary(totalRow),
        series: buildSeries(dailyRows, period, today),
        actions: {
          items: actionsPage.items,
          page,
          page_size: pageSize,
          total_items: actionsPage.totalItems,
          total_pages: Math.ceil(actionsPage.totalItems / pageSize),
        },
      },
      { status: 200 },
    );
  } catch {
    return errorResponse({
      statusCode: 500,
      code: "server_error",
      detail: "Failed to load World ID analytics.",
      attribute: null,
      app_id: appId,
      req,
    });
  }
}
