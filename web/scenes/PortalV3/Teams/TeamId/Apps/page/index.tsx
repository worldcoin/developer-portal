import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { Auth0SessionUser } from "@/lib/types";
import { auth0 } from "@/lib/auth0";
import { redirect } from "next/navigation";
import { AppsPageClient } from "./AppsPageClient";
import { getSdk as getInitialAppSdk } from "@/scenes/common/Teams/TeamId/Apps/page/graphql/server/apps.generated";

type AppPage = {
  params: Promise<Record<string, string>>;
};

export const AppsPage = async (props: AppPage) => {
  const session = await auth0.getSession();
  const params = await props.params;
  const teamId = params?.teamId;
  const user = session?.user as Auth0SessionUser["user"] | undefined;

  if (!user) {
    return redirect("/api/auth/logout");
  }

  if (!teamId) {
    return redirect("/api/auth/logout");
  }

  const memberships = user.hasura?.memberships ?? [];

  // If user tries to access another team's app, redirect to the their own.
  if (!memberships.find((m) => m.team?.id === teamId)) {
    const redirectTeamId = memberships[0]?.team?.id;
    return redirect(
      redirectTeamId ? `/teams/${redirectTeamId}/apps` : "/api/auth/logout",
    );
  }

  const client = await getAPIServiceGraphqlClient();

  const { app } = await getInitialAppSdk(client).InitialApp({
    teamId,
  });

  if (app.length > 0) {
    return redirect(`/teams/${teamId}/apps/${app[0].id}`);
  }

  // Use new app creation flow for teams with World ID 4.0 enabled
  return <AppsPageClient teamId={teamId} />;
};
