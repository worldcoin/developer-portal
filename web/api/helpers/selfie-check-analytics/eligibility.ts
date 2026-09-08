import "server-only";

import { loadLatestTotalsTableSnapshot } from "./snapshots";

/**
 * Membership in the latest successfully verified totals snapshot is eligibility.
 * Reuses the loader's cache, shared refresh, and explicit stale fallback.
 * Absence is normal; failures without a verified snapshot propagate.
 */
export const resolveSelfieCheckAnalyticsEligibility = async (appId: string) => {
  const snapshot = await loadLatestTotalsTableSnapshot();
  return { entry: snapshot.records.get(appId), snapshot };
};
