import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { isWorldId40EnabledServer } from "@/lib/feature-flags/world-id-4-0/server";
import { EngineType } from "@/lib/types";
import { logger } from "@/lib/logger";
import { ReactNode } from "react";
import { AppIdChrome } from "./AppIdChrome";
import { getSdk as getAppEnv } from "./graphql/server/fetch-app-env.generated";

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

  if (params.appId) {
    try {
      const client = await getAPIServiceGraphqlClient();
      const { app, action } = await getAppEnv(client).FetchAppEnv({
        id: params.appId,
      });

      if (app?.[0]) {
        isOnChainApp = app[0].engine === EngineType.OnChain;
        hasLegacyActions = action.length > 0;
      } else {
        logger.warn("AppIdLayout could not resolve app from FetchAppEnv", {
          appId: params.appId,
          teamId: params.teamId,
        });
      }
    } catch (error) {
      logger.error("AppIdLayout FetchAppEnv failed", {
        error,
        appId: params.appId,
        teamId: params.teamId,
      });
    }
  }

  const showWorldId40Nav = await isWorldId40EnabledServer(params.teamId);

  return (
    <AppIdChrome
      params={params}
      isOnChainApp={isOnChainApp}
      showWorldId40Nav={showWorldId40Nav}
      hasLegacyActions={hasLegacyActions}
    >
      {props.children}
    </AppIdChrome>
  );
};
