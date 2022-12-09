import { gql } from "@apollo/client";
import { getAPIServiceClient } from "api-graphql";
import { errorRequiredAttribute } from "errors";
import { NextApiRequest, NextApiResponse } from "next";

const VERIFF_BASE_URL = "https://stationapi.veriff.com";

// FIXME: Currently these endpoints assume only staging environment. We need to add support for production

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (!process.env.VERIFF_PUBLIC_KEY) {
    throw new Error("VERIFF_PUBLIC_KEY is not set");
  }

  const { identity_commitment } = req.body;

  if (!identity_commitment) {
    return errorRequiredAttribute("identity_commitment", res);
  }

  const veriffResponse = await fetch(`${VERIFF_BASE_URL}/v1/sessions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-AUTH-CLIENT": process.env.VERIFF_PUBLIC_KEY,
    },
    body: JSON.stringify({
      verification: {
        timestamp: new Date().toISOString(),
        // document: {
        //   type: "PASSPORT",
        // },
      },
    }),
  });

  if (!veriffResponse.ok) {
    console.warn(
      "Veriff response not ok",
      veriffResponse.status,
      await veriffResponse.json()
    );
    return res.status(500).end();
  }

  const {
    verification: { url, id: session_id },
  } = await veriffResponse.json();

  // Store session ID in the database so we can later match it to the callback
  const query = gql`
    mutation InsertDocCheck(
      $identity_commitment: String!
      $session_id: String!
    ) {
      insert_doc_check_one(
        object: {
          identity_commitment: $identity_commitment
          session_id: $session_id
        }
      ) {
        id
      }
    }
  `;

  const client = await getAPIServiceClient();
  await client.query({
    query,
    variables: { identity_commitment, session_id },
  });

  return res.status(200).json({ url, session_id });
}
