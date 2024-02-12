import { Auth0SessionUser } from "@/lib/types";
import { getSession } from "@auth0/nextjs-auth0";
import { redirect } from "next/navigation";

export const RootPage = async () => {
  const session = await getSession();
  const user = session?.user as Auth0SessionUser["user"];

  if (!user) {
    return redirect("/login");
  }

  const team_id = user.hasura?.memberships[0].team?.id;

  if (!team_id) {
    return redirect("/profile");
  }

  return redirect(`/teams/${team_id}/apps`);
};
