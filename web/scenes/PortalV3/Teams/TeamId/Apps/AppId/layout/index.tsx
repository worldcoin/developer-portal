import { ErrorPage } from "@/components/ErrorPage";
import { auth0 } from "@/lib/auth0";
import { logger } from "@/lib/logger";
import { Auth0SessionUser } from "@/lib/types";
import { fetchAppEnvCached } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/layout/server/fetch-app-env";
import { ReactNode } from "react";

type Params = {
  teamId?: string;
  appId?: string;
};

type AppIdLayoutV3Props = {
  params: Params;
  children: ReactNode;
};

/**
 * v3 app-scope layout. The access/data guard is copied VERBATIM from the v2
 * AppIdLayout for behavior parity; the only change is rendering {children}
 * instead of <AppIdChrome> (the v3 shell from V3Shell supplies all chrome).
 *
 * SECURITY — KNOWN IDOR, copied bug-for-bug from v2 (MUST be fixed before any
 * production flip of the v3 flag): the guard only checks that the user is a
 * member of params.teamId — it does NOT verify that params.appId actually
 * belongs to that team, and fetchAppEnvCached resolves the app via a
 * service-role fetch unscoped to the team. So a member of team A can load an
 * app owned by team B via /teams/A/apps/<B's app>. Tracked as a hard
 * pre-prod-flip gate; do not "fix" here without revisiting the parity decision.
 */
export const AppIdLayoutV3 = async (props: AppIdLayoutV3Props) => {
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

  // The v3 shell (V3Shell, mounted by the teams/[teamId] layout) supplies all
  // chrome, so this layout renders children directly — no AppIdChrome.
  return <>{props.children}</>;
};
