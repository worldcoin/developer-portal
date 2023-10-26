import { errorNotAllowed, errorResponse } from "src/backend/errors";
import { NextApiRequest, NextApiResponse } from "next";
import { setCookie } from "src/backend/cookies";
import { getAPIServiceGraphqlClient } from "src/backend/graphql";
import { generateUserJWT, verifySignUpJWT } from "src/backend/jwts";
import * as yup from "yup";
import { validateRequestSchema } from "src/backend/utils";
import { getSdk } from "./graphql/signup.generated";

export type SignupResponse = { returnTo: string };

const schema = yup.object({
  email: yup.string().strict().email(),
  name: yup.string().strict(),
  auth0Id: yup.string().strict(),
  team_name: yup.string().strict().required(),
  signup_token: yup.string().strict().nullable(),
  ironclad_id: yup.string().strict().required(),
});

export type SignupBody = yup.InferType<typeof schema>;

export const handleSignUp = async (
  req: NextApiRequest,
  res: NextApiResponse<SignupResponse>
) => {
  if (!req.method || !["POST", "OPTIONS"].includes(req.method)) {
    return errorNotAllowed(req.method, res, req);
  }

  const { isValid, parsedParams, handleError } = await validateRequestSchema({
    value: req.body,
    schema,
  });

  if (!isValid || !parsedParams) {
    return handleError(req, res);
  }

  const { signup_token, email, team_name, ironclad_id, name, auth0Id } =
    parsedParams;

  let nullifier_hash: string | undefined;

  if (!auth0Id && signup_token) {
    const tokenPayload = await verifySignUpJWT(signup_token);
    nullifier_hash = tokenPayload?.sub;
  }

  if (!nullifier_hash && !auth0Id) {
    return errorResponse(
      res,
      400,
      "Invalid signup token.",
      undefined,
      null,
      req
    );
  }

  const client = await getAPIServiceGraphqlClient();

  const data = await getSdk(client).Signup({
    email,
    name,
    auth0Id,
    team_name,
    ironclad_id,
    nullifier_hash: nullifier_hash ?? "",
  });

  const team = data.insert_team_one;
  const user = team?.users[0];

  if (!team || !user) {
    return errorResponse(res, 500, "Failed to signup", undefined, null, req);
  }

  const { token, expiration } = await generateUserJWT(user.id, team.id);
  setCookie("auth", { token }, req, res, expiration, "lax");

  res.status(200).json({
    returnTo: "/app",
  });
};
