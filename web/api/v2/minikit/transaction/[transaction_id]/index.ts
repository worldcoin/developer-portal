import { errorResponse } from "@/api/helpers/errors";
import { logger } from "@/lib/logger";
import { TransactionTypes } from "@/lib/types";
import { createSignedFetcher } from "aws-sigv4-fetch";
import { NextRequest, NextResponse } from "next/server";

function corsHandler(response: NextResponse) {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  return response;
}

// TODO: Improve Rate Limiting on this endpoint

export const GET = async (
  req: NextRequest,
  { params: routeParams }: { params: { transaction_id: string } },
) => {
  const { searchParams } = new URL(req.url);

  const appId = searchParams.get("app_id");
  const type = searchParams.get("type") ?? TransactionTypes.Payment;

  if (
    type !== TransactionTypes.Payment &&
    type !== TransactionTypes.Transaction
  ) {
    return corsHandler(
      errorResponse({
        statusCode: 400,
        code: "invalid_request",
        detail: "Invalid transaction type.",
        attribute: "type",
        req,
      }),
    );
  }

  if (!appId) {
    return corsHandler(
      errorResponse({
        statusCode: 400,
        code: "invalid_request",
        detail: "App ID is required.",
        attribute: "app_id",
        req,
      }),
    );
  }

  const transactionId = routeParams.transaction_id;

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

  if (!res.ok) {
    logger.warn("Error fetching transaction data", {
      status: res.status,
      statusText: res.statusText,
    });

    return corsHandler(
      errorResponse({
        statusCode: res.status,
        code: "internal_api_error",
        detail: "Transaction fetch to backend failed",
        attribute: "transaction",
        req,
      }),
    );
  }

  const data = await res.json();

  if (data?.result?.transactions.length !== 0) {
    const transaction = data?.result?.transactions[0];
    const response = NextResponse.json(transaction, { status: 200 });
    return corsHandler(response);
  } else {
    return corsHandler(
      errorResponse({
        statusCode: 404,
        code: "not_found",
        detail: "Transaction not found.",
        attribute: "transaction",
        req,
      }),
    );
  }
};

export async function OPTIONS(request: NextRequest) {
  return corsHandler(new NextResponse(null, { status: 204 }));
}
