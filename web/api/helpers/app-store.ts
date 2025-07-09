import { type Category, getLocalisedCategory } from "@/lib/categories";
import {
  NATIVE_MAPPED_APP_ID,
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
  platform?: string | null,
  country?: string | null,
): Promise<AppStoreFormattedFields> => {
  const { app, ...appMetadata } = appData;
  const singleAppStats: AppStatsItem | undefined = appStats.find(
    (stat) => stat.app_id === appMetadata.app_id,
  );

  const shouldCompressCountryList =
    country && (platform === "ios" || platform === "android");

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

  // fallback to logo
  const metaTagImageUrl =
    isLocalisationComplete && localisedContent?.meta_tag_image_url
      ? localisedContent.meta_tag_image_url
      : appMetadata.meta_tag_image_url || appMetadata.logo_img_url;
  //
  const showcaseImgUrls =
    isLocalisationComplete && localisedContent?.showcase_img_urls
      ? localisedContent.showcase_img_urls
      : appMetadata.showcase_img_urls;
  //
  const metaTagImageLocale =
    isLocalisationComplete && localisedContent?.meta_tag_image_url
      ? locale
      : "en";
  //
  const showcaseImgUrlsLocale =
    isLocalisationComplete && localisedContent?.showcase_img_urls
      ? locale
      : "en";

  const supportedCountries = shouldCompressCountryList
    ? [country.toUpperCase()]
    : appMetadata.supported_countries;
  let buttonTextOverride =
    localisedContent?.world_app_button_text ??
    appMetadata.world_app_button_text;
  if (
    buttonTextOverride === "Use Integration" &&
    appMetadata.app_mode !== "external"
  ) {
    buttonTextOverride = "Get Mini App";
  }
  return {
    ...appMetadataWithoutLocalisations,
    name: name,
    app_rating: appRating ?? 0,
    world_app_button_text: buttonTextOverride,
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
    meta_tag_image_url: getCDNImageUrl(
      appMetadata.app_id,
      metaTagImageUrl,
      appMetadata.verification_status === "verified",
      metaTagImageLocale,
    ),
    hero_image_url: "",
    showcase_img_urls: showcaseImgUrls?.map((url: string) =>
      getCDNImageUrl(
        appMetadata.app_id,
        url,
        appMetadata.verification_status === "verified",
        showcaseImgUrlsLocale,
      ),
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
    supported_countries: supportedCountries,
    ...getNotificationPermissions(appMetadata),
    avg_notification_open_rate: getAvgNotificationOpenRate(
      singleAppStats?.open_rate_last_14_days,
    ),
    deleted_at: app.deleted_at ?? null,
  };
};

export const getAvgNotificationOpenRate = (
  openRateLast14Days: AppStatsItem["open_rate_last_14_days"] | null | undefined,
): number | null => {
  // if no data or less than 7 days, return null
  if (!openRateLast14Days || openRateLast14Days.length < 7) {
    return null;
  }

  const avgOpenRate =
    openRateLast14Days.reduce((acc, curr) => acc + curr.value, 0) /
    openRateLast14Days.length;

  return avgOpenRate;
};

const isDefaultPinnedNoGrants = (appId: string) => {
  return (
    appId === "app_e8288209fbe1fc4a1b80619e925a79bd" || // learn
    appId === NATIVE_MAPPED_APP_ID.contacts ||
    appId === NATIVE_MAPPED_APP_ID.network ||
    appId === NATIVE_MAPPED_APP_ID.invites
  );
};

// logic responsible for setting this is in api/_evaluate-app-notification-permissions
const getNotificationPermissions = (
  appMetadata: Pick<
    AppStoreMetadataFields,
    | "is_allowed_unlimited_notifications"
    | "max_notifications_per_day"
    | "notification_permission_status"
  >,
): {
  is_allowed_unlimited_notifications: boolean | null | undefined;
  max_notifications_per_day: number | null | undefined;
} => {
  if (appMetadata.notification_permission_status === "paused") {
    return {
      is_allowed_unlimited_notifications: false,
      max_notifications_per_day: 0,
    };
  }

  return {
    is_allowed_unlimited_notifications:
      appMetadata.is_allowed_unlimited_notifications,
    max_notifications_per_day: appMetadata.max_notifications_per_day,
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
    if (stat.app_id === NATIVE_MAPPED_APP_ID.grants) {
      return;
    }
    maxNewUsers = Math.max(maxNewUsers, stat.new_users_last_7_days ?? 0);
    maxUniqueUsers = Math.max(maxUniqueUsers, stat.unique_users ?? 0);
  });

  // ensure we don't divide by zero
  maxNewUsers = maxNewUsers === 0 ? 1 : maxNewUsers;
  maxUniqueUsers = maxUniqueUsers === 0 ? 1 : maxUniqueUsers;

  return apps.sort((a, b) => {
    // move specific apps to the end
    if (
      isDefaultPinnedNoGrants(a.app_id) &&
      !isDefaultPinnedNoGrants(b.app_id)
    ) {
      return 1; // a goes after b
    }
    if (
      !isDefaultPinnedNoGrants(a.app_id) &&
      isDefaultPinnedNoGrants(b.app_id)
    ) {
      return -1; // a goes before b
    }

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

    // 50% new_users_last_7_days, 50% unique_users
    const aScore = aNormalizedNewUsers * 0.5 + aNormalizedUniqueUsers * 0.5;
    const bScore = bNormalizedNewUsers * 0.5 + bNormalizedUniqueUsers * 0.5;

    return bScore - aScore;
  });
};
