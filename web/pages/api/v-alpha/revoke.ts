import { gql } from "@apollo/client";
import {
  errorNotAllowed,
  errorRequiredAttribute,
  errorValidation,
} from "api-helpers/errors";
import { getAPIServiceClient } from "api-helpers/graphql";
import { NextApiRequest, NextApiResponse } from "next";

const existsQuery = gql`
  query RevokeExists($identity_commitment: String!) {
    revoke(where: { identity_commitment: { _eq: $identity_commitment } }) {
      identity_commitment
    }
  }
`;

/**
 * Adds the passed identity commitment to the revoke table, if does not already exist
 * @param req
 * @param res
 */
export default async function handleRevoke(
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
  // TODO: The checking and revocation can be done in a single transaction
  const revokeExistsResponse = await client.query({
    query: existsQuery,
    variables: { identity_commitment: req.body.identity_commitment },
  });

  if (revokeExistsResponse.data.revoke.length) {
    return errorValidation(
      "already_revoked",
      "This identity commitment has already been revoked.",
      "identity_commitment",
      res
    );
  }

  // Insert the unique identity commitment to the table
  const insertQuery = gql`
    mutation InsertRevoke($type: String!, $identity_commitment: String!) {
      insert_revoke(
        objects: { identity_commitment: $identity_commitment, type: $type }
      ) {
        returning {
          id
          revoked_at
        }
      }
    }
  `;

  const insertRevokeResponse = await client.mutate({
    mutation: insertQuery,
    variables: {
      type: req.body.type,
      identity_commitment: req.body.identity_commitment,
    },
  });

  if (insertRevokeResponse?.data?.insert_revoke?.returning.length) {
    res.status(204).end();
  } else {
    return errorValidation(
      "not_inserted",
      "The identity commitment was not inserted",
      "identity_commitment",
      res
    );
  }
}
