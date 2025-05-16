import { errorResponse } from "@/api/helpers/errors";
import { corsHandler } from "@/api/helpers/utils";
import { validateRequestSchema } from "@/api/helpers/validate-request-schema";
import { logger } from "@/lib/logger";
import { appIdSchema } from "@/lib/schema";
import { TransactionTypes } from "@/lib/types";
import { createSignedFetcher } from "aws-sigv4-fetch";
import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";

const transactionIdRegex = /^0x[a-f0-9]{64}$/;

const schema = yup.object({
  app_id: appIdSchema,
  type: yup.string().oneOf(Object.values(TransactionTypes)).required(),
});

const corsMethods = ["GET", "OPTIONS"];

export const GET = async (
  req: NextRequest,
  { params: routeParams }: { params: { transaction_id: string } },
) => {
  const { searchParams } = new URL(req.url);
  const transactionId = routeParams.transaction_id;

  // Add transaction_id validation
  if (!transactionIdRegex.test(transactionId)) {
    return corsHandler(
      errorResponse({
        statusCode: 400,
        code: "invalid_parameter",
        detail: "Invalid transaction ID",
        attribute: "transaction_id",
        req,
      }),
      corsMethods,
    );
  }

  const { isValid, parsedParams, handleError } = await validateRequestSchema({
    schema,
    value: {
      app_id: searchParams.get("app_id"),
      type: searchParams.get("type") ?? TransactionTypes.Payment,
    },
  });

  if (!isValid) {
    return handleError(req);
  }

  const { app_id: appId, type } = parsedParams;

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
    const errorBody = await res.json();
    // console.log("errorBody", JSON.parse(await res.text()));

    logger.warn("Error fetching transaction data", {
      status: res.status,
      statusText: res.statusText,
      message: JSON.stringify(errorBody),
      app_id: appId,
      transactionId,
      type,
    });

    return corsHandler(
      errorResponse({
        statusCode: res.status,
        code: errorBody?.error?.code ?? "internal_api_error",
        detail:
          errorBody?.error?.details ?? "Transaction fetch to backend failed",
        attribute: errorBody?.error?.message ?? "transaction",
        req,
        app_id: appId,
      }),
      corsMethods,
    );
  }

  const data = await res.json();

  if (data?.result?.transactions.length !== 0) {
    const transaction = data?.result?.transactions[0];
    const response = NextResponse.json(transaction, { status: 200 });
    return corsHandler(response, corsMethods);
  } else {
    return corsHandler(
      errorResponse({
        statusCode: 404,
        code: "not_found",
        detail:
          "Transaction not found. Please double check your transaction ID and the transaction belongs to this app_id.",
        attribute: "transaction",
        req,
        app_id: appId,
      }),
      corsMethods,
    );
  }
};

export async function OPTIONS(request: NextRequest) {
  return corsHandler(new NextResponse(null, { status: 204 }), corsMethods);
}
