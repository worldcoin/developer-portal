import { Role_Enum } from "@/graphql/graphql";
import { Auth0EmailUser, Auth0User } from "@/legacy/lib/types";
import { VerificationLevel } from "@worldcoin/idkit-core";
import { getLocalisedCategory } from "./categories";
import {
  ORB_SEQUENCER,
  ORB_SEQUENCER_STAGING,
  PHONE_SEQUENCER,
  PHONE_SEQUENCER_STAGING,
} from "./constants";
import { generateExternalNullifier } from "./hashing";
import {
  AppStatsReturnType,
  AppStoreFormattedFields,
  AppStoreMetadataDescription,
  AppStoreMetadataFields,
  Auth0SessionUser,
} from "./types";

// Sequencer mapping
export const sequencerMapping: Record<
  VerificationLevel,
  { [key: string]: string | undefined }
> = {
  [VerificationLevel.Orb]: {
    true: ORB_SEQUENCER_STAGING,
    false: ORB_SEQUENCER,
  },
  [VerificationLevel.Device]: {
    true: PHONE_SEQUENCER_STAGING,
    false: PHONE_SEQUENCER,
  },
};

/**
 * Validates a string is a valid URL
 * @param candidate
 * @returns
 */
export const validateUrl = (candidate: string, isStaging: boolean): boolean => {
  let parsedUrl;
  try {
    parsedUrl = new URL(candidate);
  } catch (_) {
    return false;
  }

  const isLocalhost = parsedUrl.hostname === "localhost";
  const isHttps = parsedUrl.protocol === "https:";

  if (!isLocalhost) {
    return isHttps;
  }

  // If the URL is localhost, we only allow it if we're in a staging environment
  if (!isStaging) return false;

  const localhostRegex =
    /^https?:\/\/localhost(:[0-9]+)?(\/[^\s?]*)(\\?[^\s]*)?$/;

  return localhostRegex.test(candidate);
};

/**
 * Validates the string looks like a valid email address
 * @param candidate
 * @returns
 */
export const validateEmail = (candidate: string): boolean => {
  return Boolean(
    candidate.match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
    ),
  );
};

export const isSSR = () => typeof window === "undefined";

export const isEmailUser = (user: Auth0User): user is Auth0EmailUser =>
  user.sub.startsWith("email|");

export const getCDNImageUrl = (
  app_id: string,
  path: string,
  isAppVerified = true,
) =>
  isAppVerified
    ? `${process.env.NEXT_PUBLIC_VERIFIED_IMAGES_CDN_URL}/${app_id}/${path}`
    : `${process.env.NEXT_PUBLIC_VERIFIED_IMAGES_CDN_URL}/unverified/${app_id}/${path}`;

export const checkUserPermissions = (
  user: Auth0SessionUser["user"],
  teamId: string,
  validRoles: Role_Enum[] | string[],
) => {
  const membership = user?.hasura?.memberships.find(
    (m) => m.team?.id == teamId,
  );

  if (!membership) {
    return false;
  }
  return validRoles.includes(membership?.role);
};

export const getNullifierName = (nullifier: string | undefined | null) => {
  if (!nullifier) return null;
  return `${nullifier.slice(0, 6)}...${nullifier.slice(-4)}`;
};

export const truncateString = (
  str: string | undefined | null,
  length: number,
) => {
  if (!str) {
    return "";
  }

  if (str.length <= length) {
    return str;
  }

  return `${str.slice(0, length)}...`;
};

// This function is to protect public endpoints to ensure they are coming from our cloudfront distribution
export const isValidHostName = (request: Request) => {
  const hostName =
    request.headers.get("host") || request.headers.get(":authority");

  if (!hostName) {
    return false;
  }

  // Skip check for development
  if (process.env.NODE_ENV === "development") {
    return true;
  }
  const cdnHost = process.env.NEXT_PUBLIC_VERIFIED_IMAGES_CDN_URL;
  if (!cdnHost || !cdnHost.includes(hostName)) {
    return false;
  }
  return true;
};

export const createLocaliseCategory = (category: string) => {
  return `world_id_partner_category_${category.toLowerCase()}`;
};

export const createLocaliseField = (appId: string, field: string) => {
  return `world_id_partner_${appId}_${field}`;
};

// converts the stringified array of string arrays to a format that can be used in a query
export const formatMultipleStringInput = (
  stringifiedArray: string | null | undefined,
) => {
  if (!stringifiedArray) return null;

  const formattedArray = `{${stringifiedArray
    .split(",")
    .map((str) => str.trim())
    .filter((str) => str.length > 0) // Remove empty strings
    .map((str) => `"${str}"`)
    .join(",")}}`;

  return formattedArray;
};

export const convertArrayToHasuraArray = (
  array: string[] | null | undefined,
) => {
  if (!array) return null;
  return `{${array.join(",")}}`;
};

export const createTransactionHashUrl = (
  transactionHash: string | null,
  network: string,
) => {
  if (!transactionHash) return "";
  if (network === "optimism") {
    return `https://optimistic.etherscan.io/tx/${transactionHash}`;
  }
  return "Invalid network";
};

export const tryParseJSON = (jsonString: string) => {
  try {
    const o = JSON.parse(jsonString);

    if (o && typeof o === "object") {
      return o;
    }
  } catch (e) {
    return null;
  }

  return null;
};

export const formatAppMetadata = (
  appData: AppStoreMetadataFields,
  appStats: AppStatsReturnType,
  locale: string = "en",
): AppStoreFormattedFields => {
  const { app, ...appMetadata } = appData;
  const appStat: number =
    appStats.find((stat) => stat.app_id === appMetadata.app_id)?.unique_users ??
    0;

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

  return {
    ...appMetadataWithoutLocalisations,
    name: name,
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
      is_reviewer_world_app_approved,
    ),
    showcase_img_urls: appMetadata.showcase_img_urls?.map((url: string) =>
      getCDNImageUrl(appMetadata.app_id, url, is_reviewer_world_app_approved),
    ),
    hero_image_url: getCDNImageUrl(
      appMetadata.app_id,
      appMetadata.hero_image_url,
      is_reviewer_world_app_approved,
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

// Helper function to ensure uploaded images are png or jpg. Otherwise hasura trigger will fail
export const getImageEndpoint = (imageType: string) => {
  const fileType = imageType.split(".").pop();
  if (fileType === "png" || fileType === "jpg") {
    return fileType;
  } else {
    throw new Error("Unsupported image file type");
  }
};
