import { errorResponse } from "@/api/helpers/errors";
import { validateRequestSchema } from "@/api/helpers/validate-request-schema";
import { logger } from "@/lib/logger";
import { TransactionTypes } from "@/lib/types";
import { createSignedFetcher } from "aws-sigv4-fetch";
import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";

function corsHandler(response: NextResponse) {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  return response;
}

const appIdRegex = /^app_[a-f0-9]{32}$/;
const transactionIdRegex = /^0x[a-f0-9]{64}$/;

const schema = yup.object({
  app_id: yup
    .string()
    .matches(appIdRegex, "app_id must be in format app_{32 hex chars}")
    .required(),
  type: yup.string().oneOf(Object.values(TransactionTypes)).required(),
});

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
    const errorBody = await res.text();

    logger.warn("Error fetching transaction data", {
      status: res.status,
      statusText: res.statusText,
      message: errorBody,
      appId,
      transactionId,
      type,
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
