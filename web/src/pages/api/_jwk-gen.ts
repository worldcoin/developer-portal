import { gql } from "@apollo/client";
import { NextApiRequest, NextApiResponse } from "next";
import { getAPIServiceClient } from "src/backend/graphql";
import { generateJWK } from "src/backend/jwks";
import { protectInternalEndpoint } from "src/backend/utils";
import {
  errorNotAllowed,
  errorResponse,
  errorValidation,
} from "../../backend/errors";

const insertQuery = gql`
  mutation InsertJWK(
    $expires_at: timestamptz!
    $public_jwk: jsonb!
    $alg: String!
    $kms_id: String!
  ) {
    insert_jwks_one(
      object: {
        alg: $alg
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

  const result = await generateJWK();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 14); // 2 weeks

  const client = await getAPIServiceClient();
  const response = await client.query({
    query: insertQuery,
    variables: {
      alg,
      expires_at: expiresAt.toISOString(),
      kms_id: result.keyId,
      public_jwk: result.publicJwk,
    },
  });

  if (response.data.insert_jwks_one) {
    return res
      .status(201)
      .json({ success: true, jwk: response.data.insert_jwks_one });
  }
  return errorResponse(
    res,
    500,
    "jwk_generation_failed",
    "Failed to generate JWK."
  );
}
