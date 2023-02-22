import {
  errorResponse,
  errorNotAllowed,
  errorRequiredAttribute,
} from "api-helpers/errors";

import { gql } from "@apollo/client";
import { NextApiRequestWithBody } from "types";
import { getAPIServiceClient } from "api-helpers/graphql";
import { generateUserJWT, generateUserTempJWT } from "api-helpers/utils";
import { NextApiResponse } from "next";
import { verifyProof } from "api-helpers/verify";
import dayjs from "dayjs";
import { internal as IDKitInternal } from "@worldcoin/idkit";
import { CredentialType } from "@worldcoin/idkit/build/types";

export type LoginRequestBody = {
  proof?: string;
  nullifier_hash?: string;
  merkle_root?: string;
  credential_type?: CredentialType;
};

export type LoginResponse =
  | {
      tempToken: string;
      token?: never;
    }
  | {
      tempToken?: never;
      token: string;
    };

const query = gql`
  query FindUserByNullifier($nullifier_hash: String) {
    user(where: { world_id_nullifier: { _eq: $nullifier_hash } }) {
      id
      team_id
      world_id_nullifier
      email
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

  const { proof, nullifier_hash, merkle_root, credential_type } = req.body;

  const invalidBody =
    !proof || !nullifier_hash || !merkle_root || !credential_type;

  if (invalidBody) {
    const missingAttribute = (
      ["proof", "nullifier_hash", "merkle_root", "signal_type"] as Array<
        keyof LoginRequestBody
      >
    ).find((param) => !req.body[param]);

    return errorRequiredAttribute(missingAttribute, res);
  }

  const external_nullifier = IDKitInternal.generateExternalNullifier(
    "app_developer_portal",
    ""
  ).digest;

  let result;

  //FIXME: Remove this if statement after idkit problem fixed
  if (process.env.NODE_ENV !== "development") {
    result = await verifyProof(
      {
        merkle_root,
        signal: dayjs().unix().toString(),
        nullifier_hash,
        external_nullifier,
        proof,
      },
      {
        credential_type: credential_type,
        is_staging: false,
        //TODO: add relevant contract address
        contract_address: "",
      }
    );
  }

  //FIXME: Just a mock while idkit problem
  result = {
    success: true,
    error: {
      statusCode: 500,
      attribute: "",
      code: "INTERNAL_SERVER_ERROR",
      message: "Internal Server Error",
    },
  };

  if (result.error && !result.success) {
    return errorResponse(
      res,
      result.error.statusCode,
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
    console.log("Nullifier not found. Redirecting to signup page...");
    const tempToken = await generateUserTempJWT(nullifier_hash);
    return res.status(200).json({ tempToken });
  }

  const token = await generateUserJWT(user.id, user.team_id);
  res.status(200).json({ token });
}
