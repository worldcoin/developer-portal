import { ErrorPage } from "@/components/ErrorPage";
import { auth0 } from "@/lib/auth0";
import { logger } from "@/lib/logger";
import { Auth0SessionUser } from "@/lib/types";
import { fetchAppEnvCached } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/layout/server/fetch-app-env";
import { ReactNode } from "react";

type Params = { teamId?: string; appId?: string };

/**
 * v3 app-scope layout. Access/data guard is copied VERBATIM from the v2
 * AppIdLayout for parity; the only change is rendering {children} instead of
 * <AppIdChrome> — the v3 shell (mounted at the team layer) supplies all chrome.
 *
 * SECURITY — KNOWN IDOR, copied bug-for-bug from v2 (MUST be fixed before any
 * production flip of the v3 flag): the guard only checks team membership, not
 * that params.appId belongs to params.teamId, and fetchAppEnvCached resolves
 * the app unscoped to the team. Tracked as a hard pre-prod-flip gate; fix in the
 * shared fetch/guard so v2 is fixed too.
 */
export const AppIdLayout = async (props: {
  params: Params;
  children: ReactNode;
}) => {
  const { params } = props;
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
        logger.warn("AppIdLayout(v3) could not resolve app from FetchAppEnv", {
          appId: params.appId,
          teamId: params.teamId,
        });
        return <ErrorPage statusCode={404} title="App not found" />;
      }
    } catch (error) {
      logger.error("AppIdLayout(v3) FetchAppEnv failed", {
        error,
        appId: params.appId,
        teamId: params.teamId,
      });
      return <ErrorPage statusCode={500} title="Failed to load app" />;
    }
  }

  return <>{props.children}</>;
};
