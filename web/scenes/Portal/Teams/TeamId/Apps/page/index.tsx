import { Auth0SessionUser } from "@/lib/types";
import { auth0 } from "@/lib/auth0";
import { urls } from "@/lib/urls";
import { resolveInitialAppId } from "@/scenes/common/Teams/TeamId/Apps/server/resolve-initial-app";
import { redirect } from "next/navigation";
import { AppsPageClient } from "./AppsPageClient";

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
    return redirect(urls.app({ team_id: teamId, app_id: appId }));
  }

  // Use new app creation flow for teams with World ID 4.0 enabled
  return <AppsPageClient teamId={teamId} />;
};
