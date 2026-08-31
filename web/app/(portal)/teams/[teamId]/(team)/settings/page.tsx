import { generateMetaTitle } from "@/lib/genarate-title";
import { logger } from "@/lib/logger";
import { getIsUserAllowedToReadApp } from "@/lib/permissions";
import { getPortalAppContext } from "@/lib/team-settings";
import { TeamSettingsPage } from "@/scenes/PortalV3/Teams/TeamId/Team/Settings/page";
import { AnalyticsEligibleApp } from "@/scenes/PortalV3/layout/Shell/SidebarNav";
import { getAnalyticsSidebarEligibility } from "@/scenes/PortalV3/layout/server/get-analytics-sidebar-eligibility";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Team settings" }),
};

type TeamSettingsSearchParams = {
  tab?: string | string[];
  return_to?: string | string[];
};

type TeamSettingsParams = {
  teamId?: string;
};

export default async function Page(
  props: {
    params?: Promise<TeamSettingsParams>;
    searchParams?: Promise<TeamSettingsSearchParams>;
  } = {},
) {
  const [params, searchParams]: [TeamSettingsParams, TeamSettingsSearchParams] =
    await Promise.all([
      props.params ?? Promise.resolve({}),
      props.searchParams ?? Promise.resolve({}),
    ]);
  // AppIdLayout is not mounted on team settings. Recover its exact app context
  // so copied or refreshed return_to links can restore the sidebar verdict.
  const appContext = params.teamId
    ? getPortalAppContext(searchParams.return_to, params.teamId)
    : null;
  let analyticsEnabled = false;
  if (appContext) {
    try {
      analyticsEnabled =
        (await getIsUserAllowedToReadApp(appContext.appId)) &&
        (await getAnalyticsSidebarEligibility(appContext.appId));
    } catch (error) {
      logger.warn(
        "Failed to validate analytics sidebar app from team settings",
        {
          appId: appContext.appId,
          dependency: "hasura",
          failureClass:
            error instanceof Error ? error.name : "UnknownPermissionError",
          error,
        },
      );
    }
  }

  return (
    <>
      {analyticsEnabled && appContext ? (
        <AnalyticsEligibleApp appId={appContext.appId} />
      ) : null}
      <TeamSettingsPage requestedTab={searchParams.tab} />
    </>
  );
}
