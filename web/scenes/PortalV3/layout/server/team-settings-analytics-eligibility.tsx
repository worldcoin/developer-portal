import "server-only";

import { logger } from "@/lib/logger";
import { getIsUserAllowedToReadApp } from "@/lib/permissions";
import { getPortalAppContext } from "@/lib/team-settings";
import { AnalyticsAppEligibility } from "../Shell/SidebarNav";
import { getAnalyticsSidebarEligibility } from "./get-analytics-sidebar-eligibility";

type QueryValue = string | string[] | undefined;

/** Restores the app sidebar verdict on direct team-settings loads. */
export const TeamSettingsAnalyticsEligibility = async (props: {
  teamId?: string;
  returnTo?: QueryValue;
}) => {
  const appContext = props.teamId
    ? getPortalAppContext(props.returnTo, props.teamId)
    : null;
  if (!appContext) return null;

  let enabled = false;
  try {
    enabled =
      (await getIsUserAllowedToReadApp(appContext.appId)) &&
      (await getAnalyticsSidebarEligibility(appContext.appId));
  } catch (error) {
    logger.warn("Failed to validate analytics sidebar app from team settings", {
      appId: appContext.appId,
      dependency: "hasura",
      failureClass:
        error instanceof Error ? error.name : "UnknownPermissionError",
      error,
    });
  }

  return <AnalyticsAppEligibility appId={appContext.appId} enabled={enabled} />;
};
