import { gql } from "@apollo/client";
import { getAPIServiceClient } from "api-graphql";
import { errorNotAllowed, errorValidation } from "errors";
import { NextApiRequest, NextApiResponse } from "next";

/**
 * Checks if the given identity commitment is in the revocation table, and if false,
 * queries an inclusion proof from the signup sequencer
 * @param req
 * @param res
 */
export default async function handleInclusionProof(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (!req.method || !["POST", "OPTIONS"].includes(req.method)) {
    return errorNotAllowed(req.method, res);
  }

  // Check if the identity commitment does not exist
  const existsQuery = gql`
    query IdentityCommitmentExists($identity_commitment: String!) {
      revoke(where: { identity_commitment: { _eq: $identity_commitment } }) {
        identity_commitment
      }
    }
  `;

  const client = await getAPIServiceClient();
  const identityCommitmentExistsResponse = await client.query({
    query: existsQuery,
    variables: { identity_commitment: req.body.identity_commitment },
  });

  // Commitment is in the revoke table, deny the proof request
  if (identityCommitmentExistsResponse.data.revoke.length) {
    return errorValidation(
      "invalid_commitment",
      "This identity commitment has been revoked.",
      "identity_commitment",
      res
    );
  }

  // Commitment is not in the revoke table, so query sequencer for inclusion proof
  const headers = new Headers();
  headers.append(
    "Authorization",
    `Bearer ${process.env.STAGING_SIGNUP_SEQUENCER_KEY}`
  );
  headers.append("Content-Type", "application/json");
  const body = JSON.stringify([1, req.body.identity_commitment]); // TODO: Change group id to '10' after phone sequencer is deployed

  const response = await fetch(
    "https://signup.stage-crypto.worldcoin.dev/inclusionProof",
    {
      method: "POST",
      headers,
      body,
    }
  );

  if (response.status === 200) {
    res.status(response.status).json({
      inclusion_proof: await response.json(),
    });
  } else if (response.status === 202) {
    res.status(400).json({
      code: "inclusion_pending",
      detail:
        "This identity is in progress of being included on-chain. Please wait a few minutes and try again.",
    });
  } else {
    res.status(400).json({
      code: "unverified_identity",
      detail: "This identity is not verified for the phone credential.",
    });
  }
}
