import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { getIsUserAllowedToReadApp } from "@/lib/permissions";
import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { getSdk } from "./graphql/get-world-id-analytics.generated";

const DAY_MS = 86_400_000;
type Period = "last_7_days" | "all_time";
type Environment = "staging" | "production";
type Row = { date_utc: string; unique_count: string | number };
type ActionRow = { id: string; created_at: string };

const utcDate = (value: string | Date) =>
  (typeof value === "string" ? new Date(value) : value)
    .toISOString()
    .slice(0, 10);
const dayNumber = (date: string) =>
  Date.parse(`${date}T00:00:00.000Z`) / DAY_MS;
const dateFromDay = (day: number) =>
  new Date(day * DAY_MS).toISOString().slice(0, 10);
const laterDate = (left: string, right: string) =>
  dayNumber(left) > dayNumber(right) ? left : right;

function series(rows: Row[], from: string, through: string) {
  const counts = new Map(
    rows.map((row) => [row.date_utc, BigInt(row.unique_count)]),
  );
  const points = [];
  let total = 0n;
  for (let day = dayNumber(from); day <= dayNumber(through); day += 1) {
    const date = dateFromDay(day);
    const count = counts.get(date) ?? 0n;
    total += count;
    points.push({ date, count: count.toString() });
  }
  return { count: total.toString(), series: points };
}

const badRequest = () =>
  NextResponse.json({ error: "Invalid analytics request" }, { status: 400 });

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ app_id: string }> },
) {
  const { app_id: appId } = await context.params;
  if (!(await getIsUserAllowedToReadApp(appId))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const environment = request.nextUrl.searchParams.get(
    "environment",
  ) as Environment | null;
  const period = request.nextUrl.searchParams.get("period") as Period | null;
  const rawIds = request.nextUrl.searchParams.get("action_ids");
  if (
    !environment ||
    !["staging", "production"].includes(environment) ||
    !period ||
    !["last_7_days", "all_time"].includes(period)
  ) {
    return badRequest();
  }
  const requestedIds = rawIds === null ? [] : rawIds.split(",");
  if (
    requestedIds.length > 12 ||
    requestedIds.some((id) => !id) ||
    new Set(requestedIds).size !== requestedIds.length
  ) {
    return badRequest();
  }

  try {
    const client = await getAPIServiceGraphqlClient();
    const sdk = getSdk(client);
    const scope = await sdk.GetWorldIdAnalyticsScope({
      app_id: appId,
      action_ids: requestedIds,
    });
    const app = scope.app[0];
    if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const rpIds = new Set(app.rp_registration.map((rp: any) => rp.rp_id));
    const legacyById = new Map<string, any>(
      scope.legacy_actions.map((action: any) => [action.id, action]),
    );
    const v4ById = new Map<string, any>(
      scope.actions.map((action: any) => [action.id, action]),
    );
    for (const id of requestedIds) {
      const legacy = legacyById.get(id);
      const v4 = v4ById.get(id);
      const expectsV4 = id.startsWith("action_v4_");
      const legacyEnvironment = app.is_staging ? "staging" : "production";
      if (
        Boolean(legacy) === Boolean(v4) ||
        (expectsV4 ? !v4 : !legacy) ||
        (legacy &&
          (legacy.app_id !== appId || legacyEnvironment !== environment)) ||
        (v4 && (!rpIds.has(v4.rp_id) || v4.environment !== environment))
      ) {
        return badRequest();
      }
    }

    const today = utcDate(new Date());
    const weekStart = dateFromDay(dayNumber(today) - 6);
    const appCreated = utcDate(app.created_at);
    const hasLegacyHistory =
      scope.has_legacy_history.length > 0 &&
      (app.is_staging ? "staging" : "production") === environment;
    const earliestRp = app.rp_registration
      .map((rp: any) => utcDate(rp.created_at))
      .sort()[0];
    const allTimeAppStart = hasLegacyHistory
      ? appCreated
      : earliestRp ?? appCreated;
    const appFrom =
      period === "last_7_days"
        ? laterDate(weekStart, appCreated)
        : allTimeAppStart;
    const actionRows: ActionRow[] = [
      ...requestedIds
        .filter((id) => legacyById.has(id))
        .map((id) => legacyById.get(id)),
      ...requestedIds
        .filter((id) => v4ById.has(id))
        .map((id) => v4ById.get(id)),
    ];
    const actionFrom = actionRows.length
      ? actionRows
          .map((action) =>
            period === "last_7_days"
              ? laterDate(weekStart, utcDate(action.created_at))
              : utcDate(action.created_at),
          )
          .sort()[0]
      : appFrom;
    const readFrom = [appFrom, actionFrom].sort()[0];

    const appResult = await sdk.GetWorldIdAnalyticsAppDaily({
      app_id: appId,
      environment,
      from: appFrom,
      through: today,
    });
    const actionResult = requestedIds.length
      ? await sdk.GetWorldIdAnalyticsActionDaily({
          legacy_ids: requestedIds.filter((id) => legacyById.has(id)),
          action_ids: requestedIds.filter((id) => v4ById.has(id)),
          from: readFrom,
          through: today,
        })
      : { action_legacy_stats_daily: [], action_v4_stats_daily: [] };

    const metricFor = (action: any, rows: Row[]) => {
      const created = utcDate(action.created_at);
      const from =
        period === "last_7_days" ? laterDate(weekStart, created) : created;
      return { id: action.id, ...series(rows, from, today) };
    };
    const legacyActions = requestedIds
      .filter((id) => legacyById.has(id))
      .map((id) => {
        const action = legacyById.get(id);
        return metricFor(
          action,
          actionResult.action_legacy_stats_daily.filter(
            (row: any) => row.action_id === id,
          ),
        );
      });
    const actions = requestedIds
      .filter((id) => v4ById.has(id))
      .map((id) => {
        const action = v4ById.get(id);
        return metricFor(
          action,
          actionResult.action_v4_stats_daily.filter(
            (row: any) => row.action_v4_id === id,
          ),
        );
      });

    return NextResponse.json({
      period,
      app: series(appResult.world_id_app_stats_daily, appFrom, today),
      legacy_actions: legacyActions,
      actions,
    });
  } catch (error) {
    logger.error("Failed to read World ID analytics", { error, appId });
    return NextResponse.json(
      { error: "Analytics unavailable" },
      { status: 500 },
    );
  }
}
