import { Auth0SessionUser } from "@/lib/types";
import { urls } from "@/lib/urls";
import { auth0 } from "@/lib/auth0";
import { redirect } from "next/navigation";

export const TeamsPage = async () => {
  const session = await auth0.getSession();
  const user = session?.user as Auth0SessionUser["user"];

  if (!user) {
    return redirect(urls.logout());
  }

  // A valid session can still be missing the Hasura claim (incomplete or
  // legacy session). Reading `.memberships` off an undefined `hasura` throws
  // a TypeError, so guard it and re-authenticate instead of crashing.
  const memberships = user.hasura?.memberships;

  if (!memberships) {
    return redirect(urls.logout());
  }

  if (memberships.length === 0) {
    return redirect(urls.createTeam());
  }

  return redirect(urls.teams({ team_id: memberships[0].team?.id }));
};
