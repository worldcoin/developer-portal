import {
  getSession,
  updateSession,
  withApiAuthRequired,
} from "@auth0/nextjs-auth0";

import { NextApiRequest, NextApiResponse } from "next";
import { errorResponse } from "src/backend/errors";

import {
  FetchNullifierUserQuery,
  getSdk as FetchUserByNullifierSdk,
} from "./graphql/fetch-nullifier-user.generated";

import {
  FetchEmailUserQuery,
  getSdk as FetchUserByAuth0IdSdk,
} from "./graphql/fetch-email-user.generated";

import { getAPIServiceGraphqlClient } from "src/backend/graphql";
import { urls } from "src/lib/urls";
import { getSdk as updateUserSdk } from "./graphql/update-user.generated";
import { Auth0User } from "src/lib/types";
import { isEmailUser } from "src/lib/utils";

export const auth0Login = withApiAuthRequired(
  async (req: NextApiRequest, res: NextApiResponse) => {
    const session = await getSession(req, res);

    if (!session) {
      console.error("No session found in auth0Login callback");

      return errorResponse(
        res,
        500,
        "internal_server_error",
        "Something went wrong",
        null,
        req
      );
    }

    const client = await getAPIServiceGraphqlClient();
    const auth0User = session.user as Auth0User;

    let user:
      | FetchEmailUserQuery["userByAuth0Id"][number]
      | FetchEmailUserQuery["userByEmail"][number]
      | FetchNullifierUserQuery["user"][number]
      | null
      | undefined = null;

    if (!isEmailUser(auth0User)) {
      const nullifier = auth0User.sub.split("|")[2];

      try {
        const userData = await FetchUserByNullifierSdk(
          client
        ).FetchNullifierUser({
          world_id_nullifier: nullifier,
          auth0Id: auth0User.sub,
        });

        if (!userData) {
          throw new Error(
            `Error while fetching user by nullifier: ${nullifier}`
          );
        }

        user = userData?.user[0];
      } catch (error) {
        console.error(error);
        return res.redirect(307, urls.logout({ error: true }));
      }
    }

    if (isEmailUser(auth0User) && !auth0User.email_verified) {
      return res.redirect(307, urls.logout({ error: true }));
    }

    if (isEmailUser(auth0User)) {
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
        console.error(error);
        return res.redirect(307, urls.logout({ error: true }));
      }
    }

    if (!user) {
      return res.status(200).redirect("/signup");
    }

    if (user && !user.auth0Id) {
      try {
        const userData = await updateUserSdk(client).UpdateUser({
          id: user.id,
          _set: {
            auth0Id: auth0User.sub,
          },
        });

        if (!userData) {
          throw new Error(`Error while adding auth0Id to user: ${user.id}`);
        }

        user = userData?.update_user_by_pk;
      } catch (error) {
        console.error(error);
        return res.redirect(307, urls.logout({ error: true }));
      }
    }

    const shouldUpdateUserName =
      auth0User.name && user?.name !== auth0User.name;

    const shouldUpdateUserEmail =
      auth0User.email && user?.email !== auth0User.email;

    const shouldUpdateUserData = shouldUpdateUserName || shouldUpdateUserEmail;

    if (user && shouldUpdateUserData) {
      try {
        const userData = await updateUserSdk(client).UpdateUser({
          id: user.id,
          _set: {
            ...(shouldUpdateUserName ? { name: auth0User.name } : {}),
            ...(shouldUpdateUserEmail ? { email: auth0User.email } : {}),
          },
        });

        if (!userData) {
          throw new Error(`Error while updating user: ${user.id}`);
        }

        user = userData?.update_user_by_pk;
      } catch (error) {
        console.error(error);
        return res.redirect(307, urls.logout({ error: true }));
      }
    }

    // NOTE: User's internal ID & team_id are used to query Hasura in subsequent requests
    await updateSession(req, res, {
      ...session,
      user: {
        ...session.user,
        hasura: {
          ...user,
        },
      },
    });

    return res.redirect(307, urls.app());
  }
);
