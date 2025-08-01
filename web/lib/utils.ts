import { Role_Enum } from "@/graphql/graphql";
import { Auth0EmailUser, Auth0User } from "@/lib/types";
import { VerificationLevel } from "@worldcoin/idkit-core";
import {
  DOCUMENT_SEQUENCER,
  DOCUMENT_SEQUENCER_STAGING,
  ORB_SEQUENCER,
  ORB_SEQUENCER_STAGING,
  PARTNER_TEAM_IDS,
  PHONE_SEQUENCER,
  PHONE_SEQUENCER_STAGING,
  SECURE_DOCUMENT_SEQUENCER,
  SECURE_DOCUMENT_SEQUENCER_STAGING,
} from "./constants";
import { Auth0SessionUser } from "./types";

/**
 * Sequencer mapping
 * @param verificationLevel - The verification level to get the sequencer for
 * @returns The sequencer for the verification level
 */
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
  [VerificationLevel.Document]: {
    true: DOCUMENT_SEQUENCER_STAGING,
    false: DOCUMENT_SEQUENCER,
  },
  [VerificationLevel.SecureDocument]: {
    true: SECURE_DOCUMENT_SEQUENCER_STAGING,
    false: SECURE_DOCUMENT_SEQUENCER,
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

/**
 * Checks if the code is running in the server
 * @returns True if the code is running in the server, false otherwise
 */
export const isSSR = () => typeof window === "undefined";

/**
 * Checks if a user is an email user
 * @param user - The user to check
 */
export const isEmailUser = (user: Auth0User): user is Auth0EmailUser =>
  user.sub.startsWith("email|");
/**
 * Gets the CDN image URL
 * @param app_id - The ID of the app
 * @param path - The path to the image
 * @param isAppVerified - Whether the app is verified
 * @param locale - Optional locale for localized images
 * @returns The CDN image URL
 */
export const getCDNImageUrl = (
  app_id: string,
  path: string,
  isAppVerified = true,
  locale?: string,
) =>
  isAppVerified
    ? `${process.env.NEXT_PUBLIC_IMAGES_CDN_URL}/${app_id}${locale && locale !== "en" ? `/${locale}` : ""}/${path}`
    : `${process.env.NEXT_PUBLIC_IMAGES_CDN_URL}/unverified/${app_id}${locale && locale !== "en" ? `/${locale}` : ""}/${path}`;

export const getDefaultLogoImgCDNUrl = () => {
  return `${process.env.NEXT_PUBLIC_IMAGES_CDN_URL}/default/default-logo-image.png`;
};

/**
 * Gets the logo image CDN URL
 * @param app_id - The ID of the app
 * @param path - The path to the logo image
 * @param isAppVerified - Whether the app is verified
 * @returns The logo image CDN URL
 */
export const getLogoImgCDNUrl = (
  app_id: string,
  path: string,
  isAppVerified = true,
) => {
  if (!path) {
    return getDefaultLogoImgCDNUrl();
  }
  return getCDNImageUrl(app_id, path, isAppVerified);
};

/**
 * Checks if a user has the required roles
 * @param user - The user to check
 * @param teamId - The ID of the team to check
 * @param validRoles - The roles to check for
 * @returns True if the user has the required roles, false otherwise
 */
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

/**
 * Gets the nullifier name
 * @param nullifier - The nullifier to get the name of
 * @returns The nullifier name
 */
export const getNullifierName = (nullifier: string | undefined | null) => {
  if (!nullifier) return null;
  return `${nullifier.slice(0, 6)}...${nullifier.slice(-4)}`;
};

/**
 * Truncates a string
 * @param str - The string to truncate
 * @param length - The length to truncate the string to
 * @returns The truncated string
 */
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

/**
 * Validates the host name of a request
 * @param request - The request to validate
 * @returns True if the host name is valid, false otherwise
 */
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
  const cdnHost = process.env.NEXT_PUBLIC_IMAGES_CDN_URL;
  if (!cdnHost || !cdnHost.includes(hostName)) {
    return false;
  }
  return true;
};

/**
 * Creates a localise category
 * @param category - The category to create a localise category for
 * @returns The localise category
 */
export const createLocaliseCategory = (category: string) => {
  return `world_id_partner_category_${category.toLowerCase()}`;
};

export const createLocaliseField = (appId: string, field: string) => {
  return `world_id_partner_${appId}_${field}`;
};

/**
 * Converts the stringified array of string arrays to a format that can be used in a query
 * @param stringifiedArray - The stringified array of string arrays to convert
 * @returns The converted array
 */
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

/**
 * Converts an array to a Hasura array
 * @param array - The array to convert
 * @returns The converted array
 */
export const convertArrayToHasuraArray = (
  array: string[] | null | undefined,
) => {
  if (!array) return null;
  return `{${array.join(",")}}`;
};

/**
 * Creates a transaction hash URL
 * @param transactionHash - The transaction hash to create a URL for
 * @param network - The network to create a URL for
 * @returns The transaction hash URL
 */
export const createTransactionHashUrl = (
  transactionHash: string | null,
  network: string,
) => {
  if (!transactionHash) return "";
  if (network === "optimism") {
    return `https://optimistic.etherscan.io/tx/${transactionHash}`;
  }
  if (network === "worldchain") {
    return `https://worldscan.org/tx/${transactionHash}`;
  }
  return "Invalid network";
};

/**
 * Tries to parse a JSON string
 * @param input - The string to parse
 * @returns The parsed JSON object or null if the string is not a valid JSON
 */
export const tryParseJSON = <T extends {}>(
  input: string | null | undefined,
): T | null => {
  if (!input) return null;
  try {
    const o = JSON.parse(input);

    if (o && typeof o === "object") {
      return o;
    }
  } catch (e) {
    console.warn("Error parsing JSON", { error: JSON.stringify(e), input });
    return null;
  }

  return null;
};

/**
 * Gets the file type of an image
 * @param imageType - The type of image to get the file type of
 * @returns The file type of the image
 */
export const getImageEndpoint = (imageType: string) => {
  const fileType = imageType.split(".").pop();
  if (fileType === "png" || fileType === "jpg") {
    return fileType;
  } else {
    throw new Error("Unsupported image file type");
  }
};

/**
 * Checks if a team is a partner team
 * @param teamId - The ID of the team to check
 * @returns True if the team is a partner team, false otherwise
 */
export const checkIfPartnerTeam = (teamId: string) => {
  const envTeamIds =
    PARTNER_TEAM_IDS[
      process.env.NEXT_PUBLIC_APP_ENV as keyof typeof PARTNER_TEAM_IDS
    ];

  // Always return true if it's a staging app
  if (process.env.NEXT_PUBLIC_APP_ENV === "staging") {
    return true;
  }
  return envTeamIds.includes(teamId);
};

/**
 * Checks if the app is in a production environment
 */
export const checkIfProduction = (): boolean => {
  return process.env.NEXT_PUBLIC_APP_ENV === "production";
};

const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_INITIAL_RETRY_DELAY = 500;

export const fetchWithRetry = async (
  url: string,
  options: RequestInit,
  maxRetries: number = DEFAULT_MAX_RETRIES,
  initialRetryDelayinMS: number = DEFAULT_INITIAL_RETRY_DELAY,
  throwOnError: boolean = true,
): Promise<Response> => {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) {
        return response;
      }
      lastError = new Error(`HTTP status ${response.status}`);
    } catch (error) {
      lastError = error as Error;
    }

    if (attempt < maxRetries - 1) {
      const delay = initialRetryDelayinMS * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  if (!throwOnError) {
    // Return a Response-like object with failure info
    return new Response(
      JSON.stringify({ error: lastError?.message || "Unknown error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  throw lastError;
};
