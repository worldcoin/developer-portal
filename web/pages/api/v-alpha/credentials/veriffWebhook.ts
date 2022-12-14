import { getRawRequestBody, hashCredentialV0 } from "api-utils";
import { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";
import { gql } from "@apollo/client";
import { getAPIServiceClient } from "api-graphql";

const SIGNUP_SEQUENCER_URL = "https://signup.stage-crypto.worldcoin.dev";
const DOC_CHECK_GROUP_ID = 5;

// NOTE: We need to keep parsing off so we can verify the signature
export const config = {
  api: {
    bodyParser: false,
  },
};

// FIXME: We need to add a cron job to delete all sessions from Veriff that have been completed or expired

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (!process.env.VERIFF_PUBLIC_KEY) {
    throw new Error("VERIFF_PUBLIC_KEY is not set");
  }

  if (!process.env.VERIFF_PRIVATE_KEY) {
    throw new Error("VERIFF_PRIVATE_KEY is not set");
  }

  console.log("Processing webhook from Veriff.");

  const rawBody = await getRawRequestBody(req);

  // ANCHOR: Authenticate webhook comes from Veriff
  const authClient = req.headers["x-auth-client"];
  if (authClient !== process.env.VERIFF_PUBLIC_KEY) {
    console.warn("Veriff webhook. Invalid X-AUTH-CLIENT header", authClient);
    return res.status(401).end();
  }

  const signature = req.headers["x-hmac-signature"];
  const digest = crypto
    .createHmac("sha256", process.env.VERIFF_PRIVATE_KEY)
    .update(rawBody)
    .digest("hex");
  if (digest !== signature) {
    console.warn("Received webhook with invalid signature", signature, rawBody);
    return res.status(401).end();
  }

  const { verification } = JSON.parse(rawBody);

  const client = await getAPIServiceClient();

  // ANCHOR: Handle successful verification
  if (verification.code === 9001) {
    // TODO: Check structure of the data and sign
    const dataPacket = {
      first_name: verification.person.firstName,
      last_name: verification.person.lastName,
      gender: verification.person.gender,
      nationality: verification.person.nationality,
      date_of_birth: verification.person.dateOfBirth,
    };

    const hashedDocument = await hashCredentialV0(
      `${verification.document.country}_${verification.document.number}`,
      "v0_identity"
    );

    const query = gql`
      mutation UpdateCredential(
        $verification_session_id: String!
        $credential_hash: String!
        $credential_data: json!
      ) {
        update_credential(
          where: { verification_session_id: { _eq: $verification_session_id } }
          _set: {
            status: "verified"
            credential_hash: $credential_hash
            credential_data: $credential_data
          }
        ) {
          returning {
            identity_commitment
          }
        }
      }
    `;

    const { data, errors } = await client.query({
      query,
      variables: {
        verification_session_id: verification.id,
        credential_hash: hashedDocument,
        credential_data: dataPacket,
      },
      errorPolicy: "all",
    });

    // ANCHOR: Handle duplicate submission (same document)
    if (errors) {
      for (const error of errors) {
        if (error["extensions"]["code"] === "constraint-violation") {
          console.warn("Attempted to registered user with duplicate document.");
          const query = gql`
            mutation UpdateCredential(
              $verification_session_id: String!
              $error_details: String!
            ) {
              update_credential(
                where: {
                  verification_session_id: { _eq: $verification_session_id }
                }
                _set: { status: "errored", error_details: $error_details }
              ) {
                affected_rows
              }
            }
          `;

          await client.query({
            query,
            variables: {
              verification_session_id: verification.id,
              error_details:
                "You have previously verified with World ID. You can only verify once.",
            },
          });
          return res.status(204).end();
        }
      }
    }

    const identity_commitment =
      data.update_credential.returning[0].identity_commitment;

    if (!identity_commitment) {
      throw new Error(
        "Identity commitment not found for session ID: " + verification.id
      );
    }

    // ANCHOR: Insert identity on signup sequencer to Merkle tree
    const sequencerResponse = await fetch(
      `${SIGNUP_SEQUENCER_URL}/insertIdentity`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "", // TODO
        },
        body: JSON.stringify([DOC_CHECK_GROUP_ID, identity_commitment]),
      }
    );

    if (!sequencerResponse.ok) {
      // TODO: Probably want to add some retry mechanism
      throw new Error(
        "Failed to insert identity into Merkle tree.",
        verification.id
      );
    }
  } else if (verification.code === 9104) {
    // NOTE: Expired or abandoned, delete the session information from the DB
    const query = gql`
      mutation DeleteCredential($verification_session_id: String!) {
        delete_credential(
          where: { verification_session_id: { _eq: $verification_session_id } }
        ) {
          affected_rows
        }
      }
    `;

    await client.query({
      query,
      variables: { verification_session_id: verification.id },
    });

    console.log("Deleted verification session as it expired or was abandoned.");
  } else if (verification.code === 9102 || verification.code === 9103) {
    if (verification.code === 9102) {
      // NOTE: Verification failed due to fraud or hard negative reason
      console.warn(
        "Verification rejected due to fraud.",
        verification.riskLabels
      );
    } else {
      console.log("Verification failed due to resubmission being required.");
    }

    const query = gql`
      mutation DeleteCredential(
        $verification_session_id: String!
        $error_details: String!
      ) {
        update_credential(
          where: { verification_session_id: { _eq: $verification_session_id } }
          _set: { status: "errored", error_details: $error_details }
        ) {
          affected_rows
        }
      }
    `;

    await client.query({
      query,
      variables: {
        verification_session_id: verification.id,
        error_details: "Verification failed. Please try again.",
      },
    });
  }

  return res.status(204).end();
}
