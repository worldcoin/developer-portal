"use server";
import { getLocalisedCategory } from "@/lib/categories";
import { whitelistedAppsPermit2 } from "@/lib/constants";
import { generateExternalNullifier } from "@/lib/hashing";
import { createRedisClient } from "@/lib/redis";
import {
  AppStatsReturnType,
  AppStoreFormattedFields,
  AppStoreMetadataDescription,
  AppStoreMetadataFields,
} from "@/lib/types";
import { getCDNImageUrl, tryParseJSON } from "@/lib/utils";
import { getAPIServiceGraphqlClient } from "../graphql";
import { getSdk as getAppRatingSdk } from "./graphql/get-app-rating.generated";

// Helper function to get rating with Redis caching
export async function getAppRating(appId: string): Promise<number> {
  const redisKey = `app:${appId}:rating`;
  const lockKey = `lock:${appId}:rating`;

  const redis = createRedisClient({
    url: process.env.REDIS_URL!,
    password: process.env.REDIS_PASSWORD!,
    username: process.env.REDIS_USERNAME!,
  });

  try {
    // Try to get from cache first
    let rating = await redis.get(redisKey);

    if (rating !== null) {
      return parseFloat(rating);
    }

    // Try to acquire lock
    const acquiredLock = await redis.set(lockKey, "pending", "EX", 30);

    if (!acquiredLock) {
      for (let i = 0; i < 3; i++) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        rating = await redis.get(redisKey);
        if (rating !== null) {
          return parseFloat(rating);
        }
      }

      console.warn("Lock timeout for app rating calculation", { appId });
    }
    const client = await getAPIServiceGraphqlClient();

    // Calculate rating from DB
    const result = await getAppRatingSdk(client).GetAppRating({
      app_id: appId,
    });

    const calculatedRating = result.app_metadata[0].app_rating ?? 0;

    // Cache for 24 hours
    await redis.set(redisKey, calculatedRating.toString(), "EX", 24 * 60 * 60);

    return calculatedRating; // Return as float
  } catch (error) {
    console.warn("Error getting app rating with cache", { error, appId });
    return 0; // Return 0 if there's an error
  } finally {
    try {
      await redis.del(lockKey);
      await redis.quit();
    } catch (redisError) {
      console.error("Error closing Redis connection", { redisError });
    }
  }
}

export const formatAppMetadata = async (
  appData: AppStoreMetadataFields,
  appStats: AppStatsReturnType,
  locale: string = "en",
): Promise<AppStoreFormattedFields> => {
  const { app, ...appMetadata } = appData;
  const appStat: number =
    appStats.find((stat) => stat.app_id === appMetadata.app_id)?.unique_users ??
    0;

  const appRating = await getAppRating(appMetadata.app_id);

  const localisedContent = appMetadata.localisations?.[0];

  // We pick default description if localised content is not available
  const description: AppStoreMetadataDescription = tryParseJSON(
    localisedContent?.description ?? appMetadata.description,
  );

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
    app_rating: appRating,
    world_app_button_text:
      localisedContent?.world_app_button_text ??
      appMetadata.world_app_button_text,
    world_app_description:
      localisedContent?.world_app_description ??
      appMetadata.world_app_description,
    short_name: localisedContent?.short_name ?? appMetadata.short_name ?? name,
    logo_img_url: getCDNImageUrl(
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
    unique_users: appStat,
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
