import { gql } from "@apollo/client";
import { createPublicKey } from "crypto";
import { JWKModel } from "src/lib/models";
import { getAPIServiceClient } from "./graphql";
import { createKMSKey, getKMSClient } from "./kms";

export type CreateJWKResult = {
  keyId: string;
  publicJwk: JsonWebKey;
};

const fetchJWKQuery = gql`
  query FetchJWKQuery($now: timestamptz!, $alg: String!) {
    jwks(limit: 1, where: { expires_at: { _gt: $now }, alg: { _eq: $alg } }) {
      id
      alg
      kms_id
    }
  }
`;

const retrieveJWKQuery = gql`
  query RetrieveJWKQuery($kid: String!) {
    jwks(limit: 1, where: { id: { _eq: $kid } }) {
      id
      kms_id
      public_jwk
    }
  }
`;

const deleteJWKQuery = gql`
  mutation MyMutation($alg: String!) {
    delete_jwks(where: { alg: { _eq: $alg } }) {
      affected_rows
    }
  }
`;

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
 * Retrieves an active JWK to sign requests
 * @returns
 */
export const fetchActiveJWK = async (alg: string) => {
  const apiClient = await getAPIServiceClient();
  const { data } = await apiClient.query<{
    jwks: Array<Pick<JWKModel, "id" | "kms_id">>;
  }>({
    query: fetchJWKQuery,
    variables: {
      now: new Date().toISOString(),
      alg,
    },
  });

  // JWK is still active, so return
  if (data.jwks?.length) {
    const { id, kms_id } = data.jwks[0];
    return { kid: id, kms_id };
  }

  // No active JWK found, rotate the existing keys
  const jwk = await _rotateJWK(alg);
  return { kid: jwk.id, kms_id: jwk.kms_id };
};

/**
 * Generates an asymmetric key pair in JWK format
 * @returns
 */
export const generateJWK = async (alg: string): Promise<CreateJWKResult> => {
  const client = await getKMSClient();

  if (client) {
    const result = await createKMSKey(client, "RSA_2048"); // TODO: transform alg parameter?
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
 */
const _rotateJWK = async (alg: string) => {
  // Delete the old JWK before generating a new one
  const client = await getAPIServiceClient();
  const deleteResponse = await client.mutate({
    mutation: deleteJWKQuery,
    variables: {
      alg,
    },
  });

  // Generate a new JWK for the given algorithm
  if (deleteResponse.data) {
    const rotateResponse = await fetch(
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

    if (rotateResponse.ok) {
      const { jwk } = await rotateResponse.json();
      return jwk;
    }
  }
  throw new Error("Unable to rotate JWK.");
};
