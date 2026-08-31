import "server-only";

import { getTotalsRow } from "./redis-store";

/**
 * Analytics eligibility is presence of a totals row in the live Redis
 * snapshot. No allowlist. Missing Redis, missing metadata, or a missing
 * row all resolve to false.
 */
export const checkEligibility = async (appId: string): Promise<boolean> => {
  try {
    return (await getTotalsRow(appId)) !== null;
  } catch {
    return false;
  }
};

/**
 * Batch variant for the portal shell, which gates the sidebar tab for every
 * app it loaded. Each ID is an independent totals-row lookup.
 */
export const filterSelfieCheckAnalyticsEnabledApps = async (
  appIds: readonly string[],
): Promise<string[]> => {
  if (appIds.length === 0) return [];

  const eligible = await Promise.all(appIds.map(checkEligibility));
  return appIds.filter((_, index) => eligible[index]);
};
