import { Passwordless } from "auth0";
import { NextApiRequest, NextApiResponse } from "next";
import { errorNotAllowed, errorResponse } from "src/backend/errors";
import { validateRequestSchema } from "src/backend/utils";
import * as yup from "yup";

const schema = yup.object({
  email: yup.string().email().required(),
});

export default async function sendOtpHandler(
  req: NextApiRequest,
  res: NextApiResponse
) {
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

  const { isValid, parsedParams, handleError } = await validateRequestSchema({
    schema,
    value: req.body,
  });

  if (!isValid) {
    return handleError(req, res);
  }

  const passwordless = new Passwordless({
    domain: process.env.AUTH0_DOMAIN,
    clientSecret: process.env.AUTH0_CLIENT_SECRET,
    clientId: process.env.AUTH0_CLIENT_ID,
  });

  passwordless.sendEmail({
    email: parsedParams.email,
    send: "code",
  });

  return res.status(200).json({ success: true });
}
