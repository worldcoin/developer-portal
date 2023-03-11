import {
  errorResponse,
  errorNotAllowed,
  errorRequiredAttribute,
} from "src/backend/errors";

import { NextApiRequest, NextApiResponse } from "next";
import { gql } from "@apollo/client";
import { getAPIServiceClient } from "src/backend/graphql";
import { generateUserJWT, verifySignUpJWT } from "src/backend/jwts";
import { setCookie } from "src/backend/cookies";

export type SignupResponse = { returnTo: string };

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

export default async function handleSignUp(
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

  let nullifier_hash: string | undefined;
  let waitListCleared = false;
  try {
    const tokenPayload = await verifySignUpJWT(signup_token);
    nullifier_hash = tokenPayload.sub;
    waitListCleared = Boolean(tokenPayload.waitlist_invite);
  } catch {}

  if (!nullifier_hash) {
    return errorResponse(res, 400, "Invalid signup token.");
  }

  if (!waitListCleared) {
    return errorResponse(
      res,
      400,
      "Developer Portal is currently invite-only. Add yourself to the waitlist in worldcoin.org/world-id"
    );
  }

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

  const { token, expiration } = await generateUserJWT(user.id, team.id);
  setCookie("auth", { token }, req, res, expiration);

  res.status(204).json({
    returnTo: "/app",
  });
}
