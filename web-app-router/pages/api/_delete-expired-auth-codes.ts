import { gql } from "@apollo/client";
import { getAPIServiceClient } from "@/legacy/backend/graphql";
import { protectInternalEndpoint } from "@/legacy/backend/utils";
import { NextApiRequest, NextApiResponse } from "next";
import { errorNotAllowed } from "@/legacy/backend/errors";
import { logger } from "@/legacy/lib/logger";

/**
 * Deletes expired auth codes
 * @param req
 * @param res
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (!protectInternalEndpoint(req, res)) {
    return;
  }

  if (req.method !== "POST") {
    return errorNotAllowed(req.method, res, req);
  }

  logger.info("Starting deletion of expired auth codes.");

  const mutation = gql`
    mutation DeleteExpiredAuthCodes($now: timestamptz!) {
      delete_auth_code(where: { expires_at: { _lte: $now } }) {
        affected_rows
      }
    }
  `;

  const client = await getAPIServiceClient();
  const response = await client.mutate<{
    delete_auth_code: { affected_rows: number };
  }>({
    mutation,
    variables: {
      now: new Date().toISOString(),
    },
  });

  logger.info(
    `Deleted ${response.data?.delete_auth_code.affected_rows} expired auth codes.`
  );

  res.status(204).end();
}
