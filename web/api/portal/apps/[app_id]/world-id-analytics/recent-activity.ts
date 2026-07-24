import { errorResponse } from "@/api/helpers/errors";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { getIsUserAllowedToReadApp } from "@/lib/permissions";
import { NextRequest, NextResponse } from "next/server";
import { getSdk as getMetaSdk } from "./graphql/get-meta.generated";
import { getSdk as getRecentActivitySdk } from "./graphql/get-recent-activity.generated";
import { getSdk as getV4ActionSdk } from "./graphql/get-v4-action.generated";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;
const STALE_AFTER_MS = 15 * 60 * 1000;

function parseLimit(value: string | null) {
  if (value === null) {
    return DEFAULT_LIMIT;
  }

  if (!/^[1-9]\d*$/.test(value)) {
    return null;
  }

  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
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
    asOf: metadata.get("watermark_last_until") ?? null,
    stale:
      !watermarkLastSuccessAt ||
      !Number.isFinite(watermarkTime) ||
      Date.now() - watermarkTime > STALE_AFTER_MS,
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

    const source = req.nextUrl.searchParams.get("source");
    if (source !== null && source !== "v4") {
      return errorResponse({
        statusCode: 400,
        code: "invalid_source",
        detail: "Source must be 'v4'.",
        attribute: "source",
        app_id: appId,
        req,
      });
    }

    const actionId = req.nextUrl.searchParams.get("action_id");
    if (actionId === null || actionId === "") {
      return errorResponse({
        statusCode: 400,
        code: "required",
        detail: "Action ID is required.",
        attribute: "action_id",
        app_id: appId,
        req,
      });
    }

    const limit = parseLimit(req.nextUrl.searchParams.get("limit"));
    if (limit === null || limit > MAX_LIMIT) {
      return errorResponse({
        statusCode: 400,
        code: "invalid_limit",
        detail: "Limit must be an integer from 1 to 50.",
        attribute: "limit",
        app_id: appId,
        req,
      });
    }

    const client = await getAPIServiceGraphqlClient();
    const { action_v4_by_pk: action } = await getV4ActionSdk(
      client,
    ).GetWorldIdAnalyticsV4Action({
      action_id: actionId,
    });
    if (
      action?.environment !== "production" ||
      action.rp_registration.app_id !== appId
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

    const [activityResult, metaResult] = await Promise.all([
      getRecentActivitySdk(client).GetWorldIdAnalyticsRecentActivity({
        action_id: actionId,
        limit,
      }),
      getMetaSdk(client).GetWorldIdAnalyticsMeta(),
    ]);
    const meta = getMetaState(metaResult.verification_analytics_meta);

    return NextResponse.json(
      {
        action_id: actionId,
        source: "v4",
        items: activityResult.nullifier_v4.map((item) => ({
          nullifier: item.nullifier,
          created_at: item.created_at,
          updated_at: item.updated_at,
          uses: item.uses,
        })),
        as_of: meta.asOf,
        stale: meta.stale,
      },
      { status: 200 },
    );
  } catch {
    return errorResponse({
      statusCode: 500,
      code: "server_error",
      detail: "Failed to load recent World ID activity.",
      attribute: null,
      app_id: appId,
      req,
    });
  }
}
