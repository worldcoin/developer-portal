import { errorResponse } from "@/api/helpers/errors";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { verifyHashedSecret } from "@/api/helpers/utils";
import { logger } from "@/lib/logger";
import { TransactionMetadata } from "@/lib/types";
import { captureEvent } from "@/services/posthogClient";
import { NextRequest, NextResponse } from "next/server";
import { getSdk as fetchApiKeySdk } from "./graphql/fetch-api-key.generated";

export const GET = async (
  req: NextRequest,
  { params: routeParams }: { params: { transaction_id: string } },
) => {
  const api_key = req.headers.get("authorization")?.split(" ")[1];
  const { searchParams } = new URL(req.url);

  if (!api_key) {
    return errorResponse({
      statusCode: 401,
      code: "unauthorized",
      detail: "API key is required.",
      attribute: "api_key",
      req,
    });
  }

  const appId = searchParams.get("app_id");
  if (!appId) {
    return errorResponse({
      statusCode: 400,
      code: "invalid_request",
      detail: "App ID is required.",
      attribute: "app_id",
      req,
    });
  }

  const transactionId = routeParams.transaction_id;
  const keyValue = api_key.replace(/^api_/, "");
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
    });
  }

  if (!api_key_by_pk.is_active) {
    return errorResponse({
      statusCode: 400,
      code: "api_key_inactive",
      detail: "API key is inactive.",
      attribute: "api_key",
      req,
    });
  }

  if (!api_key_by_pk.team.apps.some((a) => a.id === appId)) {
    return errorResponse({
      statusCode: 403,
      code: "invalid_app",
      detail: "API key is not valid for this app.",
      attribute: "api_key",
      req,
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
    });
  }

  const res = await fetch(
    `${process.env.NEXT_SERVER_INTERNAL_PAYMENTS_ENDPOINT}?miniapp-id=${appId}&transaction-id=${transactionId}`,
    {
      method: "GET",
    },
  );

  if (!res.ok) {
    logger.error("Failed to fetch transaction data", res);

    return errorResponse({
      statusCode: res.status,
      code: "internal_server_error",
      detail: "Failed to fetch transaction data.",
      attribute: "transaction",
      req,
    });
  }
  const data = await res.json();

  if (data.length !== 0) {
    const transaction = data[0] as TransactionMetadata;

    await captureEvent({
      event: "miniapp_payment_queried",
      distinctId: transaction.transactionId,
      properties: {
        input_token: transaction.inputToken,
        token_amount: transaction.inputTokenAmount,
        appId: transaction.miniappId,
      },
    });
  }

  return NextResponse.json(data, { status: 200 });
};
