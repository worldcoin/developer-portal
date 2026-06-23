import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { logger } from "@/lib/logger";
import { Auth0SessionUser } from "@/lib/types";
import { urls } from "@/lib/urls";
import { auth0 } from "@/lib/auth0";
import { redirect } from "next/navigation";

import {
  FetchMembershipsQuery,
  getSdk,
} from "./graphql/server/fetch-memberships.generated";

export const RootPage = async () => {
  const session = await auth0.getSession();
  const auth0User = session?.user as Auth0SessionUser["user"];

  if (!auth0User) {
    return redirect(urls.login());
  }

  // A valid session can still be missing the Hasura claim (e.g. an incomplete
  // or legacy session). Reading `.id` off an undefined `hasura` throws a
  // TypeError, so guard it explicitly and re-authenticate instead of crashing.
  const hasuraUserId = auth0User?.hasura?.id;

  if (!hasuraUserId) {
    logger.warn(
      "Active session is missing a Hasura user id on the root page; logging out to re-authenticate",
    );
    return redirect(urls.logout());
  }

  const client = await getAPIServiceGraphqlClient();
  let membership: FetchMembershipsQuery["membership"] | null = null;

  try {
    const data = await getSdk(client).FetchMemberships({
      userId: hasuraUserId,
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
