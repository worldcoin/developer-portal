import { errorUnauthenticated, errorValidation } from "@/api/helpers/errors";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { generateAPIKeyJWT, generateUserJWT } from "@/api/helpers/jwts";
import { parseRequestBody } from "@/api/helpers/parse-request-body";
import { verifyHashedSecret } from "@/api/helpers/utils";
import { auth0, toSessionRequest } from "@/lib/auth0";
import dayjs from "dayjs";
import { NextRequest, NextResponse } from "next/server";
import { getSdk as getApiKeySdk } from "./graphql/get-api-key.generated";

export async function POST(req: NextRequest) {
  if (!process.env.NEXT_PUBLIC_GRAPHQL_API_URL) {
    throw new Error(
      "Improperly configured. `NEXT_PUBLIC_GRAPHQL_API_URL` env var must be set.",
    );
  }

  // Reject non-JSON request bodies up front so a form-encoded or otherwise
  // malformed payload does not surface as an unhandled SyntaxError from
  // `req.json()`. Media-type tokens are case-insensitive per RFC 9110, so
  // normalise before matching to keep mixed-case clients working
  // (e.g. `Application/JSON; charset=UTF-8`).
  const contentType = req.headers.get("content-type")?.toLowerCase();
  if (!contentType?.includes("application/json")) {
    return errorValidation(
      "invalid_content_type",
      "Content-Type must be application/json.",
      "content-type",
      req,
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

  const parseResult = await parseRequestBody(req);
  if (!parseResult.isValid) {
    return parseResult.error;
  }
  const body = parseResult.body;

  if (!headers.get("authorization")) {
    // NOTE: Check if user data exists in auth0 session and create a temporary user JWT.
    // Use a body-free request: the body was already read above (parseRequestBody),
    // and on Next 16 the SDK re-wraps + copies the request body, which would throw.
    const session = await auth0.getSession(toSessionRequest(req));
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

  let response;
  try {
    response = await fetch(process.env.NEXT_PUBLIC_GRAPHQL_API_URL, {
      method: req.method,
      // @ts-ignore
      headers,
      body: JSON.stringify(body),
    });
  } catch (error) {
    console.error("Error making GraphQL request:", error);
    return NextResponse.json(
      {
        code: "internal_error",
        detail: "Failed to make GraphQL request",
        attribute: null,
      },
      { status: 500 },
    );
  }

  try {
    const responseJson = await response.json();
    return NextResponse.json(responseJson, { status: response.status });
  } catch (error) {
    console.error("Error parsing GraphQL response:", error);
    return NextResponse.json(
      {
        code: "internal_error",
        detail: "Failed to parse GraphQL response as JSON",
        attribute: null,
      },
      { status: 500 },
    );
  }
}
