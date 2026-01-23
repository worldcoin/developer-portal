import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { Auth0SessionUser } from "@/lib/types";
import { getSession } from "@auth0/nextjs-auth0";
import { redirect } from "next/navigation";
import { ClientPage } from "./ClientPage";
import { NewClientPage } from "./NewClientPage";
import { getSdk as getInitialAppSdk } from "./graphql/server/apps.generated";

type AppPage = {
  params: Record<string, string> | null | undefined;
};

const USE_NEW_PAGE = process.env.NEXT_PUBLIC_USE_NEW_APPS_PAGE === "true";

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

  return USE_NEW_PAGE ? <NewClientPage /> : <ClientPage />;
};
