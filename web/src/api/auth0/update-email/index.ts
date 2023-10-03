import { NextApiRequest, NextApiResponse } from "next";
import { errorNotAllowed, errorResponse } from "src/backend/errors";
import { validateRequestSchema } from "src/backend/utils";
import * as yup from "yup";
import { GetUsers200ResponseOneOfInner, ManagementClient } from "auth0";
import { getSession, updateSession } from "@auth0/nextjs-auth0";

const schema = yup.object({
  email: yup.string().email().required(),
  id: yup.string().required(),
});

export const updateEmailHandler = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  if (
    !process.env.AUTH0_API_DOMAIN ||
    !process.env.AUTH0_API_CLIENT_ID ||
    !process.env.AUTH0_API_CLIENT_SECRET
  ) {
    const missing = [
      "AUTH0_API_DOMAIN",
      "AUTH0_API_CLIENT_ID",
      "AUTH0_API_CLIENT_SECRET",
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

  if (!req.method || !["POST", "OPTIONS"].includes(req.method)) {
    return errorNotAllowed(req.method, res, req);
  }

  const { isValid, parsedParams, handleError } = await validateRequestSchema({
    schema,
    value: req.body,
  });

  if (!isValid) {
    return handleError(req, res);
  }

  const managementClient = new ManagementClient({
    domain: process.env.AUTH0_API_DOMAIN,
    clientSecret: process.env.AUTH0_API_CLIENT_SECRET,
    clientId: process.env.AUTH0_API_CLIENT_ID,
  });

  let updatedUser: GetUsers200ResponseOneOfInner | null = null;

  try {
    const updateUserQueryResult = await managementClient.users.update(
      { id: parsedParams.id },
      { email: parsedParams.email, email_verified: false }
    );

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

  const session = await getSession(req, res);

  await updateSession(req, res, {
    ...session,
    user: {
      ...session?.user,
      email: updatedUser.email,
    },
  });

  const response = {
    success: true,
    data: updatedUser,
  };

  res.status(200).json(response);
};
