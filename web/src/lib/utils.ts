import { gql } from "@apollo/client";
import { NextApiRequest, NextApiResponse } from "next";
import { getWLDAppBackendServiceClient } from "src/backend/graphql";
import { EnvironmentType } from "src/lib/types";

export const ENVIRONMENTS: EnvironmentType[] = [
  { name: "Production", value: "production", icon: { name: "rocket" } },
  { name: "Staging", value: "staging", icon: { name: "chart" } },
];

const phoneVerifiedQuery = gql`
  query PhoneNumberVerified($identity_commitment: String!) {
    user(where: { phoneIdComm: { _eq: $identity_commitment } }) {
      publicKeyId
    }
  }
`;

/**
 * Validates a string is a valid URL
 * @param candidate
 * @returns
 */
export const validateUrl = (candidate: string): boolean => {
  let parsedUrl;
  try {
    parsedUrl = new URL(candidate);
  } catch (_) {
    return false;
  }

  const isLocalhost = parsedUrl.hostname === "localhost";
  const isHttps = parsedUrl.protocol === "https:";

  if (!isLocalhost) {
    return isHttps;
  }

  const localhostRegex =
    /^https?:\/\/localhost(:[0-9]+)?(\/[^\s?]*)(\\?[^\s]*)?$/;

  return localhostRegex.test(candidate);
};

/**
 * Validates the string looks like a valid email address
 * @param candidate
 * @returns
 */
export const validateEmail = (candidate: string): boolean => {
  return Boolean(
    candidate.match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    )
  );
};

export const isSSR = () => typeof window === "undefined";

/**
 * Check the consumer backend to see if the user's phone number is verified, and if so insert it on-the-fly
 * @param req
 * @param res
 * @param isStaging
 * @returns
 */
export async function checkConsumerBackend(
  req: NextApiRequest,
  res: NextApiResponse,
  isStaging: boolean
) {
  const client = await getWLDAppBackendServiceClient(isStaging);
  const phoneVerifiedResponse = await client.query({
    query: phoneVerifiedQuery,
    variables: { identity_commitment: req.body.identity_commitment },
  });

  if (phoneVerifiedResponse.data.user.length) {
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

    // Commitment inserted, return a pending inclusion error
    if (insertResponse.status === 204) {
      res.status(400).json({
        code: "inclusion_pending",
        detail:
          "This identity is in progress of being included on-chain. Please wait a few minutes and try again.",
      });
      return true;
    }

    // Commitment not inserted, return generic error
    else {
      console.error(
        `Error inserting identity on-the-fly: ${req.body.identity_commitment}`
      );
      res.status(503).json({
        code: "server_error",
        detail: "Something went wrong. Please try again.",
      });
      return true;
    }
  }

  // Request not handled, continue the normal flow
  return false;
}
