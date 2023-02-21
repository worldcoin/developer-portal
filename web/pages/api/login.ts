import {
  errorResponse,
  errorNotAllowed,
  errorRequiredAttribute,
} from "api-helpers/errors";

import { NextApiRequest, NextApiResponse } from "next";
import { verifyProof } from "api-helpers/verify";
import { gql } from "@apollo/client";
import { CredentialType, NextApiRequestWithBody } from "types";
import { getAPIServiceClient } from "api-helpers/graphql";

export type LoginRequestBody = {
  proof?: string;
  nullifier_hash?: string;
  merkle_root?: string;
  signal_type?: CredentialType;
  signal?: string;
  external_nullifier?: string;
};

export type SignupInternalData = {
  action_id: string;
  nullifier_hash: string;
  merkle_root: string;
  verification_level: CredentialType;
};

const query = gql`
  query LoginApp($nullifier_hash: String!) {
    app(where: { id: { _eq: "app_developer_portal" } }) {
      actions(where: { action: { _eq: "" } }) {
        id
        nullifiers(where: { nullifier_hash: { _eq: $nullifier_hash } }) {
          id
        }
      }
    }
  }
`;

export default async function login(
  req: NextApiRequestWithBody<LoginRequestBody>,
  res: NextApiResponse
) {
  if (!req.method || !["POST", "OPTIONS"].includes(req.method)) {
    return errorNotAllowed(req.method, res);
  }

  const {
    proof,
    nullifier_hash,
    merkle_root,
    signal_type,
    signal,
    external_nullifier,
  } = req.body;

  const invalidBody =
    !proof ||
    !nullifier_hash ||
    !merkle_root ||
    !signal_type ||
    !signal ||
    !external_nullifier;

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
      is_staging: true,
      contract_address: "",
    }
  );

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

  const loginApp = await client.query({
    query,
    variables: {
      nullifier_hash,
    },
  });

  const app = loginApp.data.app[0];

  if (!app) {
    return errorResponse(res, 404, "not_found", "Default login app not found");
  }

  const action = app.actions[0];

  if (!action) {
    return errorResponse(
      res,
      404,
      "not_found",
      "Default login action not found for the login app"
    );
  }

  const nullifier = action.nullifiers[0];

  console.log({ app, action, nullifier });

  if (!nullifier) {
    console.log("Nullifier not found. Redirecting to login page");

    const data = {
      action_id: action.id,
      nullifier_hash,
      merkle_root,
      verification_level: signal_type,
    };

    return res.status(200).json({ redirectTo: "/signup", data });
  }

  res.status(200).json({ redirectTo: "/dashboard" });
}
