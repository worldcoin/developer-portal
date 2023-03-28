import { gql } from "@apollo/client";
import { NextApiRequest, NextApiResponse } from "next";
import {
  errorNotAllowed,
  errorRequiredAttribute,
  errorValidation,
} from "src/backend/errors";
import {
  getAPIServiceClient,
  getWLDAppBackendServiceClient,
} from "src/backend/graphql";
import {
  PHONE_SEQUENCER,
  PHONE_SEQUENCER_STAGING,
  SEMAPHORE_GROUP_MAP,
} from "src/lib/constants";
import { CredentialType } from "src/lib/types";

const existsQuery = gql`
  query IdentityCommitmentExists($identity_commitment: String!) {
    revocation(where: { identity_commitment: { _eq: $identity_commitment } }) {
      identity_commitment
    }
  }
`;

const phoneVerifiedQuery = gql`
  query PhoneNumberVerified($identity_commitment: String!) {
    user(where: { phoneIdComm: { _eq: $identity_commitment } }) {
      phoneIsVerified # TODO: Need to check this is present
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

// Temporary function to handle missing production commitments from the phone signup sequencer
async function checkConsumerBackend(
  req: NextApiRequest,
  res: NextApiResponse,
  isStaging: boolean
) {
  const consumerClient = await getWLDAppBackendServiceClient(isStaging);
  // const phoneVerifiedResponse = await consumerClient.query({
  //   query: phoneVerifiedQuery,
  //   variables: { identity_commitment: req.body.identity_commitment },
  // });
  const phoneVerifiedResponse = { data: { user: { phoneIsVerified: true } } }; // DEBUG

  if (phoneVerifiedResponse.data.user.phoneIsVerified) {
    console.info(
      `User's phone number is verified, but not on-chain. Inserting identity: ${req.body.identity_commitment}`
    );
    const insertResponse = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/v1/clients/insert_identity`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.CONSUMER_BACKEND_SECRET}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(req.body),
      }
    );

    console.log("Insert response: ", await insertResponse.text()); // DEBUG

    // Commitment inserted, return a pending inclusion error
    if (insertResponse.status === 200) {
      return res.status(400).json({
        code: "inclusion_pending",
        detail:
          "This identity is in progress of being included on-chain. Please wait a few minutes and try again.",
      });
    }

    // Commitment not inserted, return generic error
    else {
      console.error(
        `Error inserting identity: ${req.body.identity_commitment}`
      );
      return res.status(503).json({
        code: "server_error",
        detail: "Something went wrong. Please try again.",
      });
    }
  }
}

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
    return errorNotAllowed(req.method, res);
  }

  for (const attr of ["credential_type", "identity_commitment", "env"]) {
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

  // TODO: Only phone credential supported for now
  if (req.body.credential_type !== "phone") {
    return errorValidation(
      "invalid",
      "Invalid credential type. Only `phone` is supported for now.",
      "credential_type",
      res
    );
  }

  const apiClient = await getAPIServiceClient();
  const isStaging = req.body.env === "staging" ? true : false;

  // ANCHOR: Check if the identity commitment has been revoked
  const identityCommitmentExistsResponse = await apiClient.query({
    query: existsQuery,
    variables: { identity_commitment: req.body.identity_commitment },
  });

  if (identityCommitmentExistsResponse.data.revocation.length) {
    // Commitment is in the revocation table, deny the proof request
    console.info(
      `Declined inclusion proof request for revoked commitment: ${req.body.identity_commitment}`
    );

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
    isStaging
      ? `Basic ${process.env.PHONE_SEQUENCER_STAGING_KEY}`
      : `Basic ${process.env.PHONE_SEQUENCER_KEY}`
  );
  headers.append("Content-Type", "application/json");
  const body = JSON.stringify([
    SEMAPHORE_GROUP_MAP[CredentialType.Phone],
    req.body.identity_commitment,
  ]);

  const response = await fetch(
    req.body.env === "production"
      ? `${PHONE_SEQUENCER}/inclusionProof`
      : `${PHONE_SEQUENCER_STAGING}/inclusionProof`,
    {
      method: "POST",
      headers,
      body,
    }
  );

  // Commitment found, return the proof
  if (response.status === 200) {
    res.status(200).json({
      inclusion_proof: await response.json(),
    });
  }

  // Commitment is still pending inclusion, return an error
  else if (response.status === 202) {
    res.status(400).json({
      code: "inclusion_pending",
      detail:
        "This identity is in progress of being included on-chain. Please wait a few minutes and try again.",
    });
  }

  // Commitment not found by the sequencer
  else if (response.status === 400) {
    const errorBody = await response.text();

    console.log("errorBody:", errorBody); // DEBUG

    // Check if the user's phone number is verified on the consumer backend, temporary fix
    await checkConsumerBackend(req, res, isStaging);

    // Phone was not verified, proceed as normal
    if (Object.keys(EXPECTED_ERRORS).includes(errorBody)) {
      return res.status(400).json(EXPECTED_ERRORS[errorBody]);
    } else {
      console.error(
        "Unexpected error (400) fetching proof from phone sequencer",
        errorBody
      );
      res.status(400).json({
        code: "server_error",
        detail:
          "Unable to get proof for this identity. Please try again later.",
      });
    }
  } else {
    console.error(
      `Unexpected error (${response.status}) fetching proof from phone sequencer`,
      await response.text()
    );
    res.status(503).json({
      code: "server_error",
      detail: "Something went wrong. Please try again.",
    });
  }
}
