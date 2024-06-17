import { errorResponse } from "@/api/helpers/errors";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { validateRequestSchema } from "@/api/helpers/validate-request-schema";
import { Categories } from "@/lib/constants";
import { NativeAppsMap } from "@/lib/types";
import { formatAppMetadata, isValidHostName } from "@/lib/utils";
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
  country: yup.string().notRequired(),
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

  const { searchParams } = new URL(request.url);
  const queryParamsObject = Object.fromEntries(searchParams.entries());

  const { parsedParams, isValid, handleError } = await validateRequestSchema({
    schema: queryParamsSchema,
    value: queryParamsObject,
  });

  if (!isValid) {
    return handleError(request);
  }

  const { page, limit, country, app_mode } = parsedParams;
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

  const limitValue = limit ?? 250;
  const offset = page ? (page - 1) * limitValue : 0;

  // ANCHOR: Fetch app rankings
  try {
    const { top_apps, highlights } = await getAppsSdk(client).GetApps({
      topAppsConditions: {
        verification_status: { _eq: "verified" },
        ...(app_mode ? { app_mode: { _eq: app_mode } } : {}),
      },

      highlightsIds,
      limit: limit ?? 250,
      offset,
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
      app.supported_countries?.some(
        (c: string) => c.toLowerCase() === country.toLowerCase(),
      ),
    );
  }

  // ANCHOR: Filter highlights apps by country
  if (country && highlightsApps.length > 0) {
    highlightsApps = highlightsApps.filter((app) =>
      app.supported_countries?.some(
        (c: string) => c.toLowerCase() === country.toLowerCase(),
      ),
    );
  }
  let nativeAppsMap: NativeAppsMap = {};

  // FIXME: Temporary fix for native apps
  if (process.env.APP_ENV === "staging") {
    nativeAppsMap = {
      app_staging_44e711bce52215150d0a7f31af4f4f33: {
        app_id: "grants",
        integration_url: "worldapp://grants",
      },
      app_staging_fb0465348ceb59cba6202685cbdc4120: {
        app_id: "invites",
        integration_url: "worldapp://invites",
      },
      app_staging_44210a8be72aa299410be44232b1ea57: {
        app_id: "network",
        integration_url: "worldapp://network",
      },
    };
  } else if (process.env.APP_ENV === "production") {
    // TODO: Add Production Apps
  }

  topApps = topApps.map((app) => {
    if (app.app_id in nativeAppsMap) {
      const nativeAppItem = nativeAppsMap[app.app_id];
      return {
        ...app,
        app_mode: "native",
        integration_url: nativeAppItem.integration_url,
        app_id: nativeAppItem.app_id,
      };
    }

    return app;
  });

  highlightsApps = highlightsApps.map((app) => {
    if (app.app_id in nativeAppsMap) {
      const nativeAppItem = nativeAppsMap[app.app_id];
      return {
        ...app,
        app_mode: "native",
        integration_url: nativeAppItem.integration_url,
        app_id: nativeAppItem.app_id,
      };
    }

    return app;
  });

  // Format Data

  return NextResponse.json({
    app_rankings: {
      top_apps: topApps.map((app) => formatAppMetadata(app)),
      highlights: highlightsApps.map((app) => formatAppMetadata(app)),
    },
    categories: Categories,
  });
};
