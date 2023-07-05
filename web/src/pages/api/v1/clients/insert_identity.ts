import { gql } from "@apollo/client";
import { NextApiRequest, NextApiResponse } from "next";
import {
  errorNotAllowed,
  errorRequiredAttribute,
  errorValidation,
} from "src/backend/errors";
import { getAPIServiceClient } from "src/backend/graphql";
import { protectConsumerBackendEndpoint } from "src/backend/utils";
import {
  POLYGON_PHONE_SEQUENCER,
  POLYGON_PHONE_SEQUENCER_STAGING,
} from "src/lib/constants";
import { RevocationModel } from "src/lib/models";

const existsQuery = gql`
  query RevokeExists($identity_commitment: String!) {
    revocation(where: { identity_commitment: { _eq: $identity_commitment } }) {
      identity_commitment
    }
  }
`;

const deleteQuery = gql`
  mutation DeleteRevoke($identity_commitment: String!) {
    delete_revocation(
      where: { identity_commitment: { _eq: $identity_commitment } }
    ) {
      returning {
        id
      }
    }
  }
`;

/**
 * Check if the identity commitment already exists in the revocation table, and delete it if so
 * @param req
 * @param res
 */
export default async function handleInsert(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (!protectConsumerBackendEndpoint(req, res)) {
    return;
  }

  if (!req.method || !["POST", "OPTIONS"].includes(req.method)) {
    return errorNotAllowed(req.method, res);
  }

  for (const attr of ["credential_type", "identity_commitment", "env"]) {
    if (!req.body[attr]) {
      return errorRequiredAttribute(attr, res);
    }
  }

  if (req.body.credential_type !== "phone") {
    return errorValidation(
      "invalid",
      "Invalid credential type. Only `phone` is supported for now.",
      "credential_type",
      res
    );
  }

  const response = await insertIdentity(req.body);

  res.status(response.status).json(response.json);
}

export const insertIdentity = async (payload: {
  credential_type: "phone";
  identity_commitment: string;
  env: "staging" | "production";
}): Promise<{ status: number; json: Record<string, string> | null }> => {
  const client = await getAPIServiceClient();

  // Check if the identity commitment already exists
  const revokeExistsResponse = await client.query<{
    revocation: Array<Pick<RevocationModel, "identity_commitment">>;
  }>({
    query: existsQuery,
    variables: { identity_commitment: payload.identity_commitment },
  });

  if (revokeExistsResponse.data.revocation.length) {
    // Identity commitment has been revoked before, so remove it from the table
    const deleteRevokeResponse = await client.mutate<{
      delete_revocation: Array<Pick<RevocationModel, "identity_commitment">>;
    }>({
      mutation: deleteQuery,
      variables: {
        identity_commitment: payload.identity_commitment,
      },
    });

    if (deleteRevokeResponse?.data?.delete_revocation.length) {
      return { status: 204, json: null };
    }

    console.error(
      "insertIdentity unhandled error from hasura",
      deleteRevokeResponse
    );

    return {
      status: 503,
      json: {
        code: "server_error",
        detail: "Something went wrong. Please try again.",
      },
    };
  }

  // Identity commitment is new, so send it to the signup sequencer
  const headers = new Headers();
  headers.append(
    "Authorization",
    payload.env === "production"
      ? `Basic ${process.env.PHONE_SEQUENCER_KEY}`
      : `Basic ${process.env.PHONE_SEQUENCER_STAGING_KEY}`
  );
  headers.append("Content-Type", "application/json");

  const response = await fetch(
    payload.env === "production"
      ? `${POLYGON_PHONE_SEQUENCER}/insertIdentity`
      : `${POLYGON_PHONE_SEQUENCER_STAGING}/insertIdentity`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        identityCommitment: payload.identity_commitment,
      }),
    }
  );

  if (response.ok) {
    return { status: 204, json: null };
  }
  if (response.status === 400) {
    console.info(
      "insertIdentity `400` response from sequencer",
      await response.text()
    );
    return {
      status: 400,
      json: {
        code: "already_included",
        detail: "The identity commitment is already included",
      },
    };
  }

  console.error(
    `insertIdentity unhandled error from sequencer ${response.status}`,
    await response.text()
  );

  return {
    status: 503,
    json: {
      code: "server_error",
      detail: "Something went wrong. Please try again.",
    },
  };
};
