import { Claims, Session, getSession, handleLogin } from "@auth0/nextjs-auth0";
import { NextApiRequest, NextApiResponse } from "next";
import { errorResponse } from "src/backend/errors";

import {
  FetchUserQuery,
  getSdk as fetchUserSdk,
} from "./graphql/fetch-user.generated";

import { getAPIServiceGraphqlClient } from "src/backend/graphql";
import { urls } from "src/lib/urls";
import { generateUserJWT } from "src/backend/jwts";
import { setCookie } from "src/backend/cookies";

interface Auth0User extends Claims {
  given_name: string;
  family_name: string;
  nickname: string;
  name: string;
  picture: string;
  locale: string;
  updated_at: string;
  email: string;
  email_verified: boolean;
  sub: string;
  sid: string;
}

export const auth0Login = async (req: NextApiRequest, res: NextApiResponse) => {
  let session: Session | null | undefined = null;

  try {
    session = await getSession(req, res);
  } catch (error) {
    console.error(error);

    return errorResponse(
      res,
      500,
      "internal_server_error",
      "Something went wrong",
      null,
      req
    );
  }

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

  if (!session.user.email_verified) {
    return res.redirect(307, urls.logout({ error: true }));
  }

  const client = await getAPIServiceGraphqlClient();
  const auth0User = session.user as Auth0User;
  let userData: FetchUserQuery | null = null;

  try {
    userData = await fetchUserSdk(client).FetchUser({
      auth0Id: auth0User.sub ?? "",
    });
  } catch (error) {
    console.error(error);
    return res.redirect(307, urls.logout({ error: true }));
  }

  const user = userData.user[0];

  if (!user) {
    const searchParams = new URLSearchParams({
      email: auth0User.email,
      name: auth0User.name,
      auth0Id: auth0User.sub,
    });

    return res.status(200).redirect(`/signup?${searchParams.toString()}`);
  }

  const { token, expiration } = await generateUserJWT(user.id, user.team_id);
  setCookie("auth", { token }, req, res, expiration, "lax", "/");

  return res.redirect(307, urls.app());
};
