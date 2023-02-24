import { gql } from "@apollo/client";
import { getAPIServiceClient } from "api-helpers/graphql";
import { generateAnalyticsJWT, generateAPIKeyJWT } from "api-helpers/jwts";
import { errorUnauthenticated } from "api-helpers/errors";
import { NextApiRequest, NextApiResponse } from "next";
import getConfig from "next/config";
const { publicRuntimeConfig } = getConfig();

export default async function handleGraphQL(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (!publicRuntimeConfig.NEXT_PUBLIC_GRAPHQL_API_URL) {
    throw new Error(
      "Improperly configured. `NEXT_PUBLIC_GRAPHQL_API_URL` env var must be set."
    );
  }

  const authorization = req.headers["authorization"]?.replace("Bearer ", "");

  // Strictly set the necessary properties to avoid passing other headers that wreak havoc (e.g. SSL certs collisions)
  const headers = new Headers();
  headers.append(
    "Content-Type",
    req.headers["content-type"] || "application/json"
  );

  if (req.headers["authorization"]) {
    headers.append("Authorization", req.headers["authorization"]);
  }

  // Check if request is authenticated with API key
  if (authorization?.startsWith("key_")) {
    const client = await getAPIServiceClient();
    const apiKeyQuery = gql`
      query ApiKeyQuery($apiKey: String!) {
        api_key(where: { is_active: { _eq: true }, id: { _eq: $apiKey } }) {
          id
          team_id
        }
      }
    `;
    const response = await client.query({
      query: apiKeyQuery,
      variables: { apiKey: authorization },
    });
    if (!response.data.api_key.length) {
      return errorUnauthenticated("Invalid or inactive API key.", res);
    }

    headers.delete("Authorization");
    headers.append(
      "Authorization",
      `Bearer ${await generateAPIKeyJWT(response.data.api_key[0].team_id)}`
    );
  }

  // Check if request is from the analytics service
  if (authorization?.startsWith("analytics_")) {
    if (authorization !== process.env.ANALYTICS_API_KEY) {
      return errorUnauthenticated("Invalid analytics API key", res);
    }

    headers.delete("Authorization");
    headers.append("Authorization", `Bearer ${await generateAnalyticsJWT()}`);
  }

  let body: string | undefined = undefined;
  try {
    body = JSON.stringify(req.body);
  } catch {}

  if (!body) {
    return res.status(415).json({
      code: "unsupported_media_type",
      detail: "The body request does not look like a valid JSON payload.",
      attr: null,
    });
  }

  const response = await fetch(
    publicRuntimeConfig.NEXT_PUBLIC_GRAPHQL_API_URL,
    {
      method: req.method,
      // @ts-ignore
      headers,
      body,
    }
  );

  res.status(response.status).json(await response.json());
}
