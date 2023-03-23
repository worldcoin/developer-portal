import { gql } from "@apollo/client";
import * as jose from "jose";
import { JWKModel } from "src/lib/models";
import { getAPIServiceClient } from "./graphql";

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
export const generateJWK = async (
  alg: string
): Promise<{
  privateJwk: jose.JWK;
  publicJwk: jose.JWK;
}> => {
  const { publicKey, privateKey } = await jose.generateKeyPair(alg);

  const privateJwk = await jose.exportJWK(privateKey);
  const publicJwk = await jose.exportJWK(publicKey);

  return { privateJwk, publicJwk };
};
