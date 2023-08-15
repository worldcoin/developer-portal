import { errorNotAllowed, errorResponse } from "src/backend/errors";
import { gql } from "@apollo/client";
import { NextApiRequest, NextApiResponse } from "next";
import { setCookie } from "src/backend/cookies";
import { getAPIServiceClient } from "src/backend/graphql";
import { generateUserJWT, verifySignUpJWT } from "src/backend/jwts";
import * as yup from "yup";
import { validateRequestSchema } from "src/backend/utils";

export type SignupResponse = { returnTo: string };

const mutation = gql`
  mutation Signup(
    $nullifier_hash: String!
    $team_name: String!
    $email: String
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
      users {
        id
        ironclad_id
        email
        world_id_nullifier
      }
    }
  }
`;

const schema = yup.object({
  email: yup.string().email(),
  team_name: yup.string().required(),
  signup_token: yup.string().required(),
  ironclad_id: yup.string().required(),
});

export default async function handleSignUp(
  req: NextApiRequest,
  res: NextApiResponse<SignupResponse>
) {
  if (!req.method || !["POST", "OPTIONS"].includes(req.method)) {
    return errorNotAllowed(req.method, res, req);
  }

  const { isValid, parsedParams, handleError } = await validateRequestSchema({
    schema,
    value: req.body,
  });

  if (!isValid) {
    return handleError(req, res);
  }

  const { signup_token, email, team_name, ironclad_id } = parsedParams;

  const tokenPayload = await verifySignUpJWT(signup_token);
  let nullifier_hash: string | undefined = tokenPayload.sub;

  if (!nullifier_hash) {
    return errorResponse(
      res,
      400,
      "Invalid signup token.",
      undefined,
      null,
      req
    );
  }

  const client = await getAPIServiceClient();

  const { data } = await client.mutate({
    mutation,

    variables: {
      nullifier_hash,
      team_name,
      email: email || null,
      ironclad_id: ironclad_id,
    },
  });

  const team = data.insert_team_one;
  const user = team.users[0];

  if (!team || !user) {
    return errorResponse(res, 500, "Failed to signup", undefined, null, req);
  }

  const { token, expiration } = await generateUserJWT(user.id, team.id);
  setCookie("auth", { token }, req, res, expiration);

  res.status(200).json({
    returnTo: "/app",
  });
}
