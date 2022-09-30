import type { NextApiRequest, NextApiResponse } from "next";
import {
  errorNotAllowed,
  errorRequiredAttribute,
  errorValidation,
} from "errors";
import { gql } from "@apollo/client";
import { generatePassword, generateUserJWT } from "api-utils";
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

const errorInvalidCredentials = (res: NextApiResponse): void => {
  return errorValidation(
    "invalid_credentials",
    "Invalid email or password.",
    null,
    res
  );
};

export default async function handleLogin(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await runCors(req, res);

  if (!req.method || !["POST", "OPTIONS"].includes(req.method)) {
    return errorNotAllowed(req.method, res);
  }

  if (!req.body.email) {
    return errorRequiredAttribute("email", res);
  }

  if (!req.body.password) {
    return errorRequiredAttribute("password", res);
  }

  // Fetch user from Hasura
  const query = gql`
    query UserLoginQuery($email: String!) {
      user(where: { email: { _eq: $email } }) {
        id
        email
        password
        team_id
      }
    }
  `;

  const client = await getAPIServiceClient();
  const response = await client.query<UQuery>({
    query,
    variables: { email: req.body.email },
  });

  if (!response.data.user.length) {
    return errorInvalidCredentials(res);
  }

  // Validate password
  const user = response.data.user[0];
  const [salt, _] = user.password.split("@");
  const attemptedPassword = generatePassword(req.body.password, salt);

  if (attemptedPassword !== user.password) {
    return errorInvalidCredentials(res);
  }

  res.status(200).json({ token: await generateUserJWT(user.id, user.team_id) });
}
