import {
  getDailyAppSnapshot,
  getTotalsAppSnapshot,
  type AnalyticsAppSnapshot,
} from "@/api/helpers/selfie-check-analytics/redis-store";
import { auth0 } from "@/lib/auth0";
import { logger } from "@/lib/logger";
import type { DailyRow, TotalsRow } from "@/lib/selfie-check-analytics";
import { getIsUserAllowedToReadApp } from "@/lib/permissions";
import { appIdRegex } from "@/lib/schema";
import { Auth0SessionUser } from "@/lib/types";
import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

const PRIVATE_CACHE_CONTROL = "private, max-age=60";
const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

type AnalyticsMeta = {
  dataAsOf: string;
  isFallback: boolean;
};

type AnalyticsResponse =
  | {
      appId: string;
      tablePrefix: "total/";
      row: TotalsRow;
      meta: AnalyticsMeta;
    }
  | {
      appId: string;
      tablePrefix: "daily/";
      rows: readonly DailyRow[];
      meta: AnalyticsMeta;
    };

const errorResponse = ({
  attribute = null,
  code,
  detail,
  status,
}: {
  attribute?: string | null;
  code: string;
  detail: string;
  status: number;
}) =>
  NextResponse.json(
    { code, detail, attribute },
    { status, headers: NO_STORE_HEADERS },
  );

const buildResponseEtag = ({
  appId,
  identity,
  tablePrefix,
}: {
  appId: string;
  identity: string;
  tablePrefix: string;
}) =>
  `"${createHash("sha256")
    .update(`${tablePrefix}:${appId}:${identity}`)
    .digest("base64url")}"`;

const responseHeaders = (etag: string) => ({
  "Cache-Control": PRIVATE_CACHE_CONTROL,
  ETag: etag,
  Vary: "Cookie",
});

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ app_id: string }> },
) {
  const { app_id: appId } = await props.params;

  if (!appIdRegex.test(appId)) {
    return errorResponse({
      status: 400,
      code: "invalid_app_id",
      detail: "Invalid app ID.",
      attribute: "app_id",
    });
  }

  const tableParam = req.nextUrl.searchParams.get("table") ?? "total";
  if (tableParam !== "total" && tableParam !== "daily") {
    return errorResponse({
      status: 400,
      code: "invalid_table",
      detail: "Invalid table.",
      attribute: "table",
    });
  }

  let session;
  try {
    session = await auth0.getSession();
  } catch (error) {
    logger.error("Failed to authenticate selfie-check analytics request", {
      dependency: "auth0",
      appId,
      failureClass:
        error instanceof Error ? error.name : "UnknownAuthenticationError",
      error,
    });
    return errorResponse({
      status: 503,
      code: "temporarily_unavailable",
      detail: "Analytics are temporarily unavailable.",
    });
  }

  const user = session?.user as Auth0SessionUser["user"] | undefined;
  const userId = user?.hasura?.id;
  if (!userId) {
    return errorResponse({
      status: 401,
      code: "unauthenticated",
      detail: "You must be logged in.",
    });
  }

  let hasAppAccess: boolean;
  try {
    hasAppAccess = await getIsUserAllowedToReadApp(appId);
  } catch (error) {
    logger.error("Failed to authorize selfie-check analytics request", {
      dependency: "hasura",
      appId,
      failureClass:
        error instanceof Error ? error.name : "UnknownAuthorizationError",
      error,
    });
    return errorResponse({
      status: 503,
      code: "temporarily_unavailable",
      detail: "Analytics are temporarily unavailable.",
    });
  }

  if (!hasAppAccess) {
    return errorResponse({
      status: 404,
      code: "not_found",
      detail: "Analytics not found.",
    });
  }

  const dataset =
    tableParam === "daily" ? "selfie_check_daily" : "selfie_check_totals";

  let loaded:
    | { table: "total"; snapshot: AnalyticsAppSnapshot<TotalsRow> }
    | {
        table: "daily";
        snapshot: AnalyticsAppSnapshot<readonly DailyRow[]>;
      };
  try {
    // Totals-row presence is the runtime allowlist. Read it before daily so an
    // app cannot obtain analytics solely because stale daily data still exists.
    const totalsSnapshot = await getTotalsAppSnapshot(appId);
    if (!totalsSnapshot) {
      return errorResponse({
        status: 404,
        code: "not_found",
        detail: "Analytics not found.",
      });
    }

    if (tableParam === "daily") {
      const dailySnapshot = await getDailyAppSnapshot(appId);
      if (!dailySnapshot) {
        logger.warn(
          "Eligible analytics app is absent from the Redis snapshot",
          {
            dependency: "redis",
            appId,
            dataset,
          },
        );
        return errorResponse({
          status: 404,
          code: "not_found",
          detail: "Analytics not found.",
        });
      }
      loaded = { table: "daily", snapshot: dailySnapshot };
    } else {
      loaded = { table: "total", snapshot: totalsSnapshot };
    }
  } catch (error) {
    logger.error("Failed to read selfie-check analytics from Redis", {
      dependency: "redis",
      dataset,
      appId,
      failureClass: error instanceof Error ? error.name : "UnknownRedisError",
      error,
    });
    return NextResponse.json(
      {
        code: "temporarily_unavailable",
        detail: "Analytics are temporarily unavailable.",
        attribute: null,
      },
      {
        status: 503,
        headers: {
          ...NO_STORE_HEADERS,
          "Retry-After": "60",
        },
      },
    );
  }

  const meta: AnalyticsMeta = {
    dataAsOf: loaded.snapshot.metadata.source.dataAsOf,
    isFallback: false,
  };

  const response: AnalyticsResponse =
    loaded.table === "daily"
      ? {
          appId,
          tablePrefix: "daily/",
          rows: loaded.snapshot.data,
          meta,
        }
      : {
          appId,
          tablePrefix: "total/",
          row: loaded.snapshot.data,
          meta,
        };

  const etag = buildResponseEtag({
    appId,
    identity: loaded.snapshot.metadata.source.identity,
    tablePrefix: response.tablePrefix,
  });
  const headers = responseHeaders(etag);

  if (req.headers.get("if-none-match") === etag) {
    return new NextResponse(null, { status: 304, headers });
  }

  return NextResponse.json(response, { status: 200, headers });
}
