import { gql } from "@apollo/client";
import { NextApiRequest, NextApiResponse } from "next";
import { getAPIServiceClient } from "src/backend/graphql";
import { generateJWK } from "src/backend/jwks";
import { protectInternalEndpoint } from "src/backend/utils";
import { errorNotAllowed, errorValidation } from "../../backend/errors";

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

  const alg = req.body.alg || "RS256";

  if (!["RS256"].includes(alg)) {
    return errorValidation(
      "invalid_algorithm",
      "Invalid algorithm.",
      "alg",
      res
    );
  }

  const publicJwk = await generateJWK(alg);

  const insertQuery = gql(`
  mutation InsertJWK($expires_at: timestamptz!, $public_jwk: jsonb!, $alg: String!) {
    insert_jwks_one(object: {
        expires_at: $expires_at
        public_jwk: $public_jwk
        alg: $alg
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
      public_jwk: publicJwk,
      alg,
    },
  });

  res.status(201).json({ success: true, jwk: response.data.insert_jwks_one });
}
