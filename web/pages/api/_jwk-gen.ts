import { gql } from "@apollo/client";
import { getAPIServiceClient } from "api-helpers/graphql";
import { generateJWK, protectInternalEndpoint } from "api-helpers/jwts";
import { NextApiRequest, NextApiResponse } from "next";
import { errorNotAllowed } from "../../api-helpers/errors";

/**
 * Generates JWKs to verify proofs offline
 * @param req
 * @param res
 */
export default async function handleJWKGen(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (!protectInternalEndpoint(req, res)) {
    return;
  }

  if (req.method !== "POST") {
    return errorNotAllowed(req.method, res);
  }

  const { publicJwk, privateJwk } = await generateJWK();

  const insertQuery = gql(`
  mutation InsertKey($expires_at: timestamptz!, $private_jwk: jsonb!, $public_jwk: jsonb!) {
    insert_jwks_one(object: {
        expires_at: $expires_at
        private_jwk: $private_jwk
        public_jwk: $public_jwk
    })
    {
        id
        expires_at
    }
  }`);

  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + 12);
  const client = await getAPIServiceClient();
  const response = await client.query({
    query: insertQuery,
    variables: {
      expires_at: expiresAt.toISOString(),
      private_jwk: privateJwk,
      public_jwk: publicJwk,
    },
  });

  res.status(201).json({ success: true, jwk: response.data.insert_jwks_one });
}
