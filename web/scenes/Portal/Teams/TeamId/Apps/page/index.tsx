import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { Auth0SessionUser } from "@/lib/types";
import { getSession } from "@auth0/nextjs-auth0";
import { redirect } from "next/navigation";
import { AppsPageClient } from "./AppsPageClient";
import { getSdk as getInitialAppSdk } from "./graphql/server/apps.generated";

type AppPage = {
  params: Record<string, string> | null | undefined;
};

export const AppsPage = async (props: AppPage) => {
  const session = await getSession();
  const teamId = props.params?.teamId;
  const user = session?.user as Auth0SessionUser["user"] | undefined;

  if (!user) {
    return redirect("/api/auth/logout");
  }

  if (!teamId) {
    return redirect("/api/auth/logout");
  }

  // If user tries to access another team's app, redirect to the their own.
  if (!user.hasura.memberships.find((m) => m.team?.id === teamId)) {
    const redirectTeamId = user.hasura.memberships[0]?.team?.id;
    return redirect(`/teams/${redirectTeamId}/apps`);
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
