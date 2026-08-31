import { isSelfieCheckAnalyticsEnabledForApp } from "@/api/helpers/selfie-check-analytics/eligibility";
import { ErrorPage } from "@/components/ErrorPage";
import { logger } from "@/lib/logger";
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

  let analyticsEnabled = false;
  try {
    analyticsEnabled = await isSelfieCheckAnalyticsEnabledForApp(appId);
  } catch (error) {
    logger.warn("Failed to resolve analytics eligibility in app layout", {
      appId,
      dependency: "selfie-check-analytics-eligibility",
      failureClass:
        error instanceof Error ? error.name : "UnknownEligibilityError",
      error,
    });
  }

  return (
    <>
      {analyticsEnabled ? <AnalyticsEligibleApp appId={appId} /> : null}
      {props.children}
    </>
  );
};
