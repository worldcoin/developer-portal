import { auth0 } from "@/lib/auth0";
import { Auth0SessionUser } from "@/lib/types";
import { urls } from "@/lib/urls";
import { getLatestTeamId } from "@/scenes/PortalV3/Dashboard/server/latest-team";
import { redirect } from "next/navigation";

export const DashboardPage = async () => {
  const session = await auth0.getSession();
  const user = session?.user as Auth0SessionUser["user"] | undefined;
  const userId = user?.hasura?.id;
  const memberships = user?.hasura?.memberships;

  if (!userId || !memberships) {
    return redirect(urls.logout());
  }

  const teamIds = memberships
    .map((membership) => membership.team?.id)
    .filter((teamId): teamId is string => Boolean(teamId));

  if (teamIds.length === 0) {
    return redirect(urls.createTeam());
  }

  // Redis is only a cross-device navigation preference. The current session's
  // memberships remain the source of truth for where this user may go.
  const latestTeamId = await getLatestTeamId(userId);

  // A missing or stale preference falls back deterministically, so Redis
  // latency or failure never blocks entry to the portal.
  const destinationTeamId =
    latestTeamId && teamIds.includes(latestTeamId) ? latestTeamId : teamIds[0];

  // Stop at the first-class team overview. App choice stays visible there
  // instead of becoming a second persisted navigation preference.
  return redirect(urls.teams({ team_id: destinationTeamId }));
};
