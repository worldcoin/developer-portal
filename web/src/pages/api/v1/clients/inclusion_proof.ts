import { NextApiRequest, NextApiResponse } from "next";

/**
 * Checks if the given identity commitment is in the revocation table, and if false,
 * queries an inclusion proof from the relevant signup sequencer
 * @param req
 * @param res
 */
export default async function handleInclusionProof(
  req: NextApiRequest,
  res: NextApiResponse
) {
  return res
    .status(400)
    .json({ message: "This endpoint is currently unavailable." });
}
