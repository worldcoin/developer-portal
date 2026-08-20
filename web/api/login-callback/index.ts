import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";

import { auth0 } from "@/lib/auth0";

import { NextRequest, NextResponse } from "next/server";

import {
  FetchNullifierUserQuery,
  getSdk as FetchUserByNullifierSdk,
} from "./graphql/fetch-nullifier-user.generated";

import {
  FetchEmailUserQuery,
  getSdk as FetchUserByAuth0IdSdk,
} from "./graphql/fetch-email-user.generated";

import { logger } from "@/lib/logger";
import { Auth0User } from "@/lib/types";
import { urls } from "@/lib/urls";
import { isEmailUser } from "../helpers/is-email-user";
import { isPasswordUser } from "../helpers/is-password-user";
import { getAppUrlFromRequest } from "../helpers/utils";
import { getSdk as updateUserSdk } from "./graphql/update-user.generated";

const inviteIdFromJoinReturnTo = (
  rawReturnTo: string | null,
  appUrl: string,
): string | null => {
  if (!rawReturnTo) {
    return null;
  }

  try {
    const resolved = new URL(rawReturnTo, appUrl);
    if (resolved.pathname === "/join") {
      return resolved.searchParams.get("invite_id");
    }
  } catch {
    // ignore invalid returnTo
  }

  return null;
};

export const loginCallback = async (req: NextRequest) => {
  const session = await auth0.getSession();
  const appUrl = await getAppUrlFromRequest(req);

  if (!session) {
    logger.warn("No session found in auth0Login callback.");
    return NextResponse.redirect(new URL("/login", appUrl), 307);
  }

  const client = await getAPIServiceGraphqlClient();
  const auth0User = session.user as Auth0User;

  let user:
    | FetchEmailUserQuery["userByAuth0Id"][number]
    | FetchEmailUserQuery["userByEmail"][number]
    | FetchNullifierUserQuery["user"][number]
    | null
    | undefined = null;

  // ANCHOR: User is authenticated through Sign in with World ID
  if (!isEmailUser(auth0User) && !isPasswordUser(auth0User)) {
    const nullifier = auth0User.sub.split("|")[2];

    try {
      const userData = await FetchUserByNullifierSdk(client).FetchNullifierUser(
        {
          world_id_nullifier: nullifier,
          auth0Id: auth0User.sub,
        },
      );

      if (!userData) {
        throw new Error(
          "Error while fetching user for FetchUserByNullifierSdk.",
        );
      }

      if (userData.user.length === 1) {
        user = userData.user[0];
      } else if (userData.user.length > 1) {
        // NOTE: Edge case may occur if there's a migration error from legacy users, this will require manual handling.
        throw new Error(
          `Auth migration error, more than one user found for nullifier_hash: ${nullifier} & auth0Id: ${auth0User.sub}`,
        );
      }
    } catch (error) {
      logger.error(`Error while fetching user for FetchUserByNullifierSdk.`, {
        error,
        graphqlResponse: (error as { response?: unknown })?.response,
      });

      return NextResponse.redirect(
        new URL(urls.logout(), appUrl).toString(),
        307,
      );
    }
  }

  // ANCHOR: User is authenticated through email OTP or email & password
  else if (isEmailUser(auth0User) || isPasswordUser(auth0User)) {
    // NOTE: All users from Auth0 should have verified emails as we only use email OTP for authentication, but this is a sanity check
    if (!auth0User.email_verified) {
      logger.error(
        `Received Auth0 authentication request from an unverified email: ${auth0User.sub}`,
      );

      return NextResponse.redirect(
        new URL(urls.logout(), appUrl).toString(),
        307,
      );
    }

    try {
      const userData = await FetchUserByAuth0IdSdk(client).FetchEmailUser({
        auth0Id: auth0User.sub,
        email: auth0User.email,
      });

      if (userData.userByAuth0Id.length > 0) {
        user = userData.userByAuth0Id[0];
      }

      if (
        userData.userByAuth0Id.length === 0 &&
        userData.userByEmail.length > 0
      ) {
        user = userData.userByEmail[0];
      }
    } catch (error) {
      logger.error("Error while fetching user for FetchUserByAuth0IdSdk.", {
        error,
        graphqlResponse: (error as { response?: unknown })?.response,
      });

      return NextResponse.redirect(
        new URL(urls.logout(), appUrl).toString(),
        307,
      );
    }
  }

  const invite_id =
    req.nextUrl.searchParams.get("invite_id") ??
    inviteIdFromJoinReturnTo(req.nextUrl.searchParams.get("returnTo"), appUrl);

  if (!user) {
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
        invite_id ? urls.join({ invite_id }) : urls.createTeam(),
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
  let url: string = urls.profile();
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

  if (invite_id) {
    url = urls.join({ invite_id });
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
