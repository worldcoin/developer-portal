import { errorResponse } from "@/api/helpers/errors";
import { validateRequestSchema } from "@/api/helpers/validate-request-schema";
import { logger } from "@/lib/logger";
import { createSignedFetcher } from "aws-sigv4-fetch";
import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";

function corsHandler(response: NextResponse) {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  return response;
}

const appIdRegex = /^app_[a-f0-9]{32}$/;

const schema = yup.object({
  app_id: yup
    .string()
    .matches(appIdRegex, "app_id must be in format app_{32 hex chars}")
    .required(),
});

export const GET = async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);

  const { isValid, parsedParams, handleError } = await validateRequestSchema({
    schema,
    value: {
      app_id: searchParams.get("app_id"),
    },
  });

  if (!isValid) {
    return handleError(req);
  }

  const { app_id: appId } = parsedParams;

  const signedFetch = createSignedFetcher({
    service: "execute-api",
    region: process.env.TRANSACTION_BACKEND_REGION,
  });

  const res = await signedFetch(
    `${process.env.NEXT_SERVER_INTERNAL_PAYMENTS_ENDPOINT}/miniapp-actions/debug?miniapp-id=${appId}`,
    {
      method: "GET",
      headers: {
        "User-Agent": req.headers.get("user-agent") ?? "DevPortal/1.0",
        "Content-Type": "application/json",
      },
    },
  );

  if (!res.ok) {
    const errorBody = await res.text();

    logger.warn("Error fetching debug URL data", {
      status: res.status,
      statusText: res.statusText,
      message: errorBody,
      appId,
    });

    return corsHandler(
      errorResponse({
        statusCode: res.status,
        code: "internal_api_error",
        detail: errorBody ?? "Debug URL data fetch to backend failed",
        attribute: "debug",
        req,
      }),
    );
  }

  const data = await res.json();

  if (!data?.transactions || data.transactions.length === 0) {
    return corsHandler(
      errorResponse({
        statusCode: 404,
        code: "debug_url_not_available",
        detail: "Debug URL is not yet available. Please try again later.",
        attribute: "debug",
        req,
      }),
    );
  }

  const response = NextResponse.json(data, { status: 200 });
  return corsHandler(response);
};

export async function OPTIONS(request: NextRequest) {
  return corsHandler(new NextResponse(null, { status: 204 }));
}
