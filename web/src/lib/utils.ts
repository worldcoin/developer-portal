import { EnvironmentType, SequencerMappingType } from "src/lib/types";
import {
  ORB_SEQUENCER_STAGING,
  ORB_SEQUENCER,
  PHONE_SEQUENCER_STAGING,
  PHONE_SEQUENCER,
} from "./constants";

export const ENVIRONMENTS: EnvironmentType[] = [
  { name: "Production", value: "production", icon: { name: "rocket" } },
  { name: "Staging", value: "staging", icon: { name: "chart" } },
];

// Sequencer mapping
export const sequencerMapping: SequencerMappingType = {
  orb: {
    true: ORB_SEQUENCER_STAGING,
    false: ORB_SEQUENCER,
  },
  phone: {
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
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    )
  );
};

export const isSSR = () => typeof window === "undefined";
