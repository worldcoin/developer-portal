import {
  errorResponse,
  errorNotAllowed,
  errorRequiredAttribute,
} from "api-helpers/errors";

import { NextApiResponse } from "next";
import { gql } from "@apollo/client";
import { NextApiRequestWithBody } from "types";
import { getAPIServiceClient } from "api-helpers/graphql";
import { jwtVerify } from "jose";
import { generateUserJWT } from "api-helpers/utils";

const GENERAL_SECRET_KEY = process.env.GENERAL_SECRET_KEY;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL;

export type SignupRequestBody = {
  email?: string;
  teamName?: string;
  tempToken?: string;
};

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
  req: NextApiRequestWithBody<SignupRequestBody>,
  res: NextApiResponse<SignupResponse>
) {
  if (!req.method || !["POST", "OPTIONS"].includes(req.method)) {
    return errorNotAllowed(req.method, res);
  }

  const { tempToken, email, teamName } = req.body;
  const invalidBody = !tempToken || !email || !teamName;

  if (invalidBody) {
    const missingAttribute = (
      ["tempToken", "email", "teamName"] as Array<keyof SignupRequestBody>
    ).find((param) => !req.body[param]);

    return errorRequiredAttribute(missingAttribute, res);
  }

  if (!GENERAL_SECRET_KEY) {
    return errorResponse(res, 500, "internal_error", "Missing secret key");
  }

  const { payload } = await jwtVerify(
    tempToken,
    Buffer.from(GENERAL_SECRET_KEY),
    { issuer: APP_URL }
  );

  const nullifier_hash = payload.sub;
  const client = await getAPIServiceClient();
  let signupResult;

  try {
    signupResult = await client.mutate({
      mutation,
      variables: {
        nullifier_hash,
        team_name: teamName,
        email,
        ironclad_id: "",
      },
    });
  } catch (error) {
    console.log(error);
    return errorResponse(res, 500, "Failed to signup");
  }

  const team = signupResult.data.insert_team_one;
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
