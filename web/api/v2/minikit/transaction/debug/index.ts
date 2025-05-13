import { errorResponse } from "@/api/helpers/errors";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { verifyHashedSecret } from "@/api/helpers/utils";
import { validateRequestSchema } from "@/api/helpers/validate-request-schema";
import { logger } from "@/lib/logger";
import { appIdSchema } from "@/lib/schema";
import { createSignedFetcher } from "aws-sigv4-fetch";
import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";
import { getSdk as fetchApiKeySdk } from "../../graphql/fetch-api-key.generated";

function corsHandler(response: NextResponse) {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  return response;
}

const schema = yup.object({
  app_id: appIdSchema,
});

export const GET = async (req: NextRequest) => {
  const apiKey = req.headers.get("authorization")?.split(" ")[1];

  if (!apiKey) {
    return errorResponse({
      statusCode: 401,
      code: "unauthorized",
      detail: "API key is required.",
      attribute: "api_key",
      req,
    });
  }

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

  const keyValue = apiKey.replace(/^api_/, "");
  const base64ApiKey = Buffer.from(keyValue, "base64").toString("utf8");
  const [id, secret] = base64ApiKey.split(":");
  const serviceClient = await getAPIServiceGraphqlClient();

  const { api_key_by_pk } = await fetchApiKeySdk(serviceClient).FetchAPIKey({
    id,
    appId: appId,
  });

  if (!api_key_by_pk) {
    return errorResponse({
      statusCode: 404,
      code: "not_found",
      detail: "API key not found.",
      attribute: "api_key",
      req,
      app_id: appId,
    });
  }

  if (!api_key_by_pk.is_active) {
    return errorResponse({
      statusCode: 400,
      code: "api_key_inactive",
      detail: "API key is inactive.",
      attribute: "api_key",
      req,
      app_id: appId,
    });
  }

  if (!api_key_by_pk.team.apps.some((a) => a.id === appId)) {
    return errorResponse({
      statusCode: 403,
      code: "invalid_app",
      detail: "API key is not valid for this app.",
      attribute: "api_key",
      req,
      app_id: appId,
    });
  }

  const isAPIKeyValid = verifyHashedSecret(
    api_key_by_pk.id,
    secret,
    api_key_by_pk.api_key,
  );

  if (!isAPIKeyValid) {
    return errorResponse({
      statusCode: 403,
      code: "invalid_api_key",
      detail: "API key is not valid.",
      attribute: "api_key",
      req,
      app_id: appId,
    });
  }

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
      app_id: appId,
    });

    return corsHandler(
      errorResponse({
        statusCode: res.status,
        code: "internal_api_error",
        detail: errorBody ?? "Debug URL data fetch to backend failed",
        attribute: "debug",
        req,
        app_id: appId,
      }),
    );
  }

  const data = await res.json();

  if (!data?.result?.transactions || data.result.transactions.length === 0) {
    return corsHandler(
      errorResponse({
        statusCode: 404,
        code: "debug_url_not_available",
        detail: "Debug URL is not yet available. Please try again later.",
        attribute: "debug",
        req,
        app_id: appId,
      }),
    );
  }

  const response = NextResponse.json(data.result, { status: 200 });
  return corsHandler(response);
};

export async function OPTIONS(request: NextRequest) {
  return corsHandler(new NextResponse(null, { status: 204 }));
}
