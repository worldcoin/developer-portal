import "server-only";

import { resolveSelfieCheckAnalyticsEligibility } from "@/api/helpers/selfie-check-analytics/eligibility";
import { logger } from "@/lib/logger";

/** Optional sidebar gating must never make the surrounding page unavailable. */
export const getAnalyticsSidebarEligibility = async (
  appId: string,
): Promise<boolean> => {
  try {
    const { entry } = await resolveSelfieCheckAnalyticsEligibility(appId);
    return entry !== undefined;
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
