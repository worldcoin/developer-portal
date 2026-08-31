import { ErrorPage } from "@/components/ErrorPage";
import { getIsUserAllowedToReadApp } from "@/lib/permissions";
import { AnalyticsEligibleApp } from "@/scenes/PortalV3/layout/Shell/SidebarNav";
import { getAnalyticsSidebarEligibility } from "@/scenes/PortalV3/layout/server/get-analytics-sidebar-eligibility";
import { ReactNode } from "react";

type AppIdLayoutProps = {
  params: { teamId?: string; appId?: string };
  children: ReactNode;
};

export const AppIdLayout = async (props: AppIdLayoutProps) => {
  const appId = props.params.appId;

  if (!appId || !(await getIsUserAllowedToReadApp(appId))) {
    return <ErrorPage statusCode={404} title="App not found" />;
  }

  const analyticsEnabled = await getAnalyticsSidebarEligibility(appId);

  return (
    <>
      {analyticsEnabled ? <AnalyticsEligibleApp appId={appId} /> : null}
      {props.children}
    </>
  );
};
