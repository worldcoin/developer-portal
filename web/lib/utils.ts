import { Role_Enum } from "@/graphql/graphql";
import { Auth0EmailUser, Auth0User } from "@/legacy/lib/types";
import { VerificationLevel } from "@worldcoin/idkit-core";
import {
  ORB_SEQUENCER,
  ORB_SEQUENCER_STAGING,
  PHONE_SEQUENCER,
  PHONE_SEQUENCER_STAGING,
} from "./constants";
import { Auth0SessionUser } from "./types";

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

export const getCDNImageUrl = (app_id: string, path: string) => {
  return `${process.env.NEXT_PUBLIC_VERIFIED_IMAGES_CDN_URL}/${app_id}/${path}`;
};

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

export const createLocaliseField = (app_id: string, field: string) => {
  return `world_id_partner_${app_id}_${field}`;
};

// converts the stringified array of addresses to a format that can be used in a query
export const formatWhiteListedAddresses = (
  addresses: string | null | undefined,
) => {
  if (!addresses) return null;

  const formattedAddresses = `{${addresses
    .split(",")
    .map((address) => `"${address.trim()}"`)
    .join(",")}}`;

  return formattedAddresses;
};

export const convertArrayToHasusrArray = (array: string[]) => {
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
