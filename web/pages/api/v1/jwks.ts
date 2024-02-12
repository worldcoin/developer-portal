import { gql } from "@apollo/client";
import { getAPIServiceClient } from "@/legacy/backend/graphql";
import { runCors } from "@/legacy/backend/cors";
import { NextApiRequest, NextApiResponse } from "next";
import { errorNotAllowed } from "@/legacy/backend/errors";

/**
 * Retrieves JWKs to verify proofs
 * @param req
 * @param res
 */
export default async function handleJWKs(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  await runCors(req, res);
  if (!req.method || !["GET", "OPTIONS"].includes(req.method)) {
    return errorNotAllowed(req.method, res, req);
  }

  const query = gql`
    query JWKQuery {
      jwks {
        id
        expires_at
        key: public_jwk
      }
    }
  `;

  const client = await getAPIServiceClient();
  const response = await client.query({
    query,
  });

  const keys = [];
  for (const { id, key } of response.data.jwks) {
    keys.push({ ...key, kid: id });
  }

  res.status(200).json({ keys });
}
