import { type Category, getLocalisedCategory } from "@/lib/categories";
import { NATIVE_MAPPED_APP_ID, NativeAppToAppIdMapping } from "@/lib/constants";
import { generateExternalNullifier } from "@/lib/hashing";
import {
  AppStatsItem,
  AppStoreFormattedFields,
  AppStoreMetadataDescription,
  AppStoreMetadataFields,
} from "@/lib/types";
import { getCDNImageUrl, getLogoImgCDNUrl, tryParseJSON } from "@/lib/utils";

export interface ParameterStoreValues {
  whitelistedAppsPermit2: string[];
  whitelistedAppsContracts: string[];
  implicitCredentialsApps: string[];
}

export const fetchParameterStoreValues =
  async (): Promise<ParameterStoreValues> => {
    const [
      whitelistedAppsPermit2,
      whitelistedAppsContracts,
      implicitCredentialsApps,
    ] = await Promise.all([
      global.ParameterStore?.getParameter(
        "whitelisted-apps/permit2",
        [] as string[],
      ) ?? Promise.resolve([]),
      global.ParameterStore?.getParameter(
        "whitelisted-apps/contracts",
        [] as string[],
      ) ?? Promise.resolve([]),
      global.ParameterStore?.getParameter(
        "whitelisted-apps/implicit-credentials",
        [] as string[],
      ) ?? Promise.resolve([]),
    ]);

    return {
      whitelistedAppsPermit2: whitelistedAppsPermit2 ?? [],
      whitelistedAppsContracts: whitelistedAppsContracts ?? [],
      implicitCredentialsApps: implicitCredentialsApps ?? [],
    };
  };

export const formatAppMetadata = (
  appData: AppStoreMetadataFields,
  appStatsMap: Map<string, AppStatsItem>,
  locale: string = "en",
  platform?: string | null,
  country?: string | null,
  paramStoreValues?: ParameterStoreValues,
): AppStoreFormattedFields => {
  const { app, ...appMetadata } = appData;
  const singleAppStats: AppStatsItem | undefined = appStatsMap.get(
    appMetadata.app_id,
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

  const {
    whitelistedAppsPermit2,
    whitelistedAppsContracts,
    implicitCredentialsApps,
  } = paramStoreValues ?? {
    whitelistedAppsPermit2: [],
    whitelistedAppsContracts: [],
    implicitCredentialsApps: [],
  };

  // Check if the app is whitelisted for permit2
  const permit2Tokens = whitelistedAppsPermit2.includes(appMetadata.app_id)
    ? ["all"]
    : appMetadata.permit2_tokens;

  // Check if the app is whitelisted for contracts
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

  const showcaseImgUrls =
    isLocalisationComplete && localisedContent?.showcase_img_urls
      ? localisedContent.showcase_img_urls
      : appMetadata.showcase_img_urls;

  const metaTagImageLocale =
    isLocalisationComplete && localisedContent?.meta_tag_image_url
      ? locale
      : "en";

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
    content_card_image_url: appMetadata.content_card_image_url
      ? getCDNImageUrl(
          appMetadata.app_id,
          appMetadata.content_card_image_url,
          appMetadata.verification_status === "verified",
        )
      : "",
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
    avg_notification_open_rate: getAvgNotificationOpenRate(
      singleAppStats?.open_rate_last_14_days,
    ),
    can_use_implicit_credentials: implicitCredentialsApps.includes(
      appMetadata.app_id,
    ),
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

/**
 * Rank apps based on their new users and unique users, this will be unique per country
 * @param apps - The apps to rank
 * @param appStats - The app stats to use for ranking
 * @returns The ranked apps
 */
export const rankApps = (
  apps: AppStoreFormattedFields[],
  appStatsMap: Map<string, AppStatsItem>,
) => {
  let maxNewUsers = 0;
  let maxUniqueUsers = 0;

  const nativeAppConstants = Object.values(NATIVE_MAPPED_APP_ID);
  const nativeAppIds = Object.values(
    NativeAppToAppIdMapping[process.env.NEXT_PUBLIC_APP_ENV ?? "dev"],
  );
  const combinedNativeAppIds = new Set([
    ...nativeAppConstants,
    ...nativeAppIds,
  ]);

  // determine maximum values among apps present in the current app store
  for (const app of apps) {
    if (combinedNativeAppIds.has(app.app_id)) continue;
    const stat = appStatsMap.get(app.app_id);
    if (!stat) continue;
    maxNewUsers = Math.max(
      maxNewUsers,
      Number(stat.new_users_last_7_days ?? 0),
    );
    maxUniqueUsers = Math.max(maxUniqueUsers, Number(stat.unique_users ?? 0));
  }

  // ensure we don't divide by zero
  maxNewUsers = maxNewUsers === 0 ? 1 : maxNewUsers;
  maxUniqueUsers = maxUniqueUsers === 0 ? 1 : maxUniqueUsers;

  // pre-compute scores to avoid repeated lookups in sort comparator
  const scoreMap = new Map<string, number>();
  for (const app of apps) {
    const stat = appStatsMap.get(app.app_id);
    const newUsers = Number(stat?.new_users_last_7_days ?? 0);
    const uniqueUsers = Number(stat?.unique_users ?? 0);
    const score =
      (newUsers / maxNewUsers) * 0.5 + (uniqueUsers / maxUniqueUsers) * 0.5;
    scoreMap.set(app.app_id, score);
  }

  return apps.sort((a, b) => {
    const aPinned = isDefaultPinnedNoGrants(a.app_id);
    const bPinned = isDefaultPinnedNoGrants(b.app_id);
    if (aPinned !== bPinned) return aPinned ? 1 : -1;

    return (scoreMap.get(b.app_id) ?? 0) - (scoreMap.get(a.app_id) ?? 0);
  });
};
