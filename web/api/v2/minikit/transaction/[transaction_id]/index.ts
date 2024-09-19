import { errorResponse } from "@/api/helpers/errors";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { verifyHashedSecret } from "@/api/helpers/utils";
import { TransactionTypes } from "@/lib/types";
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
  const type = searchParams.get("type") ?? TransactionTypes.Payment;

  if (
    type !== TransactionTypes.Payment &&
    type !== TransactionTypes.Transaction
  ) {
    return errorResponse({
      statusCode: 400,
      code: "invalid_request",
      detail: "Invalid transaction type.",
      attribute: "type",
      req,
    });
  }

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
  let res;
  if (type === TransactionTypes.Payment) {
    res = await signedFetch(
      `${process.env.NEXT_SERVER_INTERNAL_PAYMENTS_ENDPOINT}/miniapp?miniapp-id=${appId}&transaction-id=${transactionId}`,
      {
        method: "GET",
        headers: {
          "User-Agent": req.headers.get("user-agent") ?? "DevPortal/1.0",
          "Content-Type": "application/json",
        },
      },
    );
  } else {
    res = await signedFetch(
      `${process.env.NEXT_SERVER_INTERNAL_PAYMENTS_ENDPOINT}/miniapp-actions?miniapp-id=${appId}&transaction-id=${transactionId}`,
      {
        method: "GET",
        headers: {
          "User-Agent": req.headers.get("user-agent") ?? "DevPortal/1.0",
          "Content-Type": "application/json",
        },
      },
    );
  }

  const data = await res.json();

  if (!res.ok) {
    console.warn("Error fetching transaction", data);

    let errorMessage;
    if (data && data.error) {
      errorMessage = data.error.message;
    } else {
      errorMessage = "Transaction fetch to backend failed";
    }

    return errorResponse({
      statusCode: res.status,
      code: data.error.code ?? "internal_api_error",
      detail: errorMessage,
      attribute: "transaction",
      req,
    });
  }

  if (data?.result?.transactions.length !== 0) {
    const transaction = data?.result?.transactions[0];
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
