import {
  errorResponse,
  errorNotAllowed,
  errorRequiredAttribute,
} from "api-helpers/errors";

import { gql } from "@apollo/client";
import { CredentialType, NextApiRequestWithBody } from "types";
import { getAPIServiceClient } from "api-helpers/graphql";
import { generateUserJWT, generateUserTempJWT } from "api-helpers/utils";
import { NextApiResponse } from "next";
import { verifyProof } from "api-helpers/verify";
import { internal as IDKitInternal } from "@worldcoin/idkit";

export type LoginRequestBody = {
  proof?: string;
  nullifier_hash?: string;
  merkle_root?: string;
  signal_type?: CredentialType;
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

  const { proof, nullifier_hash, merkle_root, signal_type, signal } = req.body;

  const invalidBody =
    !proof || !nullifier_hash || !merkle_root || !signal_type || !signal;

  if (invalidBody) {
    const missingAttribute = (
      [
        "proof",
        "nullifier_hash",
        "merkle_root",
        "signal_type",
        "signal",
      ] as Array<keyof LoginRequestBody>
    ).find((param) => !req.body[param]);

    return errorRequiredAttribute(missingAttribute, res);
  }

  const external_nullifier = IDKitInternal.generateExternalNullifier(
    "app_developer_portal",
    ""
  ).digest;

  const result = await verifyProof(
    {
      merkle_root,
      signal,
      nullifier_hash,
      external_nullifier,
      proof,
    },
    {
      credential_type: signal_type,
      is_staging: process.env.NODE_ENV === "development" ? true : false,
      //TODO: add relevant contract address
      contract_address: "",
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

  const userQueryResult = await client.query({
    query,
    variables: {
      nullifier_hash,
    },
  });

  const user = userQueryResult.data.user[0];

  if (!user) {
    const signupToken = await generateUserTempJWT(nullifier_hash);

    if (!signupToken) {
      return errorResponse(
        res,
        500,
        "internal_error",
        "Error while logging in"
      );
    }

    return res.status(200).json({ new_user: true, signup_token: signupToken });
  }

  const token = await generateUserJWT(user.id, user.team_id);
  res.status(200).json({ new_user: false, token });
}
