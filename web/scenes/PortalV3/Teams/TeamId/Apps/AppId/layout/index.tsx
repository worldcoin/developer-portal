import { ErrorPage } from "@/components/ErrorPage";
import { logger } from "@/lib/logger";
import { Auth0SessionUser } from "@/lib/types";
import { auth0 } from "@/lib/auth0";
import { fetchAppEnvCached } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/layout/server/fetch-app-env";
import { ReactNode } from "react";

type Params = {
  teamId?: string;
  appId?: string;
};

export const AppIdLayoutV3 = async (props: {
  params: Params;
  children: ReactNode;
}) => {
  const params = props.params;
  const session = await auth0.getSession();
  const user = session?.user as Auth0SessionUser["user"];
  const isTeamMember = user?.hasura?.memberships?.some(
    (membership) => membership.team?.id === params.teamId,
  );

  if (!isTeamMember) {
    return <ErrorPage statusCode={404} title="App not found" />;
  }

  if (params.appId) {
    try {
      const { app } = await fetchAppEnvCached(params.appId);

      if (!app?.[0]) {
        logger.warn("AppIdLayoutV3 could not resolve app from FetchAppEnv", {
          appId: params.appId,
          teamId: params.teamId,
        });
        return <ErrorPage statusCode={404} title="App not found" />;
      }
    } catch (error) {
      logger.error("AppIdLayoutV3 FetchAppEnv failed", {
        error,
        appId: params.appId,
        teamId: params.teamId,
      });
      return <ErrorPage statusCode={500} title="Failed to load app" />;
    }
  }

  return <>{props.children}</>;
};
