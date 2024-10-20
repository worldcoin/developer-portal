import { errorResponse } from "@/api/helpers/errors";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { validateRequestSchema } from "@/api/helpers/validate-request-schema";
import { getAllLocalisedCategories } from "@/lib/categories";
import { NativeApps } from "@/lib/constants";
import { parseLocale } from "@/lib/languages";
import { AppStatsReturnType } from "@/lib/types";
import { formatAppMetadata, isValidHostName, rankApps } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";
import {
  GetAppsQuery,
  getSdk as getAppsSdk,
} from "./graphql/get-app-rankings.generated";
import { getSdk as getHighlightsSdk } from "./graphql/get-app-web-highlights.generated";

const queryParamsSchema = yup.object({
  page: yup.number().integer().min(1).default(1).notRequired(),
  limit: yup.number().integer().min(1).max(500).notRequired().default(250),
  app_mode: yup
    .string()
    .oneOf(["mini-app", "external", "native"])
    .notRequired(),
});

export const GET = async (request: NextRequest) => {
  // NOTE: We only accept requests through the distribution origin
  if (!isValidHostName(request)) {
    return NextResponse.json(
      {
        error: `Invalid Request Origin, please use ${process.env.NEXT_PUBLIC_VERIFIED_IMAGES_CDN_URL}`,
      },
      { status: 400 },
    );
  }

  if (
    !process.env.NEXT_PUBLIC_APP_ENV ||
    !process.env.NEXT_PUBLIC_METRICS_SERVICE_ENDPOINT
  ) {
    return NextResponse.json(
      {
        error: `Invalid Environment Configuration`,
      },
      { status: 400 },
    );
  }

  const { searchParams } = new URL(request.url);
  const queryParamsObject = Object.fromEntries(searchParams.entries());

  const { parsedParams, isValid, handleError } = await validateRequestSchema({
    schema: queryParamsSchema,
    value: queryParamsObject,
  });

  if (!isValid) {
    return handleError(request);
  }
  const headers = request.headers;
  const country = headers.get("CloudFront-Viewer-Country");
  const locale = parseLocale(headers.get("x-accept-language") ?? "");

  const { page, limit, app_mode } = parsedParams;
  const client = await getAPIServiceGraphqlClient();

  let highlightsIds: string[] = [];

  try {
    const { app_rankings } = await getHighlightsSdk(client).GetHighlights();
    highlightsIds = app_rankings[0]?.rankings ?? [];
  } catch (error) {
    console.log(error);
    return errorResponse({
      statusCode: 500,
      code: "server_error",
      detail: "Something went wrong. Please try again.",
      attribute: null,
      req: request,
    });
  }

  let topApps: GetAppsQuery["top_apps"] = [];
  let highlightsApps: GetAppsQuery["highlights"] = [];

  const limitValue = limit ?? 500;
  const offset = page ? (page - 1) * limitValue : 0;

  // ANCHOR: Fetch app rankings
  try {
    const { top_apps, highlights } = await getAppsSdk(client).GetApps({
      topAppsConditions: {
        app: { is_banned: { _eq: false } },
        verification_status: { _eq: "verified" },
        is_reviewer_world_app_approved: { _eq: true },
      },
      highlightsIds,
      limit: limitValue,
      offset,
      locale,
    });
    topApps = top_apps;
    highlightsApps = highlights;
  } catch (error) {
    console.log(error);
    return errorResponse({
      statusCode: 500,
      code: "server_error",
      detail: "Something went wrong. Please try again.",
      attribute: null,
      req: request,
    });
  }

  // ANCHOR: Filter top apps by country
  if (country && topApps.length > 0) {
    topApps = topApps.filter((app) =>
      app.supported_countries?.some((c: string) => c === country),
    );
  }

  // ANCHOR: Filter highlights apps by country
  if (country && highlightsApps.length > 0) {
    highlightsApps = highlightsApps.filter((app) =>
      app.supported_countries?.some((c: string) => c === country),
    );
  }

  // ANCHOR: Fetch app stats from metrics service
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_METRICS_SERVICE_ENDPOINT}/stats/data.json`,
    {
      cache: "no-store",
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    },
  );

  const metricsData: AppStatsReturnType = await response.json();
  const nativeAppMetadata = NativeApps[process.env.NEXT_PUBLIC_APP_ENV];

  // Anchor: Format Apps
  let formattedTopApps = topApps.map((app) =>
    formatAppMetadata(app, metricsData, locale),
  );
  let highlightedApps = highlightsApps.map((app) =>
    formatAppMetadata(app, metricsData, locale),
  );

  formattedTopApps = formattedTopApps.map((app) => {
    if (app.app_id in nativeAppMetadata) {
      const nativeAppItem = nativeAppMetadata[app.app_id];
      return {
        ...app,
        app_mode: "native",
        integration_url: nativeAppItem.integration_url,
        app_id: nativeAppItem.app_id,
        unique_users:
          metricsData.find((stat) => stat.app_id === nativeAppItem.app_id)
            ?.unique_users ?? 0,
      };
    }
    return app;
  });

  highlightedApps = highlightedApps.map((app) => {
    if (app.app_id in nativeAppMetadata) {
      const nativeAppItem = nativeAppMetadata[app.app_id];
      return {
        ...app,
        app_mode: "native",
        integration_url: nativeAppItem.integration_url,
        app_id: nativeAppItem.app_id,
        unique_users:
          metricsData.find((stat) => stat.app_id === nativeAppItem.app_id)
            ?.unique_users ?? 0,
      };
    }
    return app;
  });

  return NextResponse.json({
    app_rankings: {
      top_apps: rankApps(formattedTopApps, metricsData),
      highlights: rankApps(highlightedApps, metricsData),
    },
    categories: getAllLocalisedCategories(locale), // TODO: Localise
  });
};
