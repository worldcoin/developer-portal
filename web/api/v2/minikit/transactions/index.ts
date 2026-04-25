import { errorResponse } from "@/api/helpers/errors";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { corsHandler, verifyHashedSecret } from "@/api/helpers/utils";
import { validateRequestSchema } from "@/api/helpers/validate-request-schema";
import { logger } from "@/lib/logger";
import { appIdSchema } from "@/lib/schema";
import { createSignedFetcher } from "aws-sigv4-fetch";
import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";
import { getSdk as fetchApiKeySdk } from "../graphql/fetch-api-key.generated";

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;

const schema = yup
  .object({
    mini_app_id: appIdSchema,
    limit: yup.number().integer().min(1).max(MAX_LIMIT).default(DEFAULT_LIMIT),
  })
  .noUnknown();

const corsMethods = ["GET", "OPTIONS"];

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
  const rawLimit = searchParams.get("limit");

  const { isValid, parsedParams, handleError } = await validateRequestSchema({
    schema,
    value: {
      mini_app_id: searchParams.get("mini_app_id"),
      limit: rawLimit !== null ? Number(rawLimit) : DEFAULT_LIMIT,
    },
  });

  if (!isValid) {
    return handleError(req);
  }

  const { mini_app_id: miniAppId, limit } = parsedParams;

  const keyValue = apiKey.replace(/^api_/, "");
  const base64ApiKey = Buffer.from(keyValue, "base64").toString("utf8");
  const [id, secret] = base64ApiKey.split(":");
  const serviceClient = await getAPIServiceGraphqlClient();

  const { api_key_by_pk } = await fetchApiKeySdk(serviceClient).FetchAPIKey({
    id,
    appId: miniAppId,
  });

  if (!api_key_by_pk) {
    return errorResponse({
      statusCode: 404,
      code: "not_found",
      detail: "API key not found.",
      attribute: "api_key",
      req,
      app_id: miniAppId,
    });
  }

  if (!api_key_by_pk.is_active) {
    return errorResponse({
      statusCode: 400,
      code: "api_key_inactive",
      detail: "API key is inactive.",
      attribute: "api_key",
      req,
      app_id: miniAppId,
    });
  }

  if (!api_key_by_pk.team.apps.some((a) => a.id === miniAppId)) {
    return errorResponse({
      statusCode: 403,
      code: "invalid_app",
      detail: "API key is not valid for this app.",
      attribute: "api_key",
      req,
      app_id: miniAppId,
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
      app_id: miniAppId,
    });
  }

  let signedFetch = global.TransactionSignedFetcher;
  if (!signedFetch) {
    signedFetch = createSignedFetcher({
      service: "execute-api",
      region: process.env.TRANSACTION_BACKEND_REGION,
    });
  }

  const res = await signedFetch(
    `${process.env.NEXT_SERVER_INTERNAL_PAYMENTS_ENDPOINT}/miniapp-actions?miniapp-id=${miniAppId}&limit=${limit}`,
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

    logger.warn("Error fetching mini-app transactions", {
      status: res.status,
      statusText: res.statusText,
      message: errorBody,
      app_id: miniAppId,
    });

    return corsHandler(
      errorResponse({
        statusCode: res.status,
        code: "internal_api_error",
        detail: errorBody ?? "Transaction fetch to backend failed",
        attribute: "transactions",
        req,
        app_id: miniAppId,
      }),
      corsMethods,
    );
  }

  const data = await res.json();

  const transactions = (data?.result?.transactions ?? [])
    .sort(
      (a: { updatedAt: string }, b: { updatedAt: string }) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )
    .slice(0, limit);

  const response = NextResponse.json({ transactions }, { status: 200 });
  return corsHandler(response, corsMethods);
};

export async function OPTIONS(request: NextRequest) {
  return corsHandler(new NextResponse(null, { status: 204 }), corsMethods);
}
