/**
 * Contains shared utilities that are reused for the Next.js API (backend)
 */
import { gql } from "@apollo/client";
import { randomUUID } from "crypto";
import { CacheModel } from "src/lib/models";
import { NextApiRequest, NextApiResponse } from "next";
import { getAPIServiceClient } from "./graphql";

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
  nullifiers: Array<{
    nullifier_hash: string;
  }>,
  max_verifications_per_person: number
): boolean => {
  if (!nullifiers.length) {
    // Person has not verified before, can always verify for the first time
    return true;
  } else if (max_verifications_per_person <= 0) {
    // `0` or `-1` means unlimited verifications
    return true;
  }

  // Else, can only verify if the max number of verifications has not been met
  return nullifiers.length < max_verifications_per_person;
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

export const fetchSmartContractAddress = async (
  is_staging: boolean
): Promise<string> => {
  const fetchContractsQuery = gql`
    query FetchContracts {
      cache(
        where: {
          _or: [
            { key: { _eq: "semaphore.wld.eth" } }
            { key: { _eq: "staging.semaphore.wld.eth" } }
          ]
        }
      ) {
        key
        value
      }
    }
  `;

  const client = await getAPIServiceClient();
  const { data } = await client.query<{
    cache: Array<Pick<CacheModel, "key" | "value">>;
  }>({ query: fetchContractsQuery });

  const contractKey = is_staging
    ? "staging.semaphore.wld.eth"
    : "semaphore.wld.eth";
  const contract = data.cache.find((c) => c.key === contractKey);

  if (!contract) {
    throw new Error(
      `Improperly configured. Could not find smart contract address for ${contractKey}.`
    );
  }

  return contract.value;
};
