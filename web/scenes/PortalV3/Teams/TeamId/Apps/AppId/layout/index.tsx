import { ErrorPage } from "@/components/ErrorPage";
import { getIsUserAllowedToReadApp } from "@/lib/permissions";
import { AnalyticsAppEligibility } from "@/scenes/PortalV3/layout/Shell/SidebarNav";
import { AppAnalyticsEligibility } from "@/scenes/PortalV3/layout/server/app-analytics-eligibility";
import { ReactNode, Suspense } from "react";

type AppIdLayoutProps = {
  params: { teamId?: string; appId?: string };
  children: ReactNode;
};

export const AppIdLayout = async (props: AppIdLayoutProps) => {
  const appId = props.params.appId;

  if (!appId) {
    return <ErrorPage statusCode={404} title="App not found" />;
  }

  if (!(await getIsUserAllowedToReadApp(appId))) {
    return (
      <>
        <AnalyticsAppEligibility appId={appId} enabled={false} />
        <ErrorPage statusCode={404} title="App not found" />
      </>
    );
  }

  return (
    <>
      <Suspense fallback={null}>
        <AppAnalyticsEligibility appId={appId} />
      </Suspense>
      {props.children}
    </>
  );
};
