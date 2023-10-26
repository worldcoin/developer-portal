import {
  getSession,
  updateSession,
  withApiAuthRequired,
} from "@auth0/nextjs-auth0";
import { NextApiRequest, NextApiResponse } from "next";
import { errorResponse } from "src/backend/errors";

import {
  FetchUserQuery,
  getSdk as fetchUserSdk,
} from "./graphql/fetch-user.generated";

import { getAPIServiceGraphqlClient } from "src/backend/graphql";
import { urls } from "src/lib/urls";
import { getSdk as addAuth0Sdk } from "./graphql/add-auth0.generated";

type Auth0EmailUser = {
  nickname: string;
  name: string;
  picture: string;
  updated_at: string;
  sid: string;
  sub: `email|${string}`;
  email: string;
  email_verified: boolean;
};

type Auth0WorldcoinUser = {
  nickname: string;
  name: string;
  picture: string;
  updated_at: string;
  sid: string;
  sub: `oauth2|worldcoin|${string}`;
  email?: never;
  email_verified?: never;
};

type Auth0User = Auth0EmailUser | Auth0WorldcoinUser;

const isEmailUser = (user: Auth0User): user is Auth0EmailUser =>
  user.sub.startsWith("email|");

const wait = (time: number) =>
  new Promise((resolve) => setTimeout(resolve, time));

export const auth0Login = withApiAuthRequired(
  async (req: NextApiRequest, res: NextApiResponse) => {
    const session = await getSession(req, res);

    if (!session) {
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
    let user: FetchUserQuery["user"][number] | null | undefined = null;

    if (isEmailUser(auth0User) && !auth0User.email_verified) {
      return res.redirect(307, urls.logout({ error: true }));
    }

    if (isEmailUser(auth0User)) {
      try {
        const userData = await fetchUserSdk(client).FetchUser({
          where: {
            auth0Id: { _eq: auth0User.sub },
          },
        });

        user = userData?.user[0];
      } catch (error) {
        console.error(error);
        return res.redirect(307, urls.logout({ error: true }));
      }
    }

    if (!isEmailUser(auth0User)) {
      const nullifier = auth0User.sub.split("|")[2];

      try {
        const userData = await fetchUserSdk(client).FetchUser({
          where: {
            world_id_nullifier: { _eq: nullifier },
          },
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

    if (!user) {
      const searchParams = new URLSearchParams({
        email: auth0User.email as string,
        name: auth0User.name,
        auth0Id: auth0User.sub as string,
      });

      return res.status(200).redirect(`/signup?${searchParams.toString()}`);
    }

    if (user && !user.auth0Id) {
      // REVIEW
      // FIXME: without timeout second gql request fails with "socket hang up"
      await wait(0);

      try {
        const userData = await addAuth0Sdk(client).AddAuth0({
          id: user.id,
          auth0Id: auth0User.sub,
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
