import {
  errorResponse,
  errorNotAllowed,
  errorRequiredAttribute,
} from "api-helpers/errors";

import { gql } from "@apollo/client";
import { NextApiRequestWithBody } from "types";
import { getAPIServiceClient } from "api-helpers/graphql";
import {
  generateUserJWT,
  generateSignUpJWT,
  fetchSmartContractAddress,
} from "api-helpers/jwts";
import { NextApiResponse } from "next";
import { verifyProof } from "api-helpers/verify";
import { CredentialType } from "@worldcoin/idkit/build/types";
import { fetchOIDCApp } from "api-helpers/oidc";
import { DEVELOPER_PORTAL_AUTH_APP } from "consts";
import { UserModel } from "models";

export type LoginRequestBody = {
  proof?: string;
  nullifier_hash?: string;
  merkle_root?: string;
  credential_type?: CredentialType;
  signal?: string;
};

export type LoginResponse =
  | {
      new_user: true;
      signup_token: string;
      token?: never;
    }
  | {
      new_user: false;
      signup_token?: never;
      token: string;
    };

const query = gql`
  query FindUserByNullifier($nullifier_hash: String) {
    user(where: { world_id_nullifier: { _eq: $nullifier_hash } }) {
      id
      team_id
      world_id_nullifier
    }
  }
`;

export default async function login(
  req: NextApiRequestWithBody<LoginRequestBody>,
  res: NextApiResponse<LoginResponse>
) {
  if (!req.method || !["POST", "OPTIONS"].includes(req.method)) {
    return errorNotAllowed(req.method, res);
  }

  const { proof, nullifier_hash, merkle_root, credential_type, signal } =
    req.body;

  const invalidBody =
    !proof || !nullifier_hash || !merkle_root || !credential_type || !signal;

  if (invalidBody) {
    const missingAttribute = (
      [
        "proof",
        "nullifier_hash",
        "merkle_root",
        "credential_type",
        "signal",
      ] as Array<keyof LoginRequestBody>
    ).find((param) => !req.body[param]);

    return errorRequiredAttribute(missingAttribute, res);
  }

  // ANCHOR: Authenticate the user with the ZKP from World ID
  const runLoginInStaging =
    process.env.NODE_ENV === "production" ? false : true;
  const contract_address = await fetchSmartContractAddress(runLoginInStaging);
  const result = await verifyProof(
    {
      merkle_root,
      signal,
      nullifier_hash,
      external_nullifier: DEVELOPER_PORTAL_AUTH_APP.external_nullifier,
      proof,
    },
    {
      credential_type,
      is_staging: runLoginInStaging,
      contract_address,
    }
  );

  if (result.error && !result.success) {
    return errorResponse(
      res,
      result.error.statusCode ?? 500,
      result.error.code,
      result.error.message,
      result.error.attribute
    );
  }

  const client = await getAPIServiceClient();

  // ANCHOR: Check if the user has an account
  const userQueryResult = await client.query<{
    user: Array<Pick<UserModel, "id" | "world_id_nullifier" | "team_id">>;
  }>({
    query,
    variables: {
      nullifier_hash,
    },
  });

  const user = userQueryResult.data.user[0];

  if (!user) {
    // NOTE: User does not have an account, generate a sign up token
    const signup_token = await generateSignUpJWT(nullifier_hash);
    return res.status(200).json({ new_user: true, signup_token });
  }

  // NOTE: User has an account, generate a login token
  const token = await generateUserJWT(user.id, user.team_id);
  res.status(200).json({ new_user: false, token });
}
