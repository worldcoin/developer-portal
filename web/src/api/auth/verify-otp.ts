import { Passwordless, ManagementClient } from "auth0";
import { JWTPayload, decodeJwt } from "jose";
import { NextApiRequest, NextApiResponse } from "next";
import { errorNotAllowed, errorResponse } from "src/backend/errors";
import { getAPIServiceGraphqlClient } from "src/backend/graphql";
import { validateRequestSchema } from "src/backend/utils";
import * as yup from "yup";

import {
  FetchUserQuery,
  getSdk as fetchUserSdk,
} from "./graphql/fetch-user.generated";

import { generateUserJWT } from "src/backend/jwts";
import { setCookie } from "src/backend/cookies";
import { urls } from "src/lib/urls";
import dayjs from "dayjs";

const schema = yup.object({
  otp: yup.string().required(),
  email: yup.string().email().required(),
});

export default async function verifyOtpHandler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (!req.method || !["GET", "OPTIONS"].includes(req.method)) {
    return errorNotAllowed(req.method, res, req);
  }

  if (
    !process.env.AUTH0_DOMAIN ||
    !process.env.AUTH0_CLIENT_ID ||
    !process.env.AUTH0_CLIENT_SECRET
  ) {
    const missing = [
      "AUTH0_DOMAIN",
      "AUTH0_CLIENT_ID",
      "AUTH0_CLIENT_SECRET",
    ].filter((key) => !process.env[key]);

    return errorResponse(
      res,
      500,
      "internal_server_error",
      "Missing environment variables",
      missing.join(", "),
      req
    );
  }

  const { isValid, parsedParams, handleError } = await validateRequestSchema({
    schema,
    value: req.query,
  });

  if (!isValid) {
    return handleError(req, res);
  }

  const passwordless = new Passwordless({
    domain: process.env.AUTH0_DOMAIN,
    clientSecret: process.env.AUTH0_CLIENT_SECRET,
    clientId: process.env.AUTH0_CLIENT_ID,
  });

  const result = await passwordless.loginWithEmail({
    code: parsedParams.otp,
    email: parsedParams.email,
  });

  const claims = decodeJwt(result.data.id_token as string) as JWTPayload & {
    nickname: string;
    name: string;
    picture?: string;
    updated_at: string;
    email: string;
    email_verified: boolean;
  };

  if (!claims.sub || typeof claims.sub !== "string") {
    return res.redirect(307, urls.logout({ error: true }));
  }

  if (!claims.email_verified) {
    return res.redirect(307, urls.logout({ error: true }));
  }

  const client = await getAPIServiceGraphqlClient();
  let userData: FetchUserQuery | null = null;

  try {
    userData = await fetchUserSdk(client).FetchUser({
      auth0Id: claims.sub ?? "",
    });
  } catch (error) {
    console.error(error);
    return res.redirect(307, urls.logout({ error: true }));
  }

  const user = userData.user[0];

  if (!user) {
    const searchParams = new URLSearchParams({
      email: claims.email,
      name: claims.name,
      auth0Id: claims.sub,
    });

    setCookie(
      "auth0Id",
      { id: claims.sub },
      req,
      res,
      dayjs().add(2, "minute").unix(),
      "lax",
      "/"
    );

    return res.redirect(307, `/signup?${searchParams.toString()}`);
  }

  const { token, expiration } = await generateUserJWT(user.id, user.team_id);
  setCookie("auth", { token }, req, res, expiration, "lax", "/");

  return res.redirect(307, urls.app());
}
