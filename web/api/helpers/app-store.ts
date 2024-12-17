import { getLocalisedCategory } from "@/lib/categories";
import { whitelistedAppsPermit2 } from "@/lib/constants";
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
    showcase_img_urls: appMetadata.showcase_img_urls?.map((url: string) =>
      getCDNImageUrl(
        appMetadata.app_id,
        url,
        appMetadata.verification_status === "verified",
      ),
    ),
    hero_image_url: getCDNImageUrl(
      appMetadata.app_id,
      appMetadata.hero_image_url,
      appMetadata.verification_status === "verified",
    ),
    description: {
      overview: description?.description_overview ?? "",
      how_it_works: description?.description_how_it_works ?? "",
      how_to_connect: description?.description_connect ?? "",
    },
    ratings_external_nullifier: generateExternalNullifier(
      `${appMetadata.app_id}_app_review`,
    ).digest,
    unique_users: singleAppStats?.unique_users ?? 0,
    impressions: singleAppStats?.total_impressions ?? 0,
    category: getLocalisedCategory(appMetadata.category, locale) ?? {
      id: "other",
      name: "Other",
    },
    show_in_app_store: is_reviewer_world_app_approved,
    team_name: app.team.name ?? "",
    permit2_tokens: permit2Tokens,
  };
};

// Cached thus this is not that expensive
export const rankApps = (
  apps: AppStoreFormattedFields[],
  appStats: AppStatsReturnType,
) => {
  return apps.sort((a, b) => {
    const aStat = appStats.find((stat) => stat.app_id === a.app_id);
    const bStat = appStats.find((stat) => stat.app_id === b.app_id);

    return (
      (bStat?.unique_users_last_7_days ?? 0) -
      (aStat?.unique_users_last_7_days ?? 0)
    );
  });
};
