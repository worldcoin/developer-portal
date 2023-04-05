import { gql } from "@apollo/client";
import { createPublicKey } from "crypto";
import dayjs from "dayjs";
import { JWKModel } from "src/lib/models";
import { getAPIServiceClient } from "./graphql";
import { createKMSKey, getKMSClient, scheduleKeyDeletion } from "./kms";

export type CreateJWKResult = {
  keyId: string;
  publicJwk: JsonWebKey;
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
  query FetchActiveJWKsByExpiration($alg: String!, $expires_at: timestamptz!) {
    jwks(
      where: { alg: { _eq: $alg }, expires_at: { _gt: $expires_at } }
      order_by: { expires_at: desc }
    ) {
      id
      alg
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
export const fetchActiveJWK = async (alg: string) => {
  const apiClient = await getAPIServiceClient();
  const { data } = await apiClient.query<{
    jwks: Array<Pick<JWKModel, "id" | "kms_id" | "expires_at">>;
  }>({
    query: fetchActiveJWKsByExpirationQuery,
    variables: {
      alg,
      expires_at: new Date().toISOString(),
    },
  });

  // JWK is still active
  if (data.jwks?.length) {
    const { id, kms_id, expires_at } = data.jwks[0];

    // Only return JWK if it's not expiring in the next 7 days
    const now = dayjs();
    const expires = dayjs(expires_at);
    if (expires.diff(now, "day") > 7) {
      return { kid: id, kms_id };
    }
  }

  // JWK is expired or expiring soon, rotate the key
  const jwk = await _rotateJWK(alg);

  // Delete all expired JWKs
  await _deleteExpiredJWKs();

  return { kid: jwk.id, kms_id: jwk.kms_id };
};

/**
 * Generates an RS256 asymmetric key pair in JWK format
 * @returns
 */
export const generateJWK = async (): Promise<CreateJWKResult> => {
  const client = await getKMSClient();

  if (client) {
    const result = await createKMSKey(client, "RSA_2048"); // TODO: alg parameter for other key types
    if (result?.keyId && result?.publicKey) {
      const publicJwk = createPublicKey(result.publicKey).export({
        format: "jwk",
      });

      return { keyId: result.keyId, publicJwk };
    } else {
      throw new Error("Unable to create KMS key.");
    }
  } else {
    throw new Error("KMS client not found.");
  }
};

/**
 * Rotates the given JWK key by generating a new KMS key, and dropping the old value
 * @param alg
 * @returns
 */
const _rotateJWK = async (alg: string) => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/_jwk-gen`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.INTERNAL_ENDPOINTS_SECRET}`,
      },
      body: JSON.stringify({ alg }),
    }
  );

  if (response.ok) {
    const { jwk } = await response.json();
    return jwk;
  }

  throw new Error("Unable to rotate JWK.");
};

/**
 * Delete all expired JWKs from the database
 * @returns
 */
const _deleteExpiredJWKs = async () => {
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
  }

  throw new Error("Unable to delete expired JWKs.");
};
