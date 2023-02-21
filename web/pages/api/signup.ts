import {
  errorResponse,
  errorNotAllowed,
  errorRequiredAttribute,
} from "api-helpers/errors";

import { NextApiResponse } from "next";
import { gql } from "@apollo/client";
import { CredentialType, NextApiRequestWithBody } from "types";
import { getAPIServiceClient } from "api-helpers/graphql";

type RegisterRequestBody = {
  action_id?: string;
  nullifier_hash?: string;
  merkle_root?: string;
  verification_level?: CredentialType;
  email?: string;
  teamName?: string;
};

const mutation = gql`
  mutation Signup(
    $action_id: String
    $nullifier_hash: String!
    $merkle_root: String!
    $verification_level: String!
    $team_name: String!
    $email: String!
    $ironclad_id: String!
    $world_id_nullifier: String
  ) {
    insert_team_one(
      object: {
        name: $team_name
        users: {
          data: {
            email: $email
            ironclad_id: $ironclad_id
            world_id_nullifier: $world_id_nullifier
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

    insert_nullifier_one(
      object: {
        action_id: $action_id
        nullifier_hash: $nullifier_hash
        merkle_root: $merkle_root
        verification_level: $verification_level
      }
    ) {
      id
      nullifier_hash
      merkle_root
      verification_level
    }
  }
`;

export default async function login(
  req: NextApiRequestWithBody<RegisterRequestBody>,
  res: NextApiResponse
) {
  if (!req.method || !["POST", "OPTIONS"].includes(req.method)) {
    return errorNotAllowed(req.method, res);
  }

  const {
    action_id,
    nullifier_hash,
    merkle_root,
    verification_level,
    email,
    teamName,
  } = req.body;

  const invalidBody =
    !action_id ||
    !nullifier_hash ||
    !merkle_root ||
    !verification_level ||
    !email ||
    !teamName;

  if (invalidBody) {
    const missingAttribute = (
      [
        "action_id",
        "nullifier_hash",
        "merkle_root",
        "verification_level",
        "email",
        "teamName",
      ] as Array<keyof RegisterRequestBody>
    ).find((param) => !req.body[param]);

    return errorRequiredAttribute(missingAttribute, res);
  }

  let client;

  try {
    client = await getAPIServiceClient();
  } catch (err) {
    return errorResponse(res, 500, "Failed to connect to database");
  }

  let signupResult;

  try {
    signupResult = await client.mutate({
      mutation,
      variables: {
        action_id,
        nullifier_hash,
        merkle_root,
        verification_level,
        team_name: teamName,
        email,
        ironclad_id: "",
        //REVIEW: Should we use externall_nullifier here?
        world_id_nullifier: "0x123",
      },
    });
  } catch (error) {
    console.log(error);
    return errorResponse(res, 500, "Failed to signup");
  }

  const nullifier = signupResult?.data?.insert_nullifier_one;

  if (!nullifier) {
    return errorResponse(res, 500, "Failed to create nullifier");
  }

  res.status(200).json({
    success: true,
  });
}
