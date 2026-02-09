import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { ErrorPage } from "@/components/ErrorPage";
import { getWorldId40EnabledTeams } from "@/lib/feature-flags/world-id-4-0/server";
import { EngineType } from "@/lib/types";
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
  const client = await getAPIServiceGraphqlClient();
  const { app, action } = await getAppEnv(client).FetchAppEnv({
    id: params.appId ?? "",
  });

  if (!app?.[0]) {
    return <ErrorPage statusCode={404} title="App not found" />;
  }

  const isOnChainApp = app[0].engine === EngineType.OnChain;
  const hasLegacyActions = action.length > 0;

  const enabledTeams = await getWorldId40EnabledTeams();
  const isWorldId40Enabled = enabledTeams.includes(params.teamId ?? "");

  return (
    <AppIdChrome
      params={params}
      isOnChainApp={isOnChainApp}
      isWorldId40Enabled={isWorldId40Enabled}
      hasLegacyActions={hasLegacyActions}
    >
      {props.children}
    </AppIdChrome>
  );
};
