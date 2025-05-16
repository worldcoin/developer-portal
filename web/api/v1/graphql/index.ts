import { errorUnauthenticated } from "@/api/helpers/errors";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { generateAPIKeyJWT, generateUserJWT } from "@/api/helpers/jwts";
import { verifyHashedSecret } from "@/api/helpers/utils";
import { getSession } from "@auth0/nextjs-auth0";
import dayjs from "dayjs";
import { NextRequest, NextResponse } from "next/server";
import { getSdk as getApiKeySdk } from "./graphql/get-api-key.generated";

export async function POST(req: NextRequest) {
  if (!process.env.NEXT_PUBLIC_GRAPHQL_API_URL) {
    throw new Error(
      "Improperly configured. `NEXT_PUBLIC_GRAPHQL_API_URL` env var must be set.",
    );
  }

  const authorization = req.headers
    .get("authorization")
    ?.replace("Bearer ", "");

  // Strictly set the necessary properties to avoid passing other headers that wreak havoc (e.g. SSL certs collisions)
  const headers = new Headers();
  headers.append(
    "Content-Type",
    req.headers.get("content-type") || "application/json",
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
    const client = await getAPIServiceGraphqlClient();
    const getApiKey = getApiKeySdk(client);
    const response = await getApiKey.ApiKeyQuery({ key_id });

    if (!response.api_key.length) {
      return errorUnauthenticated("Invalid or inactive API key.", req);
    }

    // Verify the secret against the given API key
    if (!verifyHashedSecret(key_id, secret, response.api_key[0].api_key)) {
      return errorUnauthenticated("Invalid API key secret.", req);
    }

    headers.delete("Authorization");
    headers.append(
      "Authorization",
      `Bearer ${await generateAPIKeyJWT(response.api_key[0].team_id)}`,
    );
  } else if (authorization) {
    // If we get a service key or reviewer key in the authorization header, pass it through
    headers.append("authorization", `Bearer ${authorization}`);
  }

  const body = await req.json();

  if (!body) {
    return NextResponse.json(
      {
        code: "unsupported_media_type",
        detail: "The body request does not look like a valid JSON payload.",
        attribute: null,
      },
      { status: 415 },
    );
  }

  let res = NextResponse.json({ success: true });
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
    body: JSON.stringify(body),
  });

  return NextResponse.json(await response.json(), { status: response.status });
}
