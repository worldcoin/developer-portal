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
export const validateUrl = (candidate: string): boolean => {
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

export const uriHasJS = (uri: string) => /javascript:/.test(uri);

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
