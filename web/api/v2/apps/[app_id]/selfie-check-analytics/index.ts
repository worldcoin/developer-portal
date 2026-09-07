import { isSelfieCheckAnalyticsEnabledForApp } from "@/api/helpers/selfie-check-analytics/eligibility";
import {
  loadLatestDailyTableSnapshot,
  loadLatestTotalsTableSnapshot,
} from "@/api/helpers/selfie-check-analytics/snapshots";
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
  isFallback,
  tablePrefix,
}: {
  appId: string;
  identity: string;
  isFallback: boolean;
  tablePrefix: string;
}) =>
  `"${createHash("sha256")
    .update(
      `${tablePrefix}:${appId}:${identity}:${isFallback ? "fallback" : "fresh"}`,
    )
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

  if (!(await isSelfieCheckAnalyticsEnabledForApp(appId))) {
    return errorResponse({
      status: 404,
      code: "not_found",
      detail: "Analytics not found.",
    });
  }

  const dataset =
    tableParam === "daily" ? "selfie_check_daily" : "selfie_check_totals";

  let loaded;
  try {
    loaded =
      tableParam === "daily"
        ? {
            table: "daily" as const,
            snapshot: await loadLatestDailyTableSnapshot(),
          }
        : {
            table: "total" as const,
            snapshot: await loadLatestTotalsTableSnapshot(),
          };
  } catch (error) {
    logger.error("Failed to load selfie-check analytics table", {
      dependency: "s3",
      dataset,
      appId,
      failureClass:
        error instanceof Error ? error.name : "UnknownSnapshotError",
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
    dataAsOf: loaded.snapshot.source.dataAsOf,
    isFallback: loaded.snapshot.isFallback,
  };

  let response: AnalyticsResponse | null = null;
  if (loaded.table === "daily") {
    const rows = loaded.snapshot.records.get(appId);
    if (rows) response = { appId, tablePrefix: "daily/", rows, meta };
  } else {
    const row = loaded.snapshot.records.get(appId);
    if (row) response = { appId, tablePrefix: "total/", row, meta };
  }

  if (!response) {
    logger.warn(
      "Whitelisted selfie-check analytics app is absent from the snapshot",
      {
        appId,
        dataset,
        snapshotIdentity: loaded.snapshot.source.identity,
      },
    );
    return errorResponse({
      status: 404,
      code: "not_found",
      detail: "Analytics not found.",
    });
  }

  const etag = buildResponseEtag({
    appId,
    identity: loaded.snapshot.source.identity,
    isFallback: loaded.snapshot.isFallback,
    tablePrefix: response.tablePrefix,
  });
  const headers = responseHeaders(etag);

  if (req.headers.get("if-none-match") === etag) {
    return new NextResponse(null, { status: 304, headers });
  }

  return NextResponse.json(response, { status: 200, headers });
}
