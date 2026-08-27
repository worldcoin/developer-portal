import "server-only";

import { Auth0User } from "@/lib/types";
import { GraphQLClient } from "graphql-request";

import {
  FetchEmailUserQuery,
  getSdk as FetchUserByAuth0IdSdk,
} from "./graphql/fetch-email-user.generated";

import {
  FetchNullifierUserQuery,
  getSdk as FetchUserByNullifierSdk,
} from "./graphql/fetch-nullifier-user.generated";

import { isEmailUser } from "./is-email-user";
import { isPasswordUser } from "./is-password-user";

/**
 * The Hasura `user` row shape both auth callbacks put on the session as
 * `session.user.hasura`.
 */
export type HasuraSessionUser =
  | FetchEmailUserQuery["userByAuth0Id"][number]
  | FetchEmailUserQuery["userByEmail"][number]
  | FetchNullifierUserQuery["user"][number];

/**
 * Resolve the Hasura `user` row backing an Auth0 identity, or `null` when this
 * identity has not been onboarded yet.
 *
 * Shared by `login-callback` and `join-callback` on purpose: both have to answer
 * "does this Auth0 session already have a user row?" and they must answer it
 * identically. If they disagree, `join-callback` either inserts a duplicate row
 * for a user who already exists (which then trips the uniqueness violation
 * `create-team` logs about) or refuses to onboard a genuinely new one.
 *
 * Throws on a transport error, and on the "more than one row for this identity"
 * invariant violation — callers decide how that surfaces.
 */
export const findHasuraUser = async (
  client: GraphQLClient,
  auth0User: Auth0User,
): Promise<HasuraSessionUser | null> => {
  // ANCHOR: User is authenticated through Sign in with World ID
  if (!isEmailUser(auth0User) && !isPasswordUser(auth0User)) {
    const nullifier = auth0User.sub.split("|")[2];

    const userData = await FetchUserByNullifierSdk(client).FetchNullifierUser({
      world_id_nullifier: nullifier,
      auth0Id: auth0User.sub,
    });

    if (!userData) {
      throw new Error("Error while fetching user for FetchUserByNullifierSdk.");
    }

    if (userData.user.length > 1) {
      // NOTE: Edge case may occur if there's a migration error from legacy users, this will require manual handling.
      throw new Error(
        `Auth migration error, more than one user found for nullifier_hash: ${nullifier} & auth0Id: ${auth0User.sub}`,
      );
    }

    return userData.user[0] ?? null;
  }

  // ANCHOR: User is authenticated through email OTP or email & password
  const userData = await FetchUserByAuth0IdSdk(client).FetchEmailUser({
    auth0Id: auth0User.sub,
    email: auth0User.email,
  });

  // An `auth0Id` match is authoritative. The email fallback links a legacy row
  // whose `auth0Id` was never set to the identity now signing in.
  return userData.userByAuth0Id[0] ?? userData.userByEmail[0] ?? null;
};
