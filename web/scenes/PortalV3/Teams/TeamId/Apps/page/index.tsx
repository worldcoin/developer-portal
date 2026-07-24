import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { auth0 } from "@/lib/auth0";
import { Auth0SessionUser } from "@/lib/types";
import { urls } from "@/lib/urls";
import { getSdk as getInitialAppSdk } from "@/scenes/Portal/Teams/TeamId/Apps/page/graphql/server/apps.generated";
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

    // No teams left (e.g. last one just deleted): send to onboarding instead of logging out.
    return redirect(
      redirectTeamId ? `/teams/${redirectTeamId}/apps` : urls.createTeam(),
    );
  }

  const client = await getAPIServiceGraphqlClient();
  const { app } = await getInitialAppSdk(client).InitialApp({ teamId });

  if (app.length > 0) {
    return redirect(`/teams/${teamId}/apps/${app[0].id}/world-id-4-0`);
  }

  return <AppsPageClient teamId={teamId} />;
};
