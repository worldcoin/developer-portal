import "server-only";

import { logger } from "@/lib/logger";

const SELFIE_CHECK_ANALYTICS_APPS_PARAMETER =
  "whitelisted-apps/selfie-check-analytics";

const normalizeAppIds = (value: unknown): string[] | null => {
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  // Be tolerant if the deployment parameter is accidentally created as a
  // String instead of StringList; the source remains a comma-separated list.
  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return null;
};

/**
 * Fail-closed rollout gate for the analytics endpoint.
 *
 * The SSM parameter is the operational kill switch: a missing/empty parameter
 * enables no apps. It is not an authorization boundary; the route separately
 * checks the authenticated user's membership and the current totals snapshot.
 */
export const isSelfieCheckAnalyticsEnabledForApp = async (
  appId: string,
): Promise<boolean> => {
  const parameterStore = global.ParameterStore;
  if (!parameterStore) return false;

  let value: unknown;
  try {
    value = await parameterStore.getParameter<unknown>(
      SELFIE_CHECK_ANALYTICS_APPS_PARAMETER,
      [],
    );
  } catch (error) {
    logger.warn(
      "Failed to read the selfie-check analytics allowlist; feature remains disabled",
      {
        dependency: "ssm",
        parameterName: SELFIE_CHECK_ANALYTICS_APPS_PARAMETER,
        failureClass:
          error instanceof Error ? error.name : "UnknownParameterStoreError",
        error,
      },
    );
    return false;
  }

  const appIds = normalizeAppIds(value);
  if (!appIds) {
    logger.warn(
      "Selfie-check analytics allowlist has an invalid value; feature remains disabled",
      {
        dependency: "ssm",
        parameterName: SELFIE_CHECK_ANALYTICS_APPS_PARAMETER,
        failureClass: "InvalidParameterValue",
      },
    );
    return false;
  }

  return appIds.includes(appId);
};
