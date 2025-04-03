import { errorResponse } from "@/api/helpers/errors";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { validateRequestSchema } from "@/api/helpers/validate-request-schema";
import {
  AllCategory,
  getAppStoreLocalisedCategoriesWithUrls,
  getLocalisedCategory,
} from "@/lib/categories";
import { NativeApps } from "@/lib/constants";
import { parseLocale } from "@/lib/languages";
import { AppStatsReturnType } from "@/lib/types";
import { isValidHostName } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";
import {
  GetAppsQuery,
  getSdk as getAppsSdk,
} from "./graphql/get-app-rankings.generated";
import { getSdk as getWebHighlightsSdk } from "./graphql/get-app-web-highlights.generated";

import { formatAppMetadata, rankApps } from "@/api/helpers/app-store";
import {
  GetHighlightsQuery,
  getSdk as getHighlightsSdk,
} from "./graphql/get-highlighted-apps.generated";

const queryParamsSchema = yup.object({
  page: yup.number().integer().min(1).default(1).notRequired(),
  limit: yup.number().integer().min(1).max(500).notRequired().default(250),
  app_mode: yup
    .string()
    .oneOf(["mini-app", "external", "native"])
    .notRequired(),
  override_country: yup.string().notRequired(),
  show_external: yup.boolean().notRequired().default(false),
});

export const GET = async (request: NextRequest) => {
  // NOTE: We only accept requests through the distribution origin
  if (!isValidHostName(request)) {
    return NextResponse.json(
      {
        error: `Invalid Request Origin, please use ${process.env.NEXT_PUBLIC_IMAGES_CDN_URL}`,
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
  const locale = parseLocale(headers.get("x-accept-language") ?? "");
  let country: string | null = headers.get("CloudFront-Viewer-Country");

  console.log({
    cloudfrontCountry: country,
    parsedCountry: parsedParams.override_country,
  });

  if (parsedParams.override_country) {
    country = parsedParams.override_country;
  }

  const { page, limit } = parsedParams;
  const client = await getAPIServiceGraphqlClient();

  let highlightsIds: string[] = [];

  try {
    const { app_rankings } = await getWebHighlightsSdk(client).GetHighlights();
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
  let highlightsApps: GetHighlightsQuery["highlights"] = [];

  const limitValue = limit ?? 500;
  const offset = page ? (page - 1) * limitValue : 0;

  // ANCHOR: Fetch app rankings
  try {
    const { top_apps } = await getAppsSdk(client).GetApps({
      limit: limitValue,
      offset,
      locale,
    });
    topApps = top_apps;
    const { highlights } = await getHighlightsSdk(client).GetHighlights({
      limit: limitValue,
      offset,
      highlightsIds,
      locale,
    });
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
  const apps = [
    {
      app_id: "1",
      category: "Social",
      app_mode: "mini-app",
    },
    {
      app_id: "2",
      category: "Social",
      app_mode: "external",
    },
    {
      app_id: "3",
      category: "External",
      app_mode: "external",
    },
  ];
  if (!parsedParams.show_external) {
    topApps = topApps.filter(
      (app) =>
        app.category.toLowerCase() !== "external" &&
        app.app_mode !== "external",
    );
    highlightsApps = highlightsApps.filter(
      (app) =>
        app.category.toLowerCase() !== "external" ||
        app.app_mode !== "external",
    );
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

  // Format all apps concurrently using Promise.all
  let formattedTopApps = await Promise.all(
    topApps.map((app) => formatAppMetadata(app, metricsData, locale)),
  );

  let highlightedApps = await Promise.all(
    highlightsApps.map((app) => formatAppMetadata(app, metricsData, locale)),
  );

  formattedTopApps = formattedTopApps.map((app) => {
    if (app.app_id in nativeAppMetadata) {
      const nativeAppItem = nativeAppMetadata[app.app_id];
      return {
        ...app,
        integration_url:
          nativeAppItem.integration_url !== ""
            ? nativeAppItem.integration_url
            : app.integration_url,
        app_id: nativeAppItem.app_id,
        app_mode: nativeAppItem.app_mode,
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
        integration_url: nativeAppItem.integration_url,
        app_id: nativeAppItem.app_id,
        app_mode: nativeAppItem.app_mode,
        unique_users:
          metricsData.find((stat) => stat.app_id === nativeAppItem.app_id)
            ?.unique_users ?? 0,
      };
    }
    return app;
  });

  highlightedApps = highlightedApps.sort((a, b) => {
    const aIndex = highlightsIds.indexOf(a.app_id);
    const bIndex = highlightsIds.indexOf(b.app_id);
    return aIndex - bIndex;
  });

  // validate all apps have valid categories
  const categories = getAppStoreLocalisedCategoriesWithUrls(
    locale,
    parsedParams.show_external ?? false,
  );
  const areAppCategoriesValid =
    formattedTopApps.every((app) =>
      categories.some((category) => category?.id === app.category.id),
    ) &&
    highlightedApps.every((app) =>
      categories.some((category) => category?.id === app.category.id),
    );

  if (!areAppCategoriesValid) {
    return errorResponse({
      statusCode: 500,
      code: "invalid_categories",
      detail: "Some apps have invalid categories",
      attribute: null,
      req: request,
    });
  }

  return NextResponse.json(
    {
      app_rankings: {
        top_apps: rankApps(formattedTopApps, metricsData),
        highlights: highlightedApps,
      },
      all_category: {
        ...AllCategory,
        name: getLocalisedCategory(AllCategory.name, locale).name,
      },
      categories,
    },
    {
      headers: {
        // https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/Expiration.html#ExpirationDownloadDist
        // https://aws.amazon.com/about-aws/whats-new/2023/05/amazon-cloudfront-stale-while-revalidate-stale-if-error-cache-control-directives/
        "Cache-Control": "public, max-age=5, stale-if-error=86400",
      },
    },
  );
};
