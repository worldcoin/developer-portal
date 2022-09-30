import { NextApiRequest, NextApiResponse } from "next";
import handleVerifyPrecheck from "../v1/precheck/[action_id]";

/**
 * FIXME: Temporary redirect for iOS app 1.1.0 (568+);
 * should be removed after most users upgrade.
 * DEPRECATED: This endpoint is deprecated, please do not use.
 * @param req
 * @param res
 */
export default async function handleTemporaryVerifyPrecheck(
  req: NextApiRequest,
  res: NextApiResponse
) {
  return handleVerifyPrecheck(req, res);
}
