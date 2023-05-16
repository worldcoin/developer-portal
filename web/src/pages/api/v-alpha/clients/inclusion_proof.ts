import { NextApiRequest, NextApiResponse } from "next";
import handleInclusionProof from "src/pages/api/v1/clients/inclusion_proof";

/**
 * Temporary redirect to the v1 endpoint, to be removed after mainnet
 * @param req
 * @param res
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  return handleInclusionProof(req, res);
}
