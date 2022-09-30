import { NextApiRequest, NextApiResponse } from "next";
import {
  errorNotAllowed,
  errorRequiredAttribute,
  errorValidation,
} from "../../../errors";
import { gql } from "@apollo/client";
import { generatePassword, generateUserJWT } from "api-utils";
import { runCors } from "../../../cors";
import { getAPIServiceClient } from "api-graphql";
import { validateEmail } from "utils";

interface InsertedUser {
  insert_user_one: {
    id: string;
    team_id: string;
  };
}

export default async function handleSignup(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await runCors(req, res);

  if (!req.method || !["POST", "OPTIONS"].includes(req.method)) {
    return errorNotAllowed(req.method, res);
  }

  for (const attr of [
    "email",
    "password",
    "name",
    "team_name",
    "ironclad_id",
  ]) {
    if (!req.body[attr]) {
      return errorRequiredAttribute(attr, res);
    }
  }

  if (req.body.password.length < 8) {
    return errorValidation(
      "min_length",
      "Please ensure your password is at least 8 characters long.",
      "password",
      res
    );
  }

  if (!validateEmail(req.body.email)) {
    return errorValidation(
      "invalid",
      "Please provide a valid email address.",
      "email",
      res
    );
  }

  // FIXME: Verify `ironclad_id` signature

  const client = await getAPIServiceClient();

  // Check email address is not being used
  const query = gql`
    query EmailExists($email: String!) {
      user(where: { email: { _eq: $email } }) {
        email
      }
    }
  `;

  const emailExistsResponse = await client.query({
    query,
    variables: { email: req.body.email },
  });

  // FIXME: Use a mechanism with an email address to avoid leaking email registrations
  if (emailExistsResponse.data.user.length) {
    return errorValidation(
      "already_registered",
      "This email address is already registered.",
      "email",
      res
    );
  }

  // Insert user and team
  const insertQuery = gql`
    mutation InsertTeam(
      $name: String!
      $email: String!
      $password: String!
      $team_name: String!
      $ironclad_id: String!
      $is_subscribed: Boolean
    ) {
      insert_user_one(
        object: {
          name: $name
          email: $email
          password: $password
          is_subscribed: $is_subscribed
          ironclad_id: $ironclad_id
          team: { data: { name: $team_name } }
        }
      ) {
        id
        team_id
      }
    }
  `;

  const response = await client.query<InsertedUser>({
    query: insertQuery,
    variables: {
      email: req.body.email,
      team_name: req.body.team_name,
      name: req.body.name,
      password: generatePassword(req.body.password),
      is_subscribed: req.body.is_subscribed ?? false,
      ironclad_id: req.body.ironclad_id,
    },
  });

  const createdUser = response.data.insert_user_one;

  res.status(201).json({
    token: await generateUserJWT(createdUser.id, createdUser.team_id),
  });
}
