import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { ErrorPage } from "@/components/ErrorPage";
import { isWorldId40EnabledServer } from "@/lib/feature-flags/world-id-4-0/server";
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
  const isWorldId40Enabled = await isWorldId40EnabledServer(params.teamId);
  const showWorldId40Nav =
    isWorldId40Enabled && (app[0].rp_registration?.length ?? 0) > 0;

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
