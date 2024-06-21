import "server-only";

import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import {
  createKMSKey,
  getKMSClient,
  scheduleKeyDeletion,
} from "@/api/helpers/kms";
import { JWK_TIME_TO_LIVE, JWK_TTL_USABLE } from "@/lib/constants";
import { logger } from "@/lib/logger";
import { createPublicKey } from "crypto";
import dayjs from "dayjs";

import {
  getSdk as getRetrieveJWKSdk,
  RetrieveJwkQuery,
} from "./graphql/retrieve-jwk.generated";

import {
  FetchActiveJwKsByExpirationQuery,
  getSdk as fetchActiveJWKsByExpirationSdk,
} from "./graphql/fetch-active-jwks-by-expiration-query.generated";

import {
  InsertJwkMutation,
  getSdk as insertJWKSdk,
} from "./graphql/insert-jwk.generated";

import {
  DeleteExpiredJwKsMutation,
  getSdk as deleteExpiredJWKsSdk,
} from "./graphql/delete-expired-jwks.generated";

export type CreateJWKResult = {
  keyId: string;
  publicJwk: JsonWebKey;
  createdAt: Date;
};
/**
 * Get the public JWK for a given kid
 * @param kid
 * @returns
 */
export const retrieveJWK = async (kid: string) => {
  const client = await getAPIServiceGraphqlClient();

  let jwks: RetrieveJwkQuery["jwks"] | null = null;

  try {
    const data = await getRetrieveJWKSdk(client).RetrieveJWK({
      kid,
    });

    jwks = data.jwks;
  } catch (error) {
    logger.error("Error retrieving JWK.", { error });

    throw error;
  }

  if (!jwks?.length) {
    throw new Error("JWK not found.");
  }

  const { id, kms_id, public_jwk } = jwks[0];
  return { kid: id, kms_id, public_jwk };
};

/**
 * Generates an RS256 asymmetric key pair in JWK format
 * @returns
 */
export const generateJWK = async (): Promise<CreateJWKResult> => {
  const client = await getKMSClient();

  if (client) {
    const result = await createKMSKey(client, "RSA_2048");
    if (result?.keyId && result?.publicKey) {
      const publicJwk = createPublicKey(result.publicKey).export({
        format: "jwk",
      });

      return { keyId: result.keyId, publicJwk, createdAt: result.createdAt };
    } else {
      throw new Error("Unable to create KMS key.");
    }
  } else {
    throw new Error("KMS client not found.");
  }
};

/**
 * Generate new JWK. Generates a new KMS key and stores the public key in the database.
 * @param alg
 * @returns
 */
export const createAndStoreJWK = async () => {
  const key = await generateJWK();
  const expiresAt = dayjs(key.createdAt).add(JWK_TIME_TO_LIVE, "day");

  const client = await getAPIServiceGraphqlClient();

  let insertResult: InsertJwkMutation["insert_jwks_one"] | null = null;

  try {
    const { insert_jwks_one } = await insertJWKSdk(client).InsertJWK({
      expires_at: expiresAt.toISOString(),
      kms_id: key.keyId,
      public_jwk: key.publicJwk,
    });

    insertResult = insert_jwks_one;
  } catch (error) {
    logger.error("Error inserting JWK.", { error });
    throw error;
  }

  if (insertResult) {
    return insertResult;
  }

  logger.error("Unable to create new JWK.", { insertResult });
  throw new Error("Unable to create new JWK.");
};

/**
 * Fetches an active JWK to sign requests, and otherwise rotates the key
 * @param alg
 * @returns
 */
export const fetchActiveJWK = async () => {
  const apiClient = await getAPIServiceGraphqlClient();

  let jwks: FetchActiveJwKsByExpirationQuery["jwks"] | null = null;

  try {
    const data = await fetchActiveJWKsByExpirationSdk(
      apiClient,
    ).FetchActiveJWKsByExpiration({
      expires_at: new Date().toISOString(),
    });

    jwks = data.jwks;
  } catch (error) {
    logger.error("Error fetching active JWK.", { error });
    throw error;
  }

  // JWK is still active
  if (jwks?.length) {
    const { id, kms_id, expires_at } = jwks[0];

    // Only return JWK if it's not expiring in the next few days
    const now = dayjs();
    const expires = dayjs(expires_at);
    if (expires.diff(now, "day") > JWK_TTL_USABLE) {
      return { kid: id, kms_id };
    }
  }

  // JWK is expired or expiring soon, rotate the key
  const jwk = await createAndStoreJWK();
  return { kid: jwk.id, kms_id: jwk.kms_id };
};

/**
 * Delete all expired JWKs from the database
 * @returns
 */
export const _deleteExpiredJWKs = async () => {
  const apiClient = await getAPIServiceGraphqlClient();

  let deleteResult: DeleteExpiredJwKsMutation["delete_jwks"] | null = null;

  try {
    const data = await deleteExpiredJWKsSdk(apiClient).DeleteExpiredJWKs({
      expired_by: new Date(Date.now() - 20 * 60 * 1000).toISOString(), // 20 minutes ago
    });

    deleteResult = data.delete_jwks;
  } catch (error) {
    logger.error("Error deleting expired JWKs.", { error });
    throw error;
  }

  if (deleteResult?.returning) {
    // Schedule each KMS key for deletion
    const kmsClient = await getKMSClient();

    if (kmsClient) {
      for (const key of deleteResult.returning) {
        if (!key.kms_id) {
          logger.error("KMS ID not found for JWK.", { key });

          continue;
        }

        await scheduleKeyDeletion(kmsClient, key.kms_id);
      }
    }

    return deleteResult.returning.length;
  }
};
