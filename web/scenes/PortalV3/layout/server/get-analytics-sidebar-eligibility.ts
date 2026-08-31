import "server-only";

import { isSelfieCheckAnalyticsEnabledForApp } from "@/api/helpers/selfie-check-analytics/eligibility";
import { logger } from "@/lib/logger";

/** Optional sidebar gating must never make the surrounding page unavailable. */
export const getAnalyticsSidebarEligibility = async (
  appId: string,
): Promise<boolean> => {
  try {
    return await isSelfieCheckAnalyticsEnabledForApp(appId);
  } catch (error) {
    logger.warn("Failed to resolve analytics eligibility for the sidebar", {
      appId,
      dependency: "selfie-check-analytics-eligibility",
      failureClass:
        error instanceof Error ? error.name : "UnknownEligibilityError",
      error,
    });
    return false;
  }
};
