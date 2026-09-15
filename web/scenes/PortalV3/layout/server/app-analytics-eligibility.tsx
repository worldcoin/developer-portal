import "server-only";

import { AnalyticsAppEligibility } from "../Shell/SidebarNav";
import { getAnalyticsSidebarEligibility } from "./get-analytics-sidebar-eligibility";

/** Render inside Suspense, after app access has been checked. */
export const AppAnalyticsEligibility = async ({ appId }: { appId: string }) => (
  <AnalyticsAppEligibility
    appId={appId}
    enabled={await getAnalyticsSidebarEligibility(appId)}
  />
);
