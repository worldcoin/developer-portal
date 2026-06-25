import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { auth0, toSessionRequest } from "@/lib/auth0";
import { logger } from "@/lib/logger";

import { NextRequest, NextResponse } from "next/server";

import { getSdk as getFetchUserForSessionSdk } from "./graphql/server/fetch-user-for-session.generated";

// Refreshes the caller's sealed session with their latest Hasura profile.
//
// The session's Hasura claims — crucially `memberships`, which downstream
// authorization and route-gating read — are re-derived server-side from the
// database using the verified session user id. The request body is NOT trusted:
// any authenticated user could otherwise forge team membership by POSTing a
// crafted `user.memberships` array.
export const POST = async (req: NextRequest) => {
  const res = NextResponse.json({ success: true });
  // Body-free request for the Auth0 SDK (see toSessionRequest): on Next 16 the
  // SDK re-wraps + copies the request body, which throws.
  const sessionReq = toSessionRequest(req);
  const session = await auth0.getSession(sessionReq);

  if (!session) {
    return NextResponse.json({ success: false }, { status: 401 });
  }

  const userId = session.user.hasura.id;

  let response;
  try {
    response = await getFetchUserForSessionSdk(
      await getAPIServiceGraphqlClient(),
    ).FetchUserForSession({ userId });
  } catch (error) {
    logger.error("Failed to refresh session: error fetching user", {
      error,
      userId,
    });
    return NextResponse.json({ success: false }, { status: 500 });
  }

  const user = response.user_by_pk;

  if (!user) {
    logger.warn("Failed to refresh session: user not found", { userId });
    return NextResponse.json({ success: false }, { status: 401 });
  }

  await auth0.updateSession(sessionReq, res, {
    ...session,
    user: {
      ...session.user,
      hasura: user,
    },
  });

  return res;
};
