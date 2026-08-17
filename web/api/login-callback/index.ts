import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";

import { auth0 } from "@/lib/auth0";

import { NextRequest, NextResponse } from "next/server";

import { logger } from "@/lib/logger";
import { Auth0User } from "@/lib/types";
import { urls } from "@/lib/urls";
import { findHasuraUser, HasuraSessionUser } from "../helpers/find-hasura-user";
import { isEmailUser } from "../helpers/is-email-user";
import { isPasswordUser } from "../helpers/is-password-user";
import { getAppUrlFromRequest } from "../helpers/utils";
import { getSdk as updateUserSdk } from "./graphql/update-user.generated";

export const loginCallback = async (req: NextRequest) => {
  const session = await auth0.getSession();
  const appUrl = await getAppUrlFromRequest(req);

  if (!session) {
    logger.warn("No session found in auth0Login callback.");
    return NextResponse.redirect(new URL("/login", appUrl), 307);
  }

  const client = await getAPIServiceGraphqlClient();
  const auth0User = session.user as Auth0User;

  // NOTE: All users from Auth0 should have verified emails as we only use email OTP for authentication, but this is a sanity check
  if (
    (isEmailUser(auth0User) || isPasswordUser(auth0User)) &&
    !auth0User.email_verified
  ) {
    logger.error(
      `Received Auth0 authentication request from an unverified email: ${auth0User.sub}`,
    );

    return NextResponse.redirect(
      new URL(urls.logout(), appUrl).toString(),
      307,
    );
  }

  let user: HasuraSessionUser | null | undefined = null;

  try {
    user = await findHasuraUser(client, auth0User);
  } catch (error) {
    logger.error("Error while fetching the Hasura user in login-callback.", {
      error,
      auth0Sub: auth0User.sub,
      graphqlResponse: (error as { response?: unknown })?.response,
    });

    return NextResponse.redirect(
      new URL(urls.logout(), appUrl).toString(),
      307,
    );
  }

  const invite_id = req.nextUrl.searchParams.get("invite_id") as string;

  if (!user) {
    // No matching Hasura user. The user is being routed to onboarding
    // (create-team or join-callback). Log this so we can correlate when
    // /api/create-team subsequently fails on a uniqueness violation.
    logger.warn("login-callback: no Hasura user found, routing to onboarding", {
      auth0Sub: auth0User.sub,
      hasInvite: Boolean(invite_id),
      authMethod: isEmailUser(auth0User)
        ? "email"
        : isPasswordUser(auth0User)
          ? "password"
          : "world_id",
    });

    return NextResponse.redirect(
      new URL(
        invite_id ? urls.joinCallback({ invite_id }) : urls.createTeam(),
        appUrl,
      ).toString(),
      307,
    );
  }

  // ANCHOR: Sync relevant attributes from Auth0 (also sets the user's Auth0Id if not set before)
  const shouldUpdateUserName = auth0User.name && user?.name !== auth0User.name;

  const shouldUpdateUserEmail =
    auth0User.email && user?.email !== auth0User.email;

  const shouldUpdateAuth0UserId = user?.auth0Id !== auth0User.sub;

  const shouldUpdateUserData =
    shouldUpdateUserName || shouldUpdateUserEmail || shouldUpdateAuth0UserId;

  if (user && shouldUpdateUserData) {
    try {
      const userData = await updateUserSdk(client).UpdateUser({
        id: user.id,
        _set: {
          ...(shouldUpdateAuth0UserId ? { auth0Id: auth0User.sub } : {}),
          ...(shouldUpdateUserName ? { name: auth0User.name } : {}),
          ...(shouldUpdateUserEmail ? { email: auth0User.email } : {}),
        },
      });

      if (!userData) {
        throw new Error(`Error while updating user: ${user.id}`);
      }

      user = userData?.update_user_by_pk;
    } catch (error) {
      logger.error("Error while updating user for UpdateUserSdk.", {
        error,
      });

      return NextResponse.redirect(
        new URL(urls.logout(), appUrl).toString(),
        307,
      );
    }
  }

  const teamId = user?.memberships[0]?.team.id;
  const rawReturnTo = req.nextUrl.searchParams.get("returnTo");
  let returnTo: string | null = null;

  if (rawReturnTo) {
    try {
      const appOrigin = new URL(appUrl).origin;
      const resolved = new URL(rawReturnTo, appUrl);
      if (resolved.origin === appOrigin) {
        returnTo = resolved.pathname + resolved.search + resolved.hash;
      }
    } catch {
      // invalid URL — leave returnTo as null
    }
  }

  let url: string;

  if (invite_id) {
    // Joining a team is a state change, so it needs the user's explicit consent
    // and must not happen on this GET. The Auth0 session cookie is SameSite=Lax,
    // which the browser attaches to any cross-site *top-level navigation*, and
    // unlike `delete-account` this handler cannot demand
    // `Sec-Fetch-Site: same-origin`: it is legitimately reached as the tail of
    // the Auth0 redirect chain, so the browser reports `cross-site` on the happy
    // path too. Forward the invite to the consent screen, which consumes it via
    // a same-origin POST the user has to click (HackerOne #3943242).
    url = urls.joinCallback({ invite_id });
  } else if (returnTo) {
    url = returnTo;
  } else if (teamId) {
    url = urls.dashboard();
  } else {
    url = urls.createTeam();
  }

  const res = NextResponse.redirect(new URL(url, appUrl), 307);

  // NOTE: User's internal ID & team_id are used to query Hasura in subsequent requests
  await auth0.updateSession(req, res, {
    ...session,
    user: {
      ...session.user,
      hasura: {
        ...user,
      },
    },
  });

  return res;
};
