import { gql } from "@apollo/client";
import {
  errorNotAllowed,
  errorRequiredAttribute,
  errorValidation,
} from "api-helpers/errors";
import { getAPIServiceClient } from "api-helpers/graphql";
import {
  PHONE_GROUP_ID,
  PHONE_SEQUENCER,
  PHONE_SEQUENCER_STAGING,
} from "consts";
import { NextApiRequest, NextApiResponse } from "next";

const existsQuery = gql`
  query IdentityCommitmentExists($identity_commitment: String!) {
    revocation(where: { identity_commitment: { _eq: $identity_commitment } }) {
      identity_commitment
    }
  }
`;

/**
 * Checks if the given identity commitment is in the revocation table, and if false,
 * queries an inclusion proof from the phone signup sequencer
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

  for (const attr of ["identity_commitment", "env"]) {
    if (!req.body[attr]) {
      return errorRequiredAttribute(attr, res);
    }
  }

  // TODO: Type environments
  if (!["staging", "production"].includes(req.body.env)) {
    return errorValidation(
      "invalid",
      "Invalid environment value. `staging` or `production` expected.",
      "env",
      res
    );
  }

  const client = await getAPIServiceClient();

  // ANCHOR: Check if the identity commitment has been revoked
  const identityCommitmentExistsResponse = await client.query({
    query: existsQuery,
    variables: { identity_commitment: req.body.identity_commitment },
  });

  // Commitment is in the revocation table, deny the proof request
  console.info(
    `Declined inclusion proof request for revoked commitment: ${req.body.identity_commitment}`
  );
  if (identityCommitmentExistsResponse.data.revoke.length) {
    return errorValidation(
      "unverified_identity",
      "This identity is not verified for the phone credential.",
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
  const body = JSON.stringify([PHONE_GROUP_ID, req.body.identity_commitment]);

  // FIXME: Currently using the orb staging sequencer while phone sequencer gets deployed
  const response = await fetch(
    req.body.env === "production" ? PHONE_SEQUENCER : PHONE_SEQUENCER_STAGING,
    {
      method: "POST",
      headers,
      body,
    }
  );

  if (response.status === 200) {
    res.status(200).json({
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
