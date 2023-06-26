/**
 * Contains shared utilities that are reused for the Next.js API (backend)
 */
import { gql } from "@apollo/client";
import { randomUUID } from "crypto";
import { NextApiRequest, NextApiResponse } from "next";
import { IInternalError } from "src/lib/types";
import { getWLDAppBackendServiceClient } from "./graphql";
import crypto from "crypto";

const GENERAL_SECRET_KEY = process.env.GENERAL_SECRET_KEY;
if (!GENERAL_SECRET_KEY) {
  throw new Error(
    "Improperly configured. `GENERAL_SECRET_KEY` env var must be set!"
  );
}

const phoneVerifiedQuery = gql`
  query PhoneNumberVerified($identity_commitment: String!) {
    user(where: { phoneIdComm: { _eq: $identity_commitment } }) {
      publicKeyId
    }
  }
`;

/**
 * Ensures endpoint is properly authenticated using internal token. For interactions between Hasura -> Next.js API
 * @param req
 * @param res
 * @returns
 */
export const protectInternalEndpoint = (
  req: NextApiRequest,
  res: NextApiResponse
): boolean => {
  if (
    !process.env.INTERNAL_ENDPOINTS_SECRET ||
    req.headers.authorization?.replace("Bearer ", "") !==
      process.env.INTERNAL_ENDPOINTS_SECRET
  ) {
    res.status(403).json({
      code: "permission_denied",
      detail: "You do not have permission to perform this action.",
      attr: null,
    });
    return false;
  }
  return true;
};

/**
 * Ensures endpoint is properly authenticated using service token. For interactions between consumer backend (World App) -> Developer Portal API
 * @param req
 * @param res
 * @returns
 */
export const protectConsumerBackendEndpoint = (
  req: NextApiRequest,
  res: NextApiResponse
): boolean => {
  if (
    !process.env.CONSUMER_BACKEND_SECRET ||
    req.headers.authorization?.replace("Bearer ", "") !==
      process.env.CONSUMER_BACKEND_SECRET
  ) {
    res.status(403).json({
      code: "permission_denied",
      detail: "You do not have permission to perform this action.",
      attr: null,
    });
    return false;
  }
  return true;
};

/**
 * Checks whether the person can be verified for a particular action based on the max number of verifications
 */
export const canVerifyForAction = (
  nullifiers:
    | Array<{
        nullifier_hash: string;
      }>
    | undefined,
  max_verifications_per_person: number
): boolean => {
  if (!nullifiers?.length) {
    // Person has not verified before, can always verify for the first time
    return true;
  } else if (max_verifications_per_person <= 0) {
    // `0` or `-1` means unlimited verifications
    return true;
  }

  // Else, can only verify if the max number of verifications has not been met
  return (nullifiers?.length ?? 0) < max_verifications_per_person;
};

export const reportAPIEventToPostHog = async (
  event: string,
  distinct_id: string,
  props: Record<string, any>
): Promise<void> => {
  try {
    const response = await fetch("https://app.posthog.com/capture", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: process.env.NEXT_PUBLIC_POSTHOG_API_KEY,
        event,
        properties: {
          $lib: "worldcoin-server", // NOTE: This is required for PostHog to discard any IP data (or the server's address will be incorrectly attributed to the user)
          distinct_id: distinct_id || `srv-${randomUUID()}`,
          ...props,
        },
      }),
    });
    if (!response.ok) {
      console.error(
        `Error reporting ${event} to PostHog. Non-200 response: ${response.status}`,
        await response.text()
      );
    }
  } catch (e) {
    console.error(`Error reporting ${event} to PostHog`, e);
  }
};

/**
 * Check the consumer backend to see if the user's phone number is verified, and if so insert it on-the-fly
 */
export async function checkConsumerBackendForPhoneVerification({
  isStaging,
  identity_commitment,
  body,
}: {
  isStaging: boolean;
  identity_commitment: string;
  body: Record<string, any>; // FIXME: dirty, shouldn't be inserted this way
}): Promise<{ response: IInternalError } | undefined> {
  const client = await getWLDAppBackendServiceClient(isStaging);
  const phoneVerifiedResponse = await client.query({
    query: phoneVerifiedQuery,
    variables: { identity_commitment },
  });

  if (phoneVerifiedResponse.data.user.length) {
    console.info(
      `User's phone number is verified, but not on-chain. Inserting identity: ${identity_commitment}`
    );

    // FIXME: This is dirty, we should operate this internally
    const insertResponse = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/v1/clients/insert_identity`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.CONSUMER_BACKEND_SECRET}`,
          "Content-Type": "application/json",
          "User-Agent": "WorldcoinDeveloperPortal/v-alpha",
        },
        body: JSON.stringify(body),
      }
    );

    // Commitment inserted, return a pending inclusion error
    if (insertResponse.status === 204) {
      return {
        response: {
          code: "inclusion_pending",
          statusCode: 400,
          message:
            "This identity is in progress of being included on-chain. Please wait a few minutes and try again.",
        },
      };
    } else {
      // Commitment not inserted, return generic error
      console.error(
        `Error inserting identity on-the-fly: ${identity_commitment}`
      );
      return {
        response: {
          code: "server_error",
          statusCode: 503,
          message: "Something went wrong. Please try again.",
        },
      };
    }
  }
}

export const generateHashedSecret = (identifier: string) => {
  const secret = `sk_${crypto.randomBytes(24).toString("hex")}`;
  const hmac = crypto.createHmac("sha256", GENERAL_SECRET_KEY);
  hmac.update(`${identifier}.${secret}`);
  const hashed_secret = hmac.digest("hex");
  return { secret, hashed_secret };
};

export const verifyHashedSecret = (
  identifier: string,
  secret: string,
  hashed_secret: string
) => {
  const hmac = crypto.createHmac("sha256", GENERAL_SECRET_KEY);
  hmac.update(`${identifier}.${secret}`);
  const generated_secret = hmac.digest("hex");

  return generated_secret === hashed_secret;
};
