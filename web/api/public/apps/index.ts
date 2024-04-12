import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import {
  createLocaliseCategory,
  createLocaliseField,
  getCDNImageUrl,
  isValidHostName,
} from "@/lib/utils";
import { NextResponse } from "next/server";
import { getSdk as getAppMetadataSdk } from "./graphql/get-app-metadata.generated";
import { getSdk as getAppRankingsSdk } from "./graphql/get-app-rankings.generated";

/**
 * Fetches the list of apps to be shown in the app store. Needs to be called through our assets cloudfront
 * @param req
 * Accepts: platform, country, page
 * @param res
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const platform = searchParams.get("platform"); // Required
  const country = searchParams.get("country") ?? "default"; // Optional
  const page = parseInt(searchParams.get("page") ?? "1", 10); // Optional
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "250", 10), 500); // Optional, max 500 default 250
  const isApp = platform === "app";

  // We only accept requests through the distribution origin
  if (!isValidHostName(request)) {
    return NextResponse.json(
      {
        error: `Invalid Request Origin, please use ${process.env.NEXT_PUBLIC_VERIFIED_IMAGES_CDN_URL}`,
      },
      { status: 400 },
    );
  }

  if (!platform || (platform !== "web" && platform !== "app")) {
    // Check platform param is defined
    return NextResponse.json(
      {
        error: "Invalid or missing platform parameter. Must be 'web' or 'app'.",
      },
      { status: 400 },
    );
  }

  const client = await getAPIServiceGraphqlClient();

  // Anchor: Fetch the country ordering if exists, otherwise get default ordering
  const { app_rankings, default_app_rankings, featured_app_rankings } =
    await getAppRankingsSdk(client).GetAppRankings({
      platform,
      country,
    });

  let rankings = [];

  if (app_rankings.length > 0) {
    rankings = app_rankings[0].rankings;
  } else if (default_app_rankings.length > 0) {
    // If no rankings or not specified we should use default
    rankings = default_app_rankings[0].rankings;
  }

  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;

  const appIdsToFetch = rankings.slice(startIndex, endIndex);

  // Anchor: Get the list of app metadata that corresponds to the platform and country
  // TODO: We are currently not checking platform inside this call, it's not breaking but if we decide we don't want to show some apps on the app store and don't rank them then we need to implement this.
  const { ranked_apps, unranked_apps } = await getAppMetadataSdk(
    client,
  ).GetAppMetadata({
    app_ids: appIdsToFetch,
    limit: limit - appIdsToFetch.length,
    offset: Math.max(startIndex - appIdsToFetch.length, 0),
  });

  ranked_apps.sort(
    (a, b) => appIdsToFetch.indexOf(a.app_id) - appIdsToFetch.indexOf(b.app_id),
  );

  const apps = [...ranked_apps, ...unranked_apps].map((appData) => {
    const { app, ...appMetadata } = appData;
    return {
      ...appMetadata,
      logo_img_url: getCDNImageUrl(
        appMetadata.app_id,
        appMetadata.logo_img_url,
      ),
      hero_image_url: getCDNImageUrl(
        appMetadata.app_id,
        appMetadata.hero_image_url,
      ),
      showcase_img_urls: appMetadata.showcase_img_urls
        ? appMetadata.showcase_img_urls?.map((showcase_img: string) =>
            getCDNImageUrl(appMetadata.app_id, showcase_img),
          )
        : [],
      team_name: app.team.name,
      category: isApp
        ? createLocaliseCategory(appMetadata.category)
        : appMetadata.category,
      description: isApp
        ? {
            overview: createLocaliseField(
              appMetadata.app_id,
              "description_overview",
            ),
            how_it_works: createLocaliseField(
              appMetadata.app_id,
              "description_how_it_works",
            ),
            how_to_connect: createLocaliseField(
              appMetadata.app_id,
              "description_connect",
            ),
          }
        : JSON.parse(appMetadata.description),
      world_app_button_text: isApp
        ? createLocaliseField(appMetadata.app_id, "world_app_button_text")
        : appMetadata.world_app_button_text,
      world_app_description: isApp
        ? createLocaliseField(appMetadata.app_id, "world_app_description")
        : appMetadata.world_app_description,
    };
  });

  const featured_app_ids = featured_app_rankings?.[0]?.rankings ?? [];
  const featured_apps = apps.filter((app) =>
    featured_app_ids.includes(app.app_id),
  );

  return NextResponse.json(
    { apps: apps, featured: featured_apps },
    { status: 200 },
  );
}
