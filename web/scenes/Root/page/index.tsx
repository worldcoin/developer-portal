import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { logger } from "@/lib/logger";
import { Auth0SessionUser } from "@/lib/types";
import { urls } from "@/lib/urls";
import { getSession } from "@auth0/nextjs-auth0";
import { redirect } from "next/navigation";

import {
  FetchMembershipsQuery,
  getSdk,
} from "./graphql/server/fetch-memberships.generated";

export const RootPage = async () => {
  const session = await getSession();
  const auth0User = session?.user as Auth0SessionUser["user"];

  if (!auth0User) {
    return redirect(urls.login());
  }

  const client = await getAPIServiceGraphqlClient();
  let membership: FetchMembershipsQuery["membership"] | null = null;

  try {
    const data = await getSdk(client).FetchMemberships({
      userId: auth0User?.hasura.id,
    });

    membership = data.membership;
  } catch (error) {
    logger.error(
      "Error fetching memberships on root page with active session",
      { error },
    );

    return redirect(urls.logout());
  }

  if (!membership || membership.length === 0) {
    return redirect(urls.createTeam());
  }

  const team_id = membership[0].team_id;
  return redirect(urls.apps({ team_id }));
};

