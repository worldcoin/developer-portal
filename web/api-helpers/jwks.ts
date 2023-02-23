import { gql } from "@apollo/client";
import { JWKModel } from "models";
import { getAPIServiceClient } from "./graphql";
import * as jose from "jose";
import { JWK_ALG } from "consts";

const fetchJWKQuery = gql`
  query FetchJWKQuery($now: timestamptz!) {
    jwks(limit: 1, where: { expires_at: { _gt: $now } }) {
      id
      private_jwk
    }
  }
`;

export const fetchActiveJWK = async () => {
  const client = await getAPIServiceClient();
  const { data } = await client.query<{
    jwks: Array<Pick<JWKModel, "id" | "private_jwk">>;
  }>({
    query: fetchJWKQuery,
    variables: {
      now: new Date().toISOString(),
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
export const generateJWK = async (): Promise<{
  privateJwk: jose.JWK;
  publicJwk: jose.JWK;
}> => {
  const { publicKey, privateKey } = await jose.generateKeyPair(JWK_ALG);

  const privateJwk = await jose.exportJWK(privateKey);
  const publicJwk = await jose.exportJWK(publicKey);

  return { privateJwk, publicJwk };
};
