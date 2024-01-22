import { gql } from "@apollo/client";
import { createPublicKey } from "crypto";
import dayjs from "dayjs";
import { JWKModel } from "@/legacy/lib/models";
import { getAPIServiceClient } from "./graphql";
import { createKMSKey, getKMSClient, scheduleKeyDeletion } from "./kms";
import { JWK_TIME_TO_LIVE, JWK_TTL_USABLE } from "@/legacy/lib/constants";
import { logger } from "@/legacy/lib/logger";

export type CreateJWKResult = {
  keyId: string;
  publicJwk: JsonWebKey;
  createdAt: Date;
};

const retrieveJWKQuery = gql`
  query RetrieveJWK($kid: String!) {
    jwks(limit: 1, where: { id: { _eq: $kid } }) {
      id
      kms_id
      public_jwk
    }
  }
`;

const fetchActiveJWKsByExpirationQuery = gql`
  query FetchActiveJWKsByExpiration($expires_at: timestamptz!) {
    jwks(
      where: { expires_at: { _gt: $expires_at } }
      order_by: { expires_at: desc }
    ) {
      id
      kms_id
      expires_at
    }
  }
`;

const insertJWKQuery = gql`
  mutation InsertJWK(
    $expires_at: timestamptz!
    $public_jwk: jsonb!
    $kms_id: String!
  ) {
    insert_jwks_one(
      object: {
        expires_at: $expires_at
        kms_id: $kms_id
        public_jwk: $public_jwk
      }
    ) {
      id
      kms_id
      expires_at
    }
  }
`;

const deleteExpiredJWKsQuery = gql`
  mutation DeleteExpiredJWKs($expired_by: timestamptz = "") {
    delete_jwks(where: { expires_at: { _lte: $expired_by } }) {
      returning {
        id
        kms_id
      }
    }
  }
`;

/**
 * Get the public JWK for a given kid
 * @param kid
 * @returns
 */
export const retrieveJWK = async (kid: string) => {
  const client = await getAPIServiceClient();
  const { data } = await client.query<{
    jwks: Array<Pick<JWKModel, "id" | "kms_id" | "public_jwk">>;
  }>({
    query: retrieveJWKQuery,
    variables: {
      kid,
    },
  });

  if (!data.jwks?.length) {
    throw new Error("JWK not found.");
  }

  const { id, kms_id, public_jwk } = data.jwks[0];
  return { kid: id, kms_id, public_jwk };
};

/**
 * Fetches an active JWK to sign requests, and otherwise rotates the key
 * @param alg
 * @returns
 */
export const fetchActiveJWK = async () => {
  const apiClient = await getAPIServiceClient();
  const { data } = await apiClient.query<{
    jwks: Array<Pick<JWKModel, "id" | "kms_id" | "expires_at">>;
  }>({
    query: fetchActiveJWKsByExpirationQuery,
    variables: {
      expires_at: new Date().toISOString(),
    },
  });

  // JWK is still active
  if (data.jwks?.length) {
    const { id, kms_id, expires_at } = data.jwks[0];

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

  const client = await getAPIServiceClient();
  const response = await client.mutate<{
    insert_jwks_one: Pick<JWKModel, "id" | "kms_id" | "expires_at">;
  }>({
    mutation: insertJWKQuery,
    variables: {
      expires_at: expiresAt.toISOString(),
      kms_id: key.keyId,
      public_jwk: key.publicJwk,
    },
  });

  if (response.data?.insert_jwks_one) {
    return response.data.insert_jwks_one;
  }

  logger.error("Unable to create new JWK.", { response });
  throw new Error("Unable to create new JWK.");
};

/**
 * Delete all expired JWKs from the database
 * @returns
 */
export const _deleteExpiredJWKs = async () => {
  const apiClient = await getAPIServiceClient();
  const response = await apiClient.mutate({
    mutation: deleteExpiredJWKsQuery,
    variables: {
      expired_by: new Date(Date.now() - 20 * 60 * 1000).toISOString(), // 20 minutes ago
    },
  });

  if (response.data.delete_jwks.returning) {
    // Schedule each KMS key for deletion
    const kmsClient = await getKMSClient();
    if (kmsClient) {
      for (const key of response.data.delete_jwks.returning) {
        await scheduleKeyDeletion(kmsClient, key.kms_id);
      }
    }
    return response.data.delete_jwks.returning.length;
  }
};
