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
      private_jwk
    }
  }
`;

const retrieveJWKQuery = gql`
  query RetrieveJWKQuery($kid: String!) {
    jwks(limit: 1, where: { id: { _eq: $kid } }) {
      id
      public_jwk
    }
  }
`;

export const retrieveJWK = async (kid: string) => {
  const client = await getAPIServiceClient();
  const { data } = await client.query<{
    jwks: Array<Pick<JWKModel, "id" | "public_jwk">>;
  }>({
    query: retrieveJWKQuery,
    variables: {
      kid,
    },
  });

  if (!data.jwks?.length) {
    throw new Error("JWK not found.");
  }

  const { id, public_jwk } = data.jwks[0];
  return { kid: id, public_jwk };
};

/**
 * Retrieves an active JWK to sign requests
 * @returns
 */
export const fetchActiveJWK = async (alg: string) => {
  const client = await getAPIServiceClient();
  const { data } = await client.query<{
    jwks: Array<Pick<JWKModel, "id" | "private_jwk">>;
  }>({
    query: fetchJWKQuery,
    variables: {
      now: new Date().toISOString(),
      alg,
    },
  });

  if (!data.jwks?.length) {
    throw new Error("No valid JWKs were found.");
  }

  const { id, private_jwk } = data.jwks[0];
  return { kid: id, private_jwk };
};

/**
 * Generates an asymmetric key pair in JWK format
 * @returns
 */
export const generateJWK = async (alg: string): Promise<CreateJWKResult> => {
  const kmsClient = await getKMSClient();

  if (kmsClient) {
    const result = await createKMSKey(kmsClient, "RSA_2048"); // TODO: transform alg parameter?
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
