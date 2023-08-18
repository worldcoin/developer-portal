import { NextApiRequest, NextApiResponse } from "next";
import { _deleteExpiredJWKs, createAndStoreJWK } from "src/backend/jwks";
import { protectInternalEndpoint } from "src/backend/utils";
import { errorNotAllowed } from "../../backend/errors";
import { logger } from "src/lib/logger";

/**
 * Generates JWKs to verify proofs offline
 * @param req
 * @param res
 */
export default async function handleDeleteJWKS(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (!protectInternalEndpoint(req, res)) {
    return;
  }

  if (req.method !== "POST") {
    return errorNotAllowed(req.method, res, req);
  }

  logger.info("Starting deletion of expired jwks.");

  const response = await _deleteExpiredJWKs();

  logger.info(`Deleted ${response} expired jwks.`);

  return res.status(204).end();
}
