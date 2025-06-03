import { formatAppMetadata } from "@/api/helpers/app-store";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { getAppStoreLocalisedCategoriesWithUrls } from "@/lib/categories";
import { NativeAppToAppIdMapping, NativeApps } from "@/lib/constants";
import { parseLocale } from "@/lib/languages";
import { AppStatsReturnType } from "@/lib/types";
import { fetchWithRetry, isValidHostName } from "@/lib/utils";
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
        error: `Invalid Request Origin, please use ${process.env.NEXT_PUBLIC_IMAGES_CDN_URL}`,
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
  const response = await fetchWithRetry(
    `${process.env.NEXT_PUBLIC_METRICS_SERVICE_ENDPOINT}/${app_id}.json`,
    { cache: "no-store" },
    3,
    400,
    false,
  );

  let metricsData: AppStatsReturnType = [];

  if (response.status == 200) {
    metricsData = [await response.json()];
  }

  let parsedAppMetadata = app_metadata[0];

  // Get query param for specific metadata if provided
  const { searchParams } = new URL(request.url);
  const draft_id = searchParams.get("draft_id");

  if (draft_id) {
    const draft_metadata = app_metadata.find((meta) => meta.id === draft_id);

    if (
      draft_metadata?.is_reviewer_world_app_approved &&
      draft_metadata?.verification_status === "verified"
    ) {
      return NextResponse.json(
        { error: "Draft already verified" },
        { status: 400 },
      );
    }

    if (!draft_metadata) {
      return NextResponse.json({ error: "Draft not found" }, { status: 404 });
    }

    parsedAppMetadata = draft_metadata;
  } else if (app_metadata.length > 1) {
    // If no specific metadata found by id, check for reviewer approved version
    const approvedMetadata = app_metadata.find(
      (meta) =>
        meta.is_reviewer_world_app_approved &&
        meta.verification_status === "verified",
    );
    if (approvedMetadata) {
      parsedAppMetadata = approvedMetadata;
    }
  }

  const isMetadataVerified =
    parsedAppMetadata.verification_status === "verified";

  // skip checking cf country, when coming from app-backend
  const skipCloudfrontCheck = Boolean(
    searchParams.get("skip_cloudfront_check"),
  );
  const country = skipCloudfrontCheck
    ? null
    : headers.get("CloudFront-Viewer-Country");
  const override_country = searchParams.get("override_country") || country;
  const shouldUninstallOnDelist = parsedAppMetadata.should_uninstall_on_delist;
  const isDelisted = !parsedAppMetadata.is_reviewer_app_store_approved;

  // only restrict based on country if app is delisted and should be uninstalled on delist
  // this means that the only two cases where an app is not deeplinkable are:
  // - if it's banned
  // - if the uninstall flag is set and app is delisted
  if (
    isDelisted &&
    shouldUninstallOnDelist &&
    isMetadataVerified &&
    override_country &&
    !parsedAppMetadata.supported_countries?.includes(override_country)
  ) {
    return NextResponse.json(
      {
        error: "App not available in country",
      },
      // 403 causes app to show a "unavailable in country" modal
      { status: 403 },
    );
  }

  let formattedMetadata = await formatAppMetadata(
    { ...parsedAppMetadata },
    metricsData,
    locale,
  );

  // Add the draft_id to the response if it exists in the parsed metadata
  if (parsedAppMetadata.id === draft_id) {
    formattedMetadata = {
      ...formattedMetadata,
      draft_id: draft_id,
    };
  }

  const nativeAppMetadata = NativeApps[process.env.NEXT_PUBLIC_APP_ENV];

  if (formattedMetadata.app_id in nativeAppMetadata) {
    const nativeAppItem = nativeAppMetadata[formattedMetadata.app_id];

    formattedMetadata = {
      ...formattedMetadata,
      app_mode: nativeAppItem.app_mode,
      integration_url:
        nativeAppItem.integration_url !== ""
          ? nativeAppItem.integration_url
          : formattedMetadata.integration_url,
      app_id: nativeAppItem.app_id,
    };
  }

  const show_external = searchParams.get("show_external");
  const categories = getAppStoreLocalisedCategoriesWithUrls(
    locale,
    Boolean(show_external) ?? false,
  );
  const isCategoryValid = categories.some(
    (category) => category?.id === formattedMetadata.category.id,
  );

  if (!isCategoryValid) {
    return NextResponse.json({ error: "Invalid category" }, { status: 404 });
  }

  return NextResponse.json(
    { app_data: formattedMetadata },
    {
      status: 200,
      headers: {
        "Cache-Control": "public, max-age=5, stale-if-error=86400",
      },
    },
  );
}
