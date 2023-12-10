import { NextApiRequest } from "next";
import { NextResponse } from "next/server";

/// Routes API requests to the v1 endpoints
const handleV2APIRoute = async (req: NextApiRequest): Promise<NextResponse> => {
  const path = req.query.route
    ? (req.query.route as string[]).join("/")
    : undefined;

  if (!path) {
    return NextResponse.json({ code: "not_found" }, { status: 404 });
  }

  const url = new URL(req.url!);

  const destUrl = new URL(`/api/v1/${path}`);

  destUrl.search = url.searchParams.toString();

  const headers = new Headers({
    "Content-Type": req.headers["content-type"] || "application/json",
  });

  if (req.headers["authorization"]) {
    headers.append("Authorization", req.headers["authorization"]);
  }

  let body: URLSearchParams | string | undefined;

  if (
    req.body &&
    req.headers["content-type"] === "application/x-www-form-urlencoded"
  ) {
    body = new URLSearchParams(await req.body());
  } else if (req.headers["content-type"] === "application/json") {
    body = JSON.stringify(await req.body());
  }

  const response = await fetch(destUrl, {
    headers,
    method: req.method,
    body: req.method === "POST" ? body : undefined,
  });

  if (response.status === 404) {
    return NextResponse.json({ code: "not_found" }, { status: 404 });
  }

  if (response.status === 429) {
    console.warn("Received 429 response from Developer Portal", req.url);
    return NextResponse.json({ code: "rate_limit" }, { status: 429 });
  }

  if (response.status >= 500) {
    console.error(
      `Received 500+ response from Developer Portal`,
      req.url,
      response.status
    );
    console.error(await response.text());

    return NextResponse.json(
      {
        code: "server_error",
        message: "Internal server error. Please try again.",
      },
      { status: 500 }
    );
  }

  const responseHeaders = new Headers();

  // ANCHOR: Passthrough CORS headers
  const corsOrigin = response.headers.get("allow-control-allow-origin");
  const corsMethods = response.headers.get("allow-control-allow-methods");
  const corsHeaders = response.headers.get("allow-control-allow-headers");

  if (corsOrigin) {
    responseHeaders.append("Access-Control-Allow-Origin", corsOrigin);
  }
  if (corsMethods) {
    responseHeaders.append("Access-Control-Allow-Methods", corsMethods);
  }

  if (corsHeaders) {
    responseHeaders.append("Access-Control-Allow-Headers", corsHeaders);
  }

  return NextResponse.json(await response.json(), {
    headers: responseHeaders,
    status: response.status,
  });
};

export const GET = handleV2APIRoute;
export const POST = handleV2APIRoute;
