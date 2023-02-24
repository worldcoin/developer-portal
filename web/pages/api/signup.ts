import {
  errorResponse,
  errorNotAllowed,
  errorRequiredAttribute,
} from "api-helpers/errors";

import { NextApiRequest, NextApiResponse } from "next";
import { gql } from "@apollo/client";
import { getAPIServiceClient } from "api-helpers/graphql";
import { generateUserJWT, verifySignUpJWT } from "api-helpers/jwts";

export type SignupResponse = { redirectTo: string; token: string };

const mutation = gql`
  mutation Signup(
    $nullifier_hash: String!
    $team_name: String!
    $email: String!
    $ironclad_id: String!
  ) {
    insert_team_one(
      object: {
        name: $team_name
        users: {
          data: {
            email: $email
            ironclad_id: $ironclad_id
            world_id_nullifier: $nullifier_hash
          }
        }
      }
    ) {
      id
      name
      users(where: { email: { _eq: $email } }) {
        id
        ironclad_id
        email
        world_id_nullifier
      }
    }
  }
`;

export default async function login(
  req: NextApiRequest,
  res: NextApiResponse<SignupResponse>
) {
  if (!req.method || !["POST", "OPTIONS"].includes(req.method)) {
    return errorNotAllowed(req.method, res);
  }

  for (const attr of ["signup_token", "team_name", "ironclad_id"]) {
    if (!req.body[attr]) {
      return errorRequiredAttribute(attr, res);
    }
  }

  const { signup_token, email, team_name } = req.body;

  const nullifier_hash = await verifySignUpJWT(signup_token);
  const client = await getAPIServiceClient();

  const { data } = await client.mutate({
    mutation,
    variables: {
      nullifier_hash,
      team_name,
      email: email ?? "",
      ironclad_id: req.body.ironclad_id,
    },
  });

  const team = data.insert_team_one;
  const user = team.users[0];

  if (!team || !user) {
    return errorResponse(res, 500, "Failed to signup");
  }

  const token = await generateUserJWT(user.id, team.id);

  res.status(200).json({
    redirectTo: "/dashboard",
    token,
  });
}
