import { Role_Enum } from "@/graphql/graphql";
import {
  Color,
  calculateColorFromString,
} from "@/lib/calculate-color-from-string";
import { Auth0SessionUser } from "@/lib/types";
import { auth0 } from "@/lib/auth0";
import { checkUserPermissions } from "@/lib/utils";
import { urls } from "@/lib/urls";
import { redirect } from "next/navigation";
import { ReactNode } from "react";
import { AppSwitcherContainer } from "./AppSwitcherContainer";
import { ShellFrame } from "./ShellFrame";
import { SidebarNav } from "./SidebarNav";
import { TeamSwitcher, TeamSwitcherTeam } from "./TeamSwitcher";
import { UserPopup } from "./UserPopup";

const toPortalTeams = (user: Auth0SessionUser["user"]): TeamSwitcherTeam[] =>
  (user?.hasura?.memberships ?? [])
    .map((membership) => membership.team)
    .filter((team): team is NonNullable<typeof team> => Boolean(team?.id))
    .map((team) => ({ id: team.id, name: team.name ?? "Untitled team" }));

export const V3Shell = async (props: {
  teamId?: string;
  children: ReactNode;
}) => {
  const session = await auth0.getSession();
  if (!session) {
    redirect(urls.login());
  }

  const user = session.user as Auth0SessionUser["user"];
  const color = calculateColorFromString(
    user?.name ?? user?.email ?? user?.sid,
  ) as Color | null;
  const teams = toPortalTeams(user);
  const currentTeam = teams.find((team) => team.id === props.teamId);

  const canSeeApiKeys = checkUserPermissions(user, props.teamId ?? "", [
    Role_Enum.Owner,
    Role_Enum.Admin,
  ]);
  const canSeeSettings = checkUserPermissions(user, props.teamId ?? "", [
    Role_Enum.Owner,
  ]);

  return (
    <ShellFrame
      header={<AppSwitcherContainer />}
      sidebar={
        <>
          {currentTeam ? (
            <TeamSwitcher currentTeam={currentTeam} teams={teams} />
          ) : null}
          <SidebarNav
            canSeeApiKeys={canSeeApiKeys}
            canSeeSettings={canSeeSettings}
          />
          <div className="border-t border-border p-2">
            <UserPopup
              color={color}
              user={{
                name: user?.name ?? user?.email ?? "Account",
                email: user?.email,
              }}
            />
          </div>
        </>
      }
    >
      {props.children}
    </ShellFrame>
  );
};
