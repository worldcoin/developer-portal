import { gql } from "@apollo/client";
import { NextApiRequest, NextApiResponse } from "next";
import {
  errorNotAllowed,
  errorRequiredAttribute,
  errorValidation,
} from "src/backend/errors";
import { getAPIServiceClient } from "src/backend/graphql";
import {
  checkConsumerBackendForPhoneVerification,
  rawFetchInclusionProof,
} from "src/backend/utils";
import { logger } from "src/lib/logger";
import { CredentialType, Environment } from "src/lib/types";
import { sequencerMapping } from "src/lib/utils";

const existsQuery = gql`
  query IdentityCommitmentExists($identity_commitment: String!) {
    revocation(where: { identity_commitment: { _eq: $identity_commitment } }) {
      identity_commitment
    }
  }
`;

interface ISimplifiedError {
  code: string;
  detail: string;
}

const EXPECTED_ERRORS: Record<string, ISimplifiedError> = {
  "provided identity commitment is invalid": {
    code: "unverified_identity",
    detail: "This identity is not verified for the relevant credential.",
  },
  "provided identity commitment not found": {
    code: "unverified_identity",
    detail: "This identity is not verified for the relevant credential.",
  },
};

/**
 * Checks if the given identity commitment is in the revocation table, and if false,
 * queries an inclusion proof from the relevant signup sequencer
 * @param req
 * @param res
 */
export default async function handleInclusionProof(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (!req.method || !["POST", "OPTIONS"].includes(req.method)) {
    return errorNotAllowed(req.method, res, req);
  }

  for (const attr of ["credential_type", "identity_commitment", "env"]) {
    if (!req.body[attr]) {
      return errorRequiredAttribute(attr, res, req);
    }
  }

  if (!Object.values(Environment).includes(req.body.env)) {
    return errorValidation(
      "invalid",
      "Invalid environment value. `staging` or `production` expected.",
      "env",
      res,
      req
    );
  }

  const apiClient = await getAPIServiceClient();

  const credential_type = req.body.credential_type as CredentialType;
  const isStaging = req.body.env === "production" ? false : true;

  const sequencerUrl =
    sequencerMapping[credential_type]?.[isStaging.toString()]!;

  // ANCHOR: Check if the identity commitment has been revoked
  const identityCommitmentExistsResponse = await apiClient.query({
    query: existsQuery,
    variables: { identity_commitment: req.body.identity_commitment },
  });

  if (identityCommitmentExistsResponse.data.revocation.length) {
    // Commitment is in the revocation table, deny the proof request
    logger.info(
      `Declined inclusion proof request for revoked commitment: ${req.body.identity_commitment}`,
      { req }
    );

    return errorValidation(
      "unverified_identity",
      "This identity is not verified for the phone credential.",
      "identity_commitment",
      res,
      req
    );
  }

  // Commitment is not in the revoke table, so query sequencer for inclusion proof
  const response = await rawFetchInclusionProof({
    sequencerUrl,
    identityCommitment: req.body.identity_commitment,
  });

  // Commitment found, return the proof (NOTE this may include a pending proof)
  if (response.ok) {
    res.status(response.status).json({
      inclusion_proof: await response.json(),
    });
  }

  // Commitment not found by the sequencer
  else if (response.status === 400 && req.body.credential_type === "phone") {
    const errorBody = await response.text();

    logger.info(
      `Identity ${req.body.identity_commitment} is not on-chain. Checking with the consumer backend if it already has a verified phone number.`,
      { req }
    );

    // User may have previously verified their phone number, before the phone sequencer contract was deployed
    // Check with the consumer backend if this is the case, and if so insert the identity commitment on-the-fly
    const { error: onTheFlyInsertionError, insertion: onTheFlyInsertion } =
      await checkConsumerBackendForPhoneVerification({
        isStaging,
        identity_commitment: req.body.identity_commitment,
      });

    if (onTheFlyInsertion) {
      return res.status(202).json(onTheFlyInsertion);
    }

    if (onTheFlyInsertionError) {
      const { statusCode, ...errorBody } = onTheFlyInsertionError;
      return res.status(statusCode ?? 500).json(errorBody);
    }

    // Phone was not verified, proceed as normal
    if (Object.keys(EXPECTED_ERRORS).includes(errorBody)) {
      return res.status(400).json(EXPECTED_ERRORS[errorBody]);
    } else {
      logger.error(
        "Unexpected error (400) fetching proof from phone sequencer",
        { errorBody }
      );
      res.status(400).json({
        code: "server_error",
        detail:
          "Unable to get proof for this identity. Please try again later.",
      });
    }
  } else {
    logger.error(
      `Unexpected error (${response.status}) fetching proof from sequencer`,
      { response: await response.text() }
    );
    res.status(503).json({
      code: "server_error",
      detail: "Something went wrong. Please try again.",
    });
  }
}
