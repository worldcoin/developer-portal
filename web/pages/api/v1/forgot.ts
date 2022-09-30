import type { NextApiRequest, NextApiResponse } from "next";
import { errorNotAllowed, errorRequiredAttribute } from "errors";
import { gql } from "@apollo/client";
import { generateEmailVerificationJWT } from "api-utils";
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

export default async function handlePasswordUpdate(
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

  if (response.data.user.length) {
    const token = await generateEmailVerificationJWT(req.body.email);
    const link = `/forgot-confirm?token=${token}`;
    // FIXME: send link to email
    console.log(link);
  }

  res.status(200).json({});
}
