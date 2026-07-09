import { ErrorPage } from "@/components/ErrorPage";
import { logger } from "@/lib/logger";
import { getIsUserAllowedToReadApp } from "@/lib/permissions";
import { EngineType } from "@/lib/types";
import { ReactNode } from "react";
import { AppIdChrome } from "./AppIdChrome";
import { fetchAppEnvCached } from "@/scenes/common/Teams/TeamId/Apps/AppId/layout/server/fetch-app-env";

type Params = {
  teamId?: string;
  appId?: string;
};

type AppIdLayoutProps = {
  params: Params;
  children: ReactNode;
};

export const AppIdLayout = async (props: AppIdLayoutProps) => {
  const params = props.params;
  let isOnChainApp = false;
  let hasLegacyActions = false;
  let hasRpRegistration = false;
  let isStagingApp = false;

  // Authorize against the database (the session cookie's `memberships` is not a
  // trustworthy authorization source). Reading an app requires membership in
  // the app's owning team.
  if (!params.appId || !(await getIsUserAllowedToReadApp(params.appId))) {
    return <ErrorPage statusCode={404} title="App not found" />;
  }

  if (params.appId) {
    try {
      const { app, action } = await fetchAppEnvCached(params.appId);

      if (app?.[0]) {
        isOnChainApp = app[0].engine === EngineType.OnChain;
        hasLegacyActions = action.length > 0;
        hasRpRegistration = app[0].rp_registration.length > 0;
        isStagingApp = app[0].is_staging;
      } else {
        logger.warn("AppIdLayout could not resolve app from FetchAppEnv", {
          appId: params.appId,
          teamId: params.teamId,
        });
        return <ErrorPage statusCode={404} title="App not found" />;
      }
    } catch (error) {
      logger.error("AppIdLayout FetchAppEnv failed", {
        error,
        appId: params.appId,
        teamId: params.teamId,
      });
      return <ErrorPage statusCode={500} title="Failed to load app" />;
    }
  }

  // World ID 4.0 rollout is no longer gated by a team feature flag. The tab is
  // available by default, still subject to real-state product guards: staging
  // apps don't get the tab unless they already have an RP registration.
  const showWorldId40Nav = !isStagingApp || hasRpRegistration;

  return (
    <AppIdChrome
      params={params}
      isOnChainApp={isOnChainApp}
      showWorldId40Nav={showWorldId40Nav}
      hasRpRegistration={hasRpRegistration}
      hasLegacyActions={hasLegacyActions}
    >
      {props.children}
    </AppIdChrome>
  );
};
