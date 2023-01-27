import { gql } from "@apollo/client";
import { getAPIServiceClient } from "api-graphql";
import { errorNotAllowed } from "errors";
import { NextApiRequest, NextApiResponse } from "next";

/**
 * Returns the number of World ID verifications, within the optional time window
 * @param req
 * @param res
 */
export default async function handleVerifications(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (!req.method || !["GET", "OPTIONS"].includes(req.method)) {
    return errorNotAllowed(req.method, res);
  }

  const start = (req.query.start as string) || "2022-01-01";
  const end = (req.query.end as string) || new Date().toISOString();

  const query = gql`
    query VerificationQuery($start: timestamptz, $end: timestamptz) {
      nullifier_aggregate(where: { created_at: { _gte: $start, _lt: $end } }) {
        aggregate {
          count(columns: nullifier_hash, distinct: true)
        }
      }
    }
  `;

  const client = await getAPIServiceClient();
  const response = await client.query({
    query,
    variables: {
      start,
      end,
    },
  });

  if (!response.data.nullifier_aggregate) {
    res.status(500).json({ success: false, response: response });
  }

  res.status(200).json({
    success: true,
    count: response.data.nullifier_aggregate.aggregate.count,
  });
}
