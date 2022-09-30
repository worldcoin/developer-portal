import type { NextApiRequest, NextApiResponse } from "next";
import { errorNotAllowed, errorRequiredAttribute } from "errors";
import { gql } from "@apollo/client";
import { generatePassword, verifyEmailVerificationJWT } from "api-utils";
import { getAPIServiceClient } from "api-graphql";
import { runCors } from "../../../cors";

interface UserPasswordQuery {
  id: string;
  email: string;
  password: string;
  team_id: string;
}

interface UQuery {
  user: UserPasswordQuery[];
}

export default async function handleForgotConfirm(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await runCors(req, res);

  if (!req.method || !["POST", "OPTIONS"].includes(req.method)) {
    return errorNotAllowed(req.method, res);
  }

  if (!req.body.token) {
    return errorRequiredAttribute("token", res);
  }
  if (!req.body.password) {
    return errorRequiredAttribute("password", res);
  }

  const email = await verifyEmailVerificationJWT(req.body.token);

  const client = await getAPIServiceClient();

  const updateQuery = gql`
    mutation UpdateUser($email: String!, $password: String!) {
      update_user(
        where: { email: { _eq: $email } }
        _set: { password: $password }
      ) {
        affected_rows
      }
    }
  `;
  await client.query<{}>({
    query: updateQuery,
    variables: {
      email,
      password: generatePassword(req.body.password),
    },
  });

  res.status(200).json({});
}
