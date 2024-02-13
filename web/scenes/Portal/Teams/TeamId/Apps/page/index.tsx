import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { Auth0SessionUser } from "@/lib/types";
import { getSession } from "@auth0/nextjs-auth0";
import { redirect } from "next/navigation";
import { ClientPage } from "./ClientPage";
import { getSdk as getInitialAppSdk } from "./graphql/server/apps.generated";

export const AppsPage = async () => {
  const session = await getSession();
  const user = session?.user as Auth0SessionUser["user"] | undefined;

  if (!user) {
    return redirect("/api/auth/logout");
  }

  const teamId = user.hasura.memberships[0].team?.id;

  if (!teamId) {
    return redirect("/api/auth/logout");
  }
  const client = await getAPIServiceGraphqlClient();

  const { app } = await getInitialAppSdk(client).InitialApp({
    teamId,
  });

  if (app.length > 0) {
    return redirect(`/teams/${teamId}/apps/${app[0].id}`);
  }

  return <ClientPage />;
};
