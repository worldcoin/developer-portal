import { ErrorPage } from "@/components/ErrorPage";
import { isWorldId40EnabledServer } from "@/lib/feature-flags/world-id-4-0/server";
import { logger } from "@/lib/logger";
import { Auth0SessionUser, EngineType } from "@/lib/types";
import { getSession } from "@auth0/nextjs-auth0";
import { ReactNode } from "react";
import { AppIdChrome } from "./AppIdChrome";
import { fetchAppEnvCached } from "./server/fetch-app-env";

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
  let hasDraftVersion = false;
  let hasVerifiedVersion = false;
  let hasDraftMiniApp = false;
  let hasVerifiedMiniApp = false;

  const session = await getSession();
  const user = session?.user as Auth0SessionUser["user"];
  const isTeamMember = user?.hasura?.memberships?.some(
    (membership) => membership.team?.id === params.teamId,
  );

  if (!isTeamMember) {
    return <ErrorPage statusCode={404} title="App not found" />;
  }

  if (params.appId) {
    try {
      const { app, action } = await fetchAppEnvCached(params.appId);

      if (app?.[0]) {
        isOnChainApp = app[0].engine === EngineType.OnChain;
        hasLegacyActions = action.length > 0;
        hasRpRegistration = app[0].rp_registration.length > 0;
        hasDraftVersion = app[0].app_metadata.length > 0;
        hasVerifiedVersion = app[0].verified_app_metadata.length > 0;
        hasDraftMiniApp = app[0].app_metadata[0]?.app_mode === "mini-app";
        hasVerifiedMiniApp =
          app[0].verified_app_metadata[0]?.app_mode === "mini-app";
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

  const showWorldId40Nav = await isWorldId40EnabledServer(params.teamId);

  return (
    <AppIdChrome
      params={params}
      isOnChainApp={isOnChainApp}
      showWorldId40Nav={showWorldId40Nav}
      hasRpRegistration={hasRpRegistration}
      hasLegacyActions={hasLegacyActions}
      hasDraftVersion={hasDraftVersion}
      hasVerifiedVersion={hasVerifiedVersion}
      hasDraftMiniApp={hasDraftMiniApp}
      hasVerifiedMiniApp={hasVerifiedMiniApp}
    >
      {props.children}
    </AppIdChrome>
  );
};
