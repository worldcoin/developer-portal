import { NextApiRequest, NextApiResponse } from "next";
import {
  errorForbidden,
  errorNotAllowed,
  errorResponse,
} from "src/backend/errors";
import { validateRequestSchema } from "src/backend/utils";
import * as yup from "yup";

import {
  GetUsers200ResponseOneOfInner,
  ManagementClient,
  Passwordless,
} from "auth0";

import { getCookie } from "cookies-next";
import { verifyUserJWT } from "src/backend/jwts";

const schema = yup.object({
  email: yup.string().email().required(),
  id: yup.string().required(),
});

export const auth0UpdateEmail = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  if (!req.method || !["POST", "OPTIONS"].includes(req.method)) {
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

  const auth = getCookie("auth", { req, res }) as string;

  try {
    const token = JSON.parse(auth).token;
    const isTokenValid = await verifyUserJWT(token);

    if (!isTokenValid) {
      throw new Error("Invalid token");
    }
  } catch (error) {
    console.error(error);
    return errorForbidden(req, res);
  }

  const { isValid, parsedParams, handleError } = await validateRequestSchema({
    schema,
    value: req.body,
  });

  if (!isValid) {
    return handleError(req, res);
  }

  const managementClient = new ManagementClient({
    domain: process.env.AUTH0_DOMAIN,
    clientSecret: process.env.AUTH0_CLIENT_SECRET,
    clientId: process.env.AUTH0_CLIENT_ID,
  });

  let updatedUser: GetUsers200ResponseOneOfInner | null = null;

  try {
    const updateUserQueryResult = await managementClient.users.update(
      { id: parsedParams.id },
      { email: parsedParams.email, email_verified: false }
    );

    const passwordless = new Passwordless({
      domain: process.env.AUTH0_DOMAIN,
      clientSecret: process.env.AUTH0_CLIENT_SECRET,
      clientId: process.env.AUTH0_CLIENT_ID,
    });

    passwordless.sendEmail({
      email: parsedParams.email,
      send: "link",

      authParams: {
        response_type: "code",
        redirect_uri: "http://localhost:3000/api/auth/update-email-callback",
      },
    });

    if (!updateUserQueryResult.data) {
      throw new Error("No data returned from Auth0");
    }

    updatedUser = updateUserQueryResult.data;
  } catch (error) {
    console.error(error);

    return errorResponse(
      res,
      500,
      "internal_server_error",
      "Error while updating Auth0 user email",
      null,
      req
    );
  }

  const response = {
    success: true,
    data: updatedUser,
  };

  res.status(200).json(response);
};
