import { auth0 } from "@/lib/auth0";
import { Auth0SessionUser } from "@/lib/types";
import { rememberLatestTeam } from "@/scenes/PortalV3/Dashboard/server/latest-team";
import { AppCreatedToast } from "@/scenes/common/Apps/AppCreatedToast";
import { TeamCreatedToast } from "@/scenes/common/Teams/TeamCreatedToast";
import { after } from "next/server";
import { ReactNode } from "react";

type TeamIdLayoutProps = {
  params: Promise<{ teamId?: string }>;
  children: ReactNode;
};

export const TeamIdLayout = async (props: TeamIdLayoutProps) => {
  const [{ teamId }, session] = await Promise.all([
    props.params,
    auth0.getSession(),
  ]);
  const user = session?.user as Auth0SessionUser["user"] | undefined;
  const userId = user?.hasura?.id;
  const isTeamMember = user?.hasura?.memberships?.some(
    (membership) => membership.team?.id === teamId,
  );

  if (userId && teamId && isTeamMember) {
    // This dynamic layout reruns when a client-side team switch changes teamId.
    // Persist after rendering so remembering a preference never delays the page.
    after(() => rememberLatestTeam(userId, teamId));
  }

  return (
    <>
      <AppCreatedToast />
      <TeamCreatedToast />
      {props.children}
    </>
  );
};
