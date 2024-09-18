import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { NativeAppToAppIdMapping, NativeApps } from "@/lib/constants";
import { parseLocale } from "@/lib/languages";
import { AppStatsReturnType } from "@/lib/types";
import { formatAppMetadata, isValidHostName } from "@/lib/utils";
import { NextResponse } from "next/server";
import { getSdk as getAppMetadataSdk } from "./graphql/get-app-metadata.generated";

/**
 * Fetches the list of apps to be shown in the app store
 * @param req
 * Accepts: platform, country, page
 * @param res
 */

export async function GET(
  request: Request,
  { params }: { params: { app_id: string } },
) {
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

  // We only accept requests through the distribution origin
  if (!isValidHostName(request)) {
    return NextResponse.json(
      {
        error: `Invalid Request Origin, please use ${process.env.NEXT_PUBLIC_VERIFIED_IMAGES_CDN_URL}`,
      },
      { status: 400 },
    );
  }

  let app_id = params.app_id;

  // Native Apps have substituted app_ids so we pull their constant ID to get the metadata
  if (app_id in NativeAppToAppIdMapping[process.env.NEXT_PUBLIC_APP_ENV]) {
    app_id = NativeAppToAppIdMapping[process.env.NEXT_PUBLIC_APP_ENV][app_id];
  }

  const headers = request.headers;
  const locale = parseLocale(headers.get("x-accept-language") ?? "");

  const client = await getAPIServiceGraphqlClient();
  // Return the metadata
  const { app_metadata } = await getAppMetadataSdk(client).GetAppMetadata({
    app_id,
    locale,
  });

  if (!app_metadata || app_metadata.length === 0) {
    return NextResponse.json({ error: "App not found" }, { status: 404 });
  }
  // ANCHOR: Fetch app stats from metrics service
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_METRICS_SERVICE_ENDPOINT}/apps/${app_id}.json`,
    { cache: "no-store" },
  );

  let metricsData: AppStatsReturnType = [];

  if (response.status == 200) {
    metricsData = [await response.json()];
  }

  let parsedAppMetadata = app_metadata[0];
  const nativeAppMetadata = NativeApps[process.env.NEXT_PUBLIC_APP_ENV];
  if (app_metadata.length > 1) {
    app_metadata.reduce((acc, current) => {
      if (current.is_reviewer_app_store_approved) {
        parsedAppMetadata = current;
      }
      return acc;
    }, null);
  }

  let dataToReturn = formatAppMetadata(parsedAppMetadata, metricsData, locale);

  if (dataToReturn.app_id in nativeAppMetadata) {
    const nativeAppItem = nativeAppMetadata[dataToReturn.app_id];

    dataToReturn = {
      ...dataToReturn,
      app_mode: "native",
      integration_url: nativeAppItem.integration_url,
      app_id: nativeAppItem.app_id,
    };
  }

  return NextResponse.json(
    { app_data: dataToReturn },
    {
      status: 200,
    },
  );
}
