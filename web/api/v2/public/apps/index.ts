import { errorResponse } from "@/api/helpers/errors";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { validateRequestSchema } from "@/api/helpers/validate-request-schema";
import {
  AllCategory,
  getAppStoreLocalisedCategoriesWithUrls,
  getLocalisedCategory,
} from "@/lib/categories";
import { NativeApps, NativeAppToAppIdMapping } from "@/lib/constants";
import { parseLocale } from "@/lib/languages";
import { AppStatsReturnType } from "@/lib/types";
import { fetchWithRetry, isValidHostName } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";
import {
  GetAppsQuery,
  getSdk as getAppsSdk,
} from "./graphql/get-app-rankings.generated";
import { getSdk as getWebHighlightsSdk } from "./graphql/get-app-web-highlights.generated";

import { formatAppMetadata, rankApps } from "@/api/helpers/app-store";
import { compareVersions } from "@/lib/compare-versions";
import { CONTACTS_APP_AVAILABLE_FROM } from "../constants";
import {
  GetHighlightsQuery,
  getSdk as getHighlightsSdk,
} from "./graphql/get-highlighted-apps.generated";

const queryParamsSchema = yup.object({
  page: yup.number().integer().min(1).default(1).notRequired(),
  limit: yup.number().integer().min(1).max(1000).notRequired().default(500),
  app_mode: yup
    .string()
    .oneOf(["mini-app", "external", "native"])
    .notRequired(),
  override_country: yup.string().notRequired(),
  show_external: yup.boolean().notRequired().default(false),
  skip_country_check: yup.boolean().notRequired().default(false),
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

  // ANCHOR: Get request headers
  const headers = request.headers;
  const locale = parseLocale(headers.get("x-accept-language") ?? "");
  const clientVersion: string | null = headers.get("client-version");
  let country: string | null = headers.get("CloudFront-Viewer-Country");
  const platform = headers.get("client-name");

  const client = await getAPIServiceGraphqlClient();

  // ANCHOR: Get highlights
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

  country = parsedParams.override_country ?? country;
  const { page, limit } = parsedParams;
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

  if (platform === "ios") {
    topApps = topApps.filter((app) => app.is_android_only !== true);
    highlightsApps = highlightsApps.filter(
      (app) => app.is_android_only !== true,
    );
  }

  const nativeIdToActualId =
    NativeAppToAppIdMapping[process.env.NEXT_PUBLIC_APP_ENV];

  /**
   * ANCHOR: Filter out contacts on versions that do not have the native code for it
   */
  if (
    !clientVersion ||
    compareVersions(clientVersion, CONTACTS_APP_AVAILABLE_FROM) < 0
  ) {
    topApps = topApps.filter(
      (app) => app.app_id !== nativeIdToActualId.contacts,
    );
    highlightsApps = highlightsApps.filter(
      (app) => app.app_id !== nativeIdToActualId.contacts,
    );
  }

  /**
   * ANCHOR: Filter out apps by country
   */
  // NOTE: If skip_country_check is true, we will not filter by country
  country = parsedParams.skip_country_check ? null : country;
  if (country && topApps.length > 0) {
    topApps = topApps.filter((app) => {
      const isCountrySupported = app.supported_countries?.some(
        (c: string) => c === country,
      );

      return isCountrySupported;
    });
  }

  /**
   * ANCHOR: Filter out highlighted apps by country
   */
  if (country && highlightsApps.length > 0) {
    highlightsApps = highlightsApps.filter((app) => {
      const isCountrySupported = app.supported_countries?.some(
        (c: string) => c === country,
      );

      return isCountrySupported;
    });
  }

  /**
   * ANCHOR: Fetch app stats from metrics service
   */
  const response = await fetchWithRetry(
    `${process.env.NEXT_PUBLIC_METRICS_SERVICE_ENDPOINT}/stats/data.json`,
    {
      cache: "no-store",
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    },
    3,
    400,
    false,
  );

  let metricsData: AppStatsReturnType = [];

  if (response.status == 200) {
    metricsData = await response.json();
  }

  const nativeAppMetadata = NativeApps[process.env.NEXT_PUBLIC_APP_ENV];

  /**
   * ANCHOR: Format all app metadata
   */
  let formattedTopApps = await Promise.all(
    topApps.map((app) =>
      formatAppMetadata(app, metricsData, locale, platform, country),
    ),
  );

  let highlightedApps = await Promise.all(
    highlightsApps.map((app) =>
      formatAppMetadata(app, metricsData, locale, platform, country),
    ),
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

  /**
   * ANCHOR: Validate all apps have valid categories
   */
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

  const rankedApps = rankApps(formattedTopApps, metricsData);

  /**
   * ANCHOR: Add category_ranking field to each app
   * This is to sort apps inside category,
   * based on the overall ranking in app store
   */
  const categoryAppsMap = new Map();
  rankedApps.forEach((app) => {
    const categoryId = app.category.id;
    if (!categoryAppsMap.has(categoryId)) {
      categoryAppsMap.set(
        categoryId,
        rankedApps.filter((a) => a.category.id === categoryId),
      );
    }
  });

  const rankedAppsWithCategoryRanking = rankedApps.map((app) => {
    const categoryApps = categoryAppsMap.get(app.category.id);
    return { ...app, category_ranking: categoryApps.indexOf(app) + 1 };
  });

  const responseBody = {
    app_rankings: {
      top_apps: rankedAppsWithCategoryRanking,
      highlights: highlightedApps,
    },
    all_category: {
      ...AllCategory,
      name: getLocalisedCategory(AllCategory.name, locale).name,
    },
    categories,
  };

  const contentLength = Buffer.byteLength(
    JSON.stringify(responseBody),
    "utf-8",
  ).toString();

  return NextResponse.json(responseBody, {
    headers: {
      "Content-Length": contentLength,
      // https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/Expiration.html#ExpirationDownloadDist
      // https://aws.amazon.com/about-aws/whats-new/2023/05/amazon-cloudfront-stale-while-revalidate-stale-if-error-cache-control-directives/
      "Cache-Control": "public, max-age=5, stale-if-error=86400",
    },
  });
};
