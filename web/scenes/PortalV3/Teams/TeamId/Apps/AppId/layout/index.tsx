import { isAppInAnalytics } from "@/api/helpers/selfie-check-analytics/snapshots";
import { ErrorPage } from "@/components/ErrorPage";
import { getIsUserAllowedToReadApp } from "@/lib/permissions";
import { AnalyticsEligibleApp } from "@/scenes/PortalV3/layout/Shell/SidebarNav";
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

  return (
    <>
      {(await isAppInAnalytics(appId)) ? (
        <AnalyticsEligibleApp appId={appId} />
      ) : null}
      {props.children}
    </>
  );
};
