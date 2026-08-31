import "server-only";

import { filterAppsWithTotalsData, getTotalsAppSnapshot } from "./redis-store";

// Follow-up after this rollout is verified: remove the obsolete
// whitelisted-apps/selfie-check-analytics parameter from the deployment repo.

/** A totals row in the live Redis snapshot is the runtime eligibility gate. */
export const checkEligibility = async (appId: string): Promise<boolean> =>
  (await getTotalsAppSnapshot(appId)) !== null;

/** Filters several apps against the same live totals snapshot. */
export const filterSelfieCheckAnalyticsEnabledApps = (
  appIds: readonly string[],
): Promise<string[]> => filterAppsWithTotalsData(appIds);
