import { ErrorPage } from "@/components/ErrorPage";
import { logger } from "@/lib/logger";
import { Auth0SessionUser } from "@/lib/types";
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
  let hasLegacyActions = false;
  let hasRpRegistration = false;

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
        hasLegacyActions = action.length > 0;
        hasRpRegistration = app[0].rp_registration.length > 0;
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

  return (
    <AppIdChrome
      params={params}
      hasRpRegistration={hasRpRegistration}
      hasLegacyActions={hasLegacyActions}
    >
      {props.children}
    </AppIdChrome>
  );
};
