import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { ErrorPage } from "@/components/ErrorPage";
import { EngineType } from "@/lib/types";
import { ReactNode } from "react";
import { getSdk as getAppEnv } from "./graphql/server/fetch-app-env.generated";
import { AppIdChrome } from "./AppIdChrome";

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
  const hasRpRegistration = (app[0].rp_registration?.length ?? 0) > 0;
  const hasLegacyActions = action.length > 0;

  return (
    <AppIdChrome
      params={params}
      isOnChainApp={isOnChainApp}
      hasRpRegistration={hasRpRegistration}
      hasLegacyActions={hasLegacyActions}
    >
      {props.children}
    </AppIdChrome>
  );
};
