import { EnvironmentType } from "src/lib/types";

export const ENVIRONMENTS: EnvironmentType[] = [
  { name: "Production", value: "production", icon: { name: "rocket" } },
  { name: "Staging", value: "staging", icon: { name: "chart" } },
];

/**
 * Validates a string is a valid URL
 * @param candidate
 * @returns
 */
export const validateUrl = (
  candidate: string,
  onlyHttps?: boolean
): boolean => {
  let parsedUrl;
  try {
    parsedUrl = new URL(candidate);
  } catch (_) {
    return false;
  }

  return (
    parsedUrl.protocol === "https:" ||
    (!onlyHttps && parsedUrl.protocol === "http:")
  );
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
