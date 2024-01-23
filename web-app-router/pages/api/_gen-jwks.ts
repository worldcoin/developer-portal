import { NextApiRequest, NextApiResponse } from "next";
import { createAndStoreJWK } from "@/legacy/backend/jwks";
import { protectInternalEndpoint } from "@/legacy/backend/utils";
import { errorNotAllowed } from "@/legacy/backend/errors";

/**
 * Generates JWKs to verify proofs offline
 * @param req
 * @param res
 */
export default async function handleGenJWKS(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (!protectInternalEndpoint(req, res)) {
    return;
  }

  if (req.method !== "POST") {
    return errorNotAllowed(req.method, res, req);
  }

  const jwk = await createAndStoreJWK();

  return res.status(201).json({ success: true, jwk });
}
