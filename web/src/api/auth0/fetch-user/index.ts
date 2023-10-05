import { GetUsers200ResponseOneOfInner, ManagementClient } from "auth0";
import { NextApiRequest, NextApiResponse } from "next";
import { errorNotAllowed, errorResponse } from "src/backend/errors";
import { validateRequestSchema } from "src/backend/utils";
import * as yup from "yup";

const schema = yup.object({
  id: yup.string().required(),
});

export const fetchUserHandler = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
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
    domain: process.env.AUTH0_DOMAIN,
    clientSecret: process.env.AUTH0_CLIENT_SECRET,
    clientId: process.env.AUTH0_CLIENT_ID,
  });

  let auth0User: GetUsers200ResponseOneOfInner | null = null;

  try {
    const result = await managementClient.users.get({ id: parsedParams.id });

    if (!result.data) {
      throw new Error("User not found");
    }

    auth0User = result.data;
  } catch (error) {
    console.error(error);
  }

  if (!auth0User) {
    return errorResponse(res, 404, "not_found", "User not found", null, req);
  }

  return res.status(200).json(auth0User);
};
