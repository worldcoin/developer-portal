import { verifyApiKey } from "@/api/helpers/auth/verify-api-key";
import { errorResponse } from "@/api/helpers/errors";
import {
  getUserOperationReceipt,
  UserOperationReceipt,
} from "@/api/helpers/temporal-rpc";
import { corsHandler } from "@/api/helpers/utils";
import { validateRequestSchema } from "@/api/helpers/validate-request-schema";
import { appIdSchema } from "@/lib/schema";
import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";

const userOperationHashRegex = /^0x[a-f0-9]{64}$/;

const schema = yup
  .object({
    app_id: appIdSchema,
  })
  .noUnknown();

const corsMethods = ["GET", "OPTIONS"];

type UserOpStatusResponse = {
  status: "pending" | "success" | "failed";
  userOpHash: string;
  sender: string | null;
  transaction_hash: string | null;
  nonce: string | null;
};

const getTransactionHash = (receipt: UserOperationReceipt) =>
  receipt.receipt?.transactionHash ??
  receipt.receipt?.transaction_hash ??
  receipt.transactionHash ??
  receipt.transaction_hash ??
  null;

const toStatusResponse = (
  userOpHash: string,
  receipt: UserOperationReceipt | null,
): UserOpStatusResponse => {
  if (!receipt) {
    return {
      status: "pending",
      userOpHash,
      sender: null,
      transaction_hash: null,
      nonce: null,
    };
  }

  return {
    status: receipt.success ? "success" : "failed",
    userOpHash,
    sender: receipt.sender ?? null,
    transaction_hash: getTransactionHash(receipt),
    nonce: receipt.nonce ?? null,
  };
};

export const GET = async (
  req: NextRequest,
  { params }: { params: { user_op_hash: string } },
) => {
  const userOpHash = params.user_op_hash;

  if (!userOperationHashRegex.test(userOpHash)) {
    return corsHandler(
      errorResponse({
        statusCode: 400,
        code: "invalid_parameter",
        detail: "Invalid user operation hash",
        attribute: "user_op_hash",
        req,
      }),
      corsMethods,
    );
  }

  const { searchParams } = new URL(req.url);
  const { isValid, parsedParams, handleError } = await validateRequestSchema({
    schema,
    value: {
      app_id: searchParams.get("app_id"),
    },
  });

  if (!isValid) {
    return corsHandler(handleError(req), corsMethods);
  }

  const { app_id: appId } = parsedParams;
  const apiKeyResult = await verifyApiKey({
    req,
    appId,
  });

  if (!apiKeyResult.success) {
    return corsHandler(apiKeyResult.errorResponse, corsMethods);
  }

  try {
    const receipt = await getUserOperationReceipt(userOpHash);
    return corsHandler(
      NextResponse.json(toStatusResponse(userOpHash, receipt), { status: 200 }),
      corsMethods,
    );
  } catch {
    return corsHandler(
      errorResponse({
        statusCode: 500,
        code: "internal_api_error",
        detail: "Failed to fetch user operation status",
        attribute: "user_op_hash",
        req,
        app_id: appId,
        team_id: apiKeyResult.teamId,
      }),
      corsMethods,
    );
  }
};

export async function OPTIONS() {
  return corsHandler(new NextResponse(null, { status: 204 }), corsMethods);
}
