import { Chain, CredentialType, EnvironmentType } from "src/lib/types";
import {
  POLYGON_ORB_SEQUENCER_STAGING,
  POLYGON_ORB_SEQUENCER,
  POLYGON_PHONE_SEQUENCER_STAGING,
  POLYGON_PHONE_SEQUENCER,
  OPTIMISM_ORB_SEQUENCER,
  OPTIMISM_ORB_SEQUENCER_STAGING,
} from "./constants";

export const ENVIRONMENTS: EnvironmentType[] = [
  { name: "Production", value: "production", icon: { name: "rocket" } },
  { name: "Staging", value: "staging", icon: { name: "chart" } },
];

// Sequencer mapping
export const sequencerMapping: Record<
  Chain,
  Record<CredentialType, { [key: string]: string | undefined }>
> = {
  [Chain.Polygon]: {
    [CredentialType.Orb]: {
      true: POLYGON_ORB_SEQUENCER_STAGING,
      false: POLYGON_ORB_SEQUENCER,
    },
    [CredentialType.Phone]: {
      true: POLYGON_PHONE_SEQUENCER_STAGING,
      false: POLYGON_PHONE_SEQUENCER,
    },
  },
  [Chain.Optimism]: {
    [CredentialType.Orb]: {
      true: OPTIMISM_ORB_SEQUENCER_STAGING,
      false: OPTIMISM_ORB_SEQUENCER,
    },
    [CredentialType.Phone]: {
      true: undefined,
      false: undefined,
    },
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
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    )
  );
};

export const isSSR = () => typeof window === "undefined";
