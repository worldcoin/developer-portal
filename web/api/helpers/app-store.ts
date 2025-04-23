import { type Category, getLocalisedCategory } from "@/lib/categories";
import {
  whitelistedAppsContracts,
  whitelistedAppsPermit2,
} from "@/lib/constants";
import { generateExternalNullifier } from "@/lib/hashing";
import {
  AppStatsItem,
  AppStatsReturnType,
  AppStoreFormattedFields,
  AppStoreMetadataDescription,
  AppStoreMetadataFields,
} from "@/lib/types";
import { getCDNImageUrl, getLogoImgCDNUrl, tryParseJSON } from "@/lib/utils";

export const formatAppMetadata = async (
  appData: AppStoreMetadataFields,
  appStats: AppStatsReturnType,
  locale: string = "en",
): Promise<AppStoreFormattedFields> => {
  const { app, ...appMetadata } = appData;
  const singleAppStats: AppStatsItem | undefined = appStats.find(
    (stat) => stat.app_id === appMetadata.app_id,
  );

  const appRating =
    appData.app.rating_count > 0
      ? parseFloat(
          (appData.app.rating_sum / appData.app.rating_count).toFixed(2),
        )
      : 0;

  const localisedContent = appMetadata.localisations?.[0];

  // We pick default description if localised content is not available
  const description: AppStoreMetadataDescription = tryParseJSON(
    localisedContent?.description ?? appMetadata.description,
  ) ?? {
    description_overview: "",
    description_how_it_works: "",
    description_connect: "",
  };

  const {
    localisations,
    is_reviewer_world_app_approved,
    ...appMetadataWithoutLocalisations
  } = appMetadata;

  const name = localisedContent?.name ?? appMetadata.name;

  // Check if the app is whitelisted for permit2
  const permit2Tokens = whitelistedAppsPermit2.includes(appMetadata.app_id)
    ? ["all"]
    : appMetadata.permit2_tokens;

  // Check if the app is whitelisted for permit2
  const contracts = whitelistedAppsContracts.includes(appMetadata.app_id)
    ? ["all"]
    : appMetadata.contracts;

  const isLocalisationComplete =
    localisedContent?.description &&
    localisedContent?.world_app_description &&
    localisedContent?.short_name &&
    localisedContent?.name;

  const heroImageUrl =
    isLocalisationComplete && localisedContent?.hero_image_url
      ? localisedContent.hero_image_url
      : appMetadata.hero_image_url;
  const showcaseImgUrls =
    isLocalisationComplete && localisedContent?.showcase_img_urls
      ? localisedContent.showcase_img_urls
      : appMetadata.showcase_img_urls;
  const heroImageLocale =
    isLocalisationComplete && localisedContent?.hero_image_url ? locale : "en";
  const showcaseImgUrlsLocale =
    isLocalisationComplete && localisedContent?.showcase_img_urls
      ? locale
      : "en";

  return {
    ...appMetadataWithoutLocalisations,
    name: name,
    app_rating: appRating ?? 0,
    world_app_button_text:
      localisedContent?.world_app_button_text ??
      appMetadata.world_app_button_text,
    world_app_description:
      localisedContent?.world_app_description ??
      appMetadata.world_app_description,
    short_name:
      localisedContent?.short_name || appMetadata.short_name || "test",
    logo_img_url: getLogoImgCDNUrl(
      appMetadata.app_id,
      appMetadata.logo_img_url,
      appMetadata.verification_status === "verified",
    ),
    showcase_img_urls: showcaseImgUrls?.map((url: string) =>
      getCDNImageUrl(
        appMetadata.app_id,
        url,
        appMetadata.verification_status === "verified",
        showcaseImgUrlsLocale,
      ),
    ),
    hero_image_url: getCDNImageUrl(
      appMetadata.app_id,
      heroImageUrl,
      appMetadata.verification_status === "verified",
      heroImageLocale,
    ),
    // TODO: These fields are not used anymore, we can add them back if we want later
    description: {
      overview: description?.description_overview ?? "",
      how_it_works: "",
      how_to_connect: "",
    },
    ratings_external_nullifier: generateExternalNullifier(
      `${appMetadata.app_id}_app_review`,
    ).digest,
    unique_users: singleAppStats?.unique_users ?? 0,
    impressions: singleAppStats?.total_impressions ?? 0,
    category: getLocalisedCategory(
      appMetadata.category as Category["name"],
      locale,
    ) ?? {
      id: "other",
      name: "Other",
    },
    show_in_app_store: is_reviewer_world_app_approved,
    team_name: app.team.name ?? "",
    permit2_tokens: permit2Tokens,
    contracts: contracts,
  };
};

// Cached thus this is not that expensive
export const rankApps = (
  apps: AppStoreFormattedFields[],
  appStats: AppStatsReturnType,
) => {
  let maxNewUsers = 0;
  let maxUniqueUsers = 0;

  // determine maximum values among apps that
  // are present in the current app store
  const appIdsSet = new Set<string>(apps.map((app) => app.app_id));
  const appStoreAppStats = appStats.filter((stat) =>
    appIdsSet.has(stat.app_id),
  );

  appStoreAppStats.forEach((stat) => {
    maxNewUsers = Math.max(maxNewUsers, stat.new_users_last_7_days ?? 0);
    maxUniqueUsers = Math.max(maxUniqueUsers, stat.unique_users ?? 0);
  });

  // ensure we don't divide by zero
  maxNewUsers = maxNewUsers === 0 ? 1 : maxNewUsers;
  maxUniqueUsers = maxUniqueUsers === 0 ? 1 : maxUniqueUsers;

  return apps.sort((a, b) => {
    const aStat = appStoreAppStats.find((stat) => stat.app_id === a.app_id);
    const bStat = appStoreAppStats.find((stat) => stat.app_id === b.app_id);

    // default to 0 if stats not found
    const aNewUsers = aStat?.new_users_last_7_days ?? 0;
    const aUniqueUsers = aStat?.unique_users ?? 0;
    const bNewUsers = bStat?.new_users_last_7_days ?? 0;
    const bUniqueUsers = bStat?.unique_users ?? 0;

    // normalize values to 0-1 scale
    const aNormalizedNewUsers = aNewUsers / maxNewUsers;
    const aNormalizedUniqueUsers = aUniqueUsers / maxUniqueUsers;
    const bNormalizedNewUsers = bNewUsers / maxNewUsers;
    const bNormalizedUniqueUsers = bUniqueUsers / maxUniqueUsers;

    // 30% new_users_last_7_days
    // 70% unique_users
    const aScore = aNormalizedNewUsers * 0.3 + aNormalizedUniqueUsers * 0.7;
    const bScore = bNormalizedNewUsers * 0.3 + bNormalizedUniqueUsers * 0.7;

    return bScore - aScore;
  });
};
