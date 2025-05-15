import { errorResponse, errorUnauthenticated } from "@/api/helpers/errors";
import { verifyOIDCJWT } from "@/api/helpers/jwts";
import { NextRequest, NextResponse } from "next/server";

function corsHandler(response: NextResponse) {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS, GET");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type");
  return response;
}

/**
 * Handles GET requests for the userinfo endpoint
 */
export async function GET(req: NextRequest) {
  const authorization = req.headers.get("authorization");
  if (!authorization) {
    return corsHandler(errorUnauthenticated("Missing credentials.", req));
  }

  const token = authorization.replace("Bearer ", "");

  try {
    const payload = await verifyOIDCJWT(token);
    const response: Record<string, any> = {
      sub: payload.sub,
      "https://id.worldcoin.org/beta": payload["https://id.worldcoin.org/beta"],
      "https://id.worldcoin.org/v1": payload["https://id.worldcoin.org/v1"],
    };
    const scopes = (payload.scope as string)?.toString().split(" ");

    if (scopes?.includes("email")) {
      response.email = `${payload.sub}@id.worldcoin.org`;
    }

    if (scopes?.includes("profile")) {
      response.name = "World ID User";
      response.given_name = "World ID";
      response.family_name = "User";
    }

    return corsHandler(NextResponse.json(response));
  } catch {
    return corsHandler(
      errorResponse({
        statusCode: 401,
        code: "invalid_token",
        detail: "Token is invalid or expired.",
        attribute: "token",
        req,
      }),
    );
  }
}

/**
 * Handles POST requests for the userinfo endpoint
 */
export async function POST(req: NextRequest) {
  const authorization = req.headers.get("authorization");
  if (!authorization) {
    return corsHandler(errorUnauthenticated("Missing credentials.", req));
  }

  const token = authorization.replace("Bearer ", "");

  try {
    const payload = await verifyOIDCJWT(token);
    const response: Record<string, any> = {
      sub: payload.sub,
      "https://id.worldcoin.org/beta": payload["https://id.worldcoin.org/beta"],
      "https://id.worldcoin.org/v1": payload["https://id.worldcoin.org/v1"],
    };
    const scopes = (payload.scope as string)?.toString().split(" ");

    if (scopes?.includes("email")) {
      response.email = `${payload.sub}@id.worldcoin.org`;
    }

    if (scopes?.includes("profile")) {
      response.name = "World ID User";
      response.given_name = "World ID";
      response.family_name = "User";
    }

    return corsHandler(NextResponse.json(response));
  } catch {
    return corsHandler(
      errorResponse({
        statusCode: 401,
        code: "invalid_token",
        detail: "Token is invalid or expired.",
        attribute: "token",
        req,
      }),
    );
  }
}

/**
 * Handles OPTIONS requests
 */
export async function OPTIONS(req: NextRequest) {
  return corsHandler(new NextResponse(null, { status: 204 }));
}
