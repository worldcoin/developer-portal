import { errorResponse } from "@/api/helpers/errors";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { validateRequestSchema } from "@/api/helpers/validate-request-schema";
import { Categories } from "@/lib/constants";
import { isValidHostName } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";
import {
  GetAppRankingsQuery,
  getSdk as getAppRankingsSdk,
} from "./graphql/get-app-rankings.generated";
import { getSdk as getAppHighlightsSdk } from "./graphql/get-app-web-highlights.generated";

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
    const { app_rankings } =
      await getAppHighlightsSdk(client).GetAppWebHighLights();

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

  let topApps: GetAppRankingsQuery["top_apps"] = [];
  let highlightsApps: GetAppRankingsQuery["highlights"] = [];

  const limitValue = limit ?? 250;
  const offset = page ? (page - 1) * limitValue : 0;

  // ANCHOR: Fetch app rankings
  try {
    const { top_apps, highlights } = await getAppRankingsSdk(
      client,
    ).GetAppRankings({
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
      app.supported_countries.some(
        (c: string) => c.toLowerCase() === country.toLowerCase(),
      ),
    );
  }

  // ANCHOR: Filter highlights apps by country
  if (country && highlightsApps.length > 0) {
    highlightsApps = highlightsApps.filter((app) =>
      app.supported_countries.some(
        (c: string) => c.toLowerCase() === country.toLowerCase(),
      ),
    );
  }

  return NextResponse.json({
    app_rankings: {
      top_apps: topApps,
      highlights: highlightsApps,
    },
    categories: Categories,
  });
};
