import { Role_Enum } from "@/graphql/graphql";
import { auth0 } from "@/lib/auth0";
import { calculateColorFromString } from "@/lib/calculate-color-from-string";
import { Auth0SessionUser } from "@/lib/types";
import { urls } from "@/lib/urls";
import { checkUserPermissions } from "@/lib/utils";
import { redirect } from "next/navigation";
import { ReactNode } from "react";
import { AppSwitcherContainer } from "./AppSwitcherContainer";
import { ShellFrame } from "./ShellFrame";
import { SidebarNav } from "./SidebarNav";
import { TeamSwitcher } from "./TeamSwitcher";

/**
 * Async server shell for the authenticated v3 portal. Fetches the session, maps
 * the user's team memberships into the switcher list, and composes the
 * presentational ShellFrame with the team switcher / nav / app-switcher slots.
 *
 * Reuses the SAME session + membership reads v2 already uses (auth0.getSession,
 * user.hasura.memberships) — no new data path. ShellFrame owns the markup +
 * data-testid + ColorInitializer + UserPopup.
 */
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
  );

  const memberships = user?.hasura?.memberships ?? [];
  const teams = memberships
    .map((m) => m.team)
    .filter((t): t is NonNullable<typeof t> => !!t?.id)
    .map((t) => ({ id: t.id, name: t.name ?? "Untitled team" }));
  const currentTeam = teams.find((t) => t.id === props.teamId);

  // Role-gate the team-scope nav items, matching v2's permission model.
  const teamId = props.teamId ?? "";
  const canSeeApiKeys = checkUserPermissions(user, teamId, [
    Role_Enum.Owner,
    Role_Enum.Admin,
  ]);
  const canSeeSettings = checkUserPermissions(user, teamId, [Role_Enum.Owner]);

  return (
    <ShellFrame
      color={color}
      user={
        user
          ? { name: user.name ?? user.email ?? "Account", email: user.email }
          : null
      }
      topSlot={
        currentTeam ? (
          <TeamSwitcher currentTeam={currentTeam} teams={teams} />
        ) : null
      }
      nav={
        <SidebarNav
          canSeeApiKeys={canSeeApiKeys}
          canSeeSettings={canSeeSettings}
        />
      }
      header={<AppSwitcherContainer />}
    >
      {props.children}
    </ShellFrame>
  );
};
