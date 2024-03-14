import { Auth0SessionUser } from "@/lib/types";
import { urls } from "@/lib/urls";
import { getSession } from "@auth0/nextjs-auth0";
import { redirect } from "next/navigation";

export const TeamsPage = async () => {
  const session = await getSession();
  const user = session?.user as Auth0SessionUser["user"];

  if (!user) {
    return redirect(urls.logout());
  }

  const memberships = user.hasura.memberships;

  if (memberships.length === 0) {
    return redirect(urls.createTeam());
  }

  return redirect(urls.teams({ team_id: memberships[0].team?.id }));
};

