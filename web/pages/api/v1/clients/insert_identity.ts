import { gql } from "@apollo/client";
import { errorNotAllowed, errorRequiredAttribute } from "api-helpers/errors";
import { getAPIServiceClient } from "api-helpers/graphql";
import { NextApiRequest, NextApiResponse } from "next";

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
  if (!req.method || !["POST", "OPTIONS"].includes(req.method)) {
    return errorNotAllowed(req.method, res);
  }

  for (const attr of ["type", "identity_commitment"]) {
    if (!req.body[attr]) {
      return errorRequiredAttribute(attr, res);
    }
  }

  const client = await getAPIServiceClient();

  // Check if the identity commitment already exists
  const revokeExistsResponse = await client.query({
    query: existsQuery,
    variables: { identity_commitment: req.body.identity_commitment },
  });

  // Identity commitment is new, so just ignore it
  if (!revokeExistsResponse.data.revocation.length) {
    return res.status(204).end();
  }

  // Identity commitment has been revoked before, so remove it from the table
  const deleteRevokeResponse = await client.mutate({
    mutation: deleteQuery,
    variables: {
      identity_commitment: req.body.identity_commitment,
    },
  });

  if (deleteRevokeResponse?.data) {
    res.status(204).end();
  } else {
    res.status(503).json({
      code: "server_error",
      detail: "Something went wrong. Please try again.",
    });
  }
}
