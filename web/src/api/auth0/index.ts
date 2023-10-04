import { Claims, Session, getSession } from "@auth0/nextjs-auth0";
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
import { Auth0Error, JwtConfig } from "src/lib/types";
import { getSdk as addAuth0Sdk } from "./graphql/add-auth0.generated";
import { getCookie } from "cookies-next";
import * as jose from "jose";
import { JWT_ISSUER } from "src/backend/login-internal";

const HASURA_GRAPHQL_JWT_SECRET: JwtConfig = JSON.parse(
  process.env.HASURA_GRAPHQL_JWT_SECRET || ""
);

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

export const auth0Handler = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  let session: Session | null | undefined = null;
  const auth = getCookie("auth", { req, res }) as string;
  let id: string | undefined;

  try {
    const token = JSON.parse(auth).token;

    const result = await jose.jwtVerify(
      token,
      Buffer.from(HASURA_GRAPHQL_JWT_SECRET.key),

      {
        issuer: JWT_ISSUER,
      }
    );

    id = result.payload.sub;
  } catch (error) {
    console.log(error);
  }

  try {
    session = await getSession(req, res);
  } catch (error) {
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
    return res.redirect(307, urls.logout({ error: Auth0Error.NotVerified }));
  }

  const client = await getAPIServiceGraphqlClient();

  if (id) {
    try {
      const updatedUser = await addAuth0Sdk(client).AddAuth0({
        auth0Id: session.user.sub ?? "",
        id: id as string,
      });

      if (!updatedUser.update_user_by_pk) {
        throw new Error("User not found");
      }

      const { token, expiration } = await generateUserJWT(
        updatedUser.update_user_by_pk.id,
        updatedUser.update_user_by_pk.team_id
      );

      setCookie("auth", { token }, req, res, expiration, "lax", "/");
      return res.redirect(307, urls.app());
    } catch (error) {
      console.error(error);
      return res.redirect(307, urls.logout({ error: Auth0Error.Internal }));
    }
  }

  const auth0User = session.user as Auth0User;

  let userData: FetchUserQuery | null = null;

  try {
    userData = await fetchUserSdk(client).FetchUser({
      auth0Id: auth0User.sub ?? "",
    });
  } catch (error) {
    console.error(error);
    return res.redirect(307, urls.logout({ error: Auth0Error.Internal }));
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
