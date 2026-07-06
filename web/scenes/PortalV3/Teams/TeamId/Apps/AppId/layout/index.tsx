import { ErrorPage } from "@/components/ErrorPage";
import { logger } from "@/lib/logger";
import { getIsUserAllowedToReadApp } from "@/lib/permissions";
import { AppEnvFlagsSync } from "@/scenes/PortalV3/layout/Shell/SidebarNav";
import { fetchAppEnvCached } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/layout/server/fetch-app-env";
import { ReactNode } from "react";

type Params = {
  teamId?: string;
  appId?: string;
};

type AppIdLayoutProps = {
  params: Params;
  children: ReactNode;
};

/**
 * v3 app layout. Mirrors the v2 auth/existence guard and app-env fetch (reusing
 * the same shared helpers) but renders the v3 chrome, which drops the primary
 * app nav in favor of the sidebar shell.
 */
export const AppIdLayout = async (props: AppIdLayoutProps) => {
  const params = props.params;
  let hasLegacyActions = false;
  let hasRpRegistration = false;

  // Authorize against the database (the session cookie's `memberships` is not a
  // trustworthy authorization source). Reading an app requires membership in
  // the app's owning team.
  if (!params.appId || !(await getIsUserAllowedToReadApp(params.appId))) {
    return <ErrorPage statusCode={404} title="App not found" />;
  }

  try {
    const { app, action } = await fetchAppEnvCached(params.appId);

    if (app?.[0]) {
      hasLegacyActions = action.length > 0;
      hasRpRegistration = app[0].rp_registration.length > 0;
    } else {
      logger.warn("AppIdLayout (v3) could not resolve app from FetchAppEnv", {
        appId: params.appId,
        teamId: params.teamId,
      });
      return <ErrorPage statusCode={404} title="App not found" />;
    }
  } catch (error) {
    logger.error("AppIdLayout (v3) FetchAppEnv failed", {
      error,
      appId: params.appId,
      teamId: params.teamId,
    });
    return <ErrorPage statusCode={500} title="Failed to load app" />;
  }

  return (
    <>
      <AppEnvFlagsSync
        appId={params.appId!}
        hasRpRegistration={hasRpRegistration}
        hasLegacyActions={hasLegacyActions}
      />
      {props.children}
    </>
  );
};
