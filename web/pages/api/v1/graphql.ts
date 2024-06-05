import { errorNotAllowed, errorUnauthenticated } from "@/legacy/backend/errors";
import { getAPIServiceClient } from "@/legacy/backend/graphql";
import { generateAPIKeyJWT, generateUserJWT } from "@/legacy/backend/jwts";
import { verifyHashedSecret } from "@/legacy/backend/utils";
import { gql } from "@apollo/client";
import { getSession } from "@auth0/nextjs-auth0";
import dayjs from "dayjs";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handleGraphQL(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (!req.method || !["POST"].includes(req.method)) {
    return errorNotAllowed(req.method, res, req);
  }

  if (!process.env.NEXT_PUBLIC_GRAPHQL_API_URL) {
    throw new Error(
      "Improperly configured. `NEXT_PUBLIC_GRAPHQL_API_URL` env var must be set.",
    );
  }

  const authorization = req.headers["authorization"]?.replace("Bearer ", "");

  // Strictly set the necessary properties to avoid passing other headers that wreak havoc (e.g. SSL certs collisions)
  const headers = new Headers();
  headers.append(
    "Content-Type",
    req.headers["content-type"] || "application/json",
  );

  // Check if request is authenticated with API key
  if (authorization?.startsWith("api_")) {
    const [key_id, secret] = Buffer.from(
      authorization.replace("api_", ""),
      "base64",
    )
      .toString()
      .split(":");

    // Get the hashed secret from the database
    const client = await getAPIServiceClient();
    const apiKeyQuery = gql`
      query ApiKeyQuery($key_id: String!) {
        api_key(where: { id: { _eq: $key_id }, is_active: { _eq: true } }) {
          id
          team_id
          api_key
        }
      }
    `;
    const response = await client.query({
      query: apiKeyQuery,
      variables: { key_id: key_id },
    });

    if (!response.data.api_key.length) {
      return errorUnauthenticated("Invalid or inactive API key.", res, req);
    }

    // Verify the secret against the given API key
    if (!verifyHashedSecret(key_id, secret, response.data.api_key[0].api_key)) {
      return errorUnauthenticated("Invalid API key secret.", res, req);
    }

    headers.delete("Authorization");
    headers.append(
      "Authorization",
      `Bearer ${await generateAPIKeyJWT(response.data.api_key[0].team_id)}`,
    );
  } else if (authorization) {
    // If we get a service key or reviewer key in the authorization header, pass it through
    headers.append("authorization", `Bearer ${authorization}`);
  }

  let body: string | undefined = undefined;
  try {
    body = JSON.stringify(req.body);
  } catch {}

  if (!body) {
    return res.status(415).json({
      code: "unsupported_media_type",
      detail: "The body request does not look like a valid JSON payload.",
      attribute: null,
    });
  }

  if (!headers.get("authorization")) {
    // NOTE: Check if user data exists in auth0 session and create a temporary user JWT
    const session = await getSession(req, res);
    let token: string | null = null;

    if (session?.user.hasura?.id) {
      const { token: generatedToken } = await generateUserJWT(
        session.user.hasura.id,
        dayjs().add(1, "minute").unix(),
      );

      token = generatedToken;
    }

    if (token) {
      headers.append("Authorization", `Bearer ${token}`);
    }
  }

  const response = await fetch(process.env.NEXT_PUBLIC_GRAPHQL_API_URL, {
    method: req.method,
    // @ts-ignore
    headers,
    body,
  });

  res.status(response.status).json(await response.json());
}
