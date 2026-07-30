import { Role_Enum } from "@/graphql/graphql";
import { auth0 } from "@/lib/auth0";
import { Auth0SessionUser } from "@/lib/types";
import { urls } from "@/lib/urls";
import { resolveInitialAppId } from "@/scenes/common/Teams/TeamId/Apps/server/resolve-initial-app";
import { redirect } from "next/navigation";
import { AppsPageClient } from "./AppsPageClient";

type AppsPageProps = {
  params: Promise<Record<string, string>>;
};

export const AppsPage = async (props: AppsPageProps) => {
  const session = await auth0.getSession();
  const params = await props.params;
  const teamId = params?.teamId;
  const user = session?.user as Auth0SessionUser["user"] | undefined;

  if (!user || !teamId) {
    return redirect("/api/auth/logout");
  }

  const memberships = user.hasura?.memberships ?? [];

  if (!memberships.find((membership) => membership.team?.id === teamId)) {
    const redirectTeamId = memberships[0]?.team?.id;

    // No teams left (e.g. last one just deleted): keep them in the portal on
    // their profile instead of logging out.
    return redirect(
      redirectTeamId ? `/teams/${redirectTeamId}/apps` : urls.profile(),
    );
  }

  const appId = await resolveInitialAppId({
    teamId,
    userId: user.hasura.id,
  });

  if (appId) {
    return redirect(urls.worldId40({ team_id: teamId, app_id: appId }));
  }

  return (
    <AppsPageClient
      teamId={teamId}
      initialIsOwner={memberships.some(
        (membership) =>
          membership.team?.id === teamId && membership.role === Role_Enum.Owner,
      )}
    />
  );
};
