import { gql } from "@apollo/client";
import { getAPIServiceClient } from "api-graphql";
import { protectInternalEndpoint } from "api-utils";
import { errorNotAllowed } from "errors";
import { NextApiRequest, NextApiResponse } from "next";

export default async function clearExpiredInvites(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (!protectInternalEndpoint(req, res)) {
    return;
  }

  if (req.method !== "POST") {
    return errorNotAllowed(req.method, res);
  }

  const query = gql`
    mutation {
      delete_invite(where: { expires_at: { _lt: "now()" } }) {
        returning {
          id
        }
      }
    }
  `;
  const client = await getAPIServiceClient();
  await client.query({ query });

  res.status(200).json({ success: true });
}
