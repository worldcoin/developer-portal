import { errorResponse } from "@/api/helpers/errors";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { verifyHashedSecret } from "@/api/helpers/utils";
import { TransactionMetadata } from "@/lib/types";
import { captureEvent } from "@/services/posthogClient";
import { createSignedFetcher } from "aws-sigv4-fetch";
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

  const signedFetch = createSignedFetcher({
    service: "execute-api",
    region: process.env.TRANSACTION_BACKEND_REGION,
  });

  const res = await signedFetch(
    `${process.env.NEXT_SERVER_INTERNAL_PAYMENTS_ENDPOINT}?miniapp-id=${appId}&transaction-id=${transactionId}`,
    {
      method: "GET",
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );

  const data = await res.json();

  if (!res.ok) {
    console.warn("Failed to fetch transaction data", res);
    console.warn("Transaction data", data);
    console.warn("Transaction ID", await res.text());
    let errorMessage;
    if (data && data.error) {
      errorMessage = data.error.message;
    } else {
      errorMessage = "Unknown error";
    }

    return errorResponse({
      statusCode: res.status,
      code: "internal_server_error_transaction",
      detail: "Transaction fetch to backend failed",
      attribute: "transaction",
      req,
    });
  }

  if (data?.result?.transactions.length !== 0) {
    const transaction = data?.result?.transactions[0] as TransactionMetadata;
    await captureEvent({
      event: "miniapp_payment_queried",
      distinctId: transaction.transactionId,
      properties: {
        input_token: transaction.inputToken,
        token_amount: transaction.inputTokenAmount,
        appId: transaction.miniappId,
      },
    });
    return NextResponse.json(transaction, { status: 200 });
  } else {
    return errorResponse({
      statusCode: 404,
      code: "not_found",
      detail: "Transaction not found.",
      attribute: "transaction",
      req,
    });
  }
};
