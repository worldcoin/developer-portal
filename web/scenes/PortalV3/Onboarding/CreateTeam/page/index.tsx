import { auth0 } from "@/lib/auth0";
import { Auth0SessionUser } from "@/lib/types";
import { CreateTeamPage as ManualCreateTeamPage } from "@/scenes/Onboarding/CreateTeam/page";
import {
  AutoTeamBootstrap,
  deriveTeamName,
} from "@/scenes/PortalV3/layout/AutoTeamBootstrap";

/**
 * v3 create-team: new users (no memberships) get a personal team created
 * automatically — this is the route login-callback sends them to, so the
 * auto-team must live here, not only in the portal shell. Users who already
 * have a team reached this page on purpose (creating another team) and keep
 * the manual form.
 */
type CreateTeamPageProps = {
  params: Promise<Record<string, string>>;
};

export const CreateTeamPage = async (props: CreateTeamPageProps) => {
  const session = await auth0.getSession();
  const user = session?.user as Auth0SessionUser["user"];
  const hasTeam = (user?.hasura?.memberships ?? []).some((m) => !!m.team?.id);

  if (hasTeam) {
    return <ManualCreateTeamPage params={props.params} />;
  }

  return (
    <AutoTeamBootstrap
      defaultName={deriveTeamName(user)}
      hasUser={!!user?.hasura?.id}
    />
  );
};
